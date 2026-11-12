import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { archiveTask, closeFollowUp, getFollowUps, getTask, updateFollowUp } from '../api'
import { ErrorText, Frame } from '../features/common'
import { hasRole, useSession } from '../session'
import type { FollowUp, Task } from '../types'

const ATTITUDES = ['接受', '不接受', '部分接受', '未回复'] as const
const REASONS = ['对方接受', '已补签', '谈判后保留', '误报关闭', '不再适用']

export function FollowUpPage() {
  const { taskId = '' } = useParams()
  const { me } = useSession()
  const [task, setTask] = useState<Task | null>(null)
  const [rows, setRows] = useState<FollowUp[]>([])
  const [error, setError] = useState('')
  const canClose = hasRole(me.roles, '审查员') || hasRole(me.roles, '法务') || hasRole(me.roles, '项目负责人')

  const [filter, setFilter] = useState('全部')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const [nextTask, nextRows] = await Promise.all([getTask(taskId), getFollowUps(taskId)])
    setTask(nextTask)
    setRows(nextRows)
  }, [taskId])

  useEffect(() => {
    setError('')
    void load().catch((err: Error) => setError(err.message))
  }, [load])

  async function run(action: () => Promise<unknown>, success: string) {
    setPending(true)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(success)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试。')
    } finally {
      setPending(false)
    }
  }

  if (!task || task.taskId !== taskId) return (
    <Frame title="跟进">{error ? <ErrorText error={error} /> : <p role="status">正在加载跟进事项…</p>}</Frame>
  )

  const open = rows.filter((row) => row.closeStatus !== '已关闭')
  const blockers = open.filter((row) => row.mustClose).length
  const closed = rows.filter((row) => row.closeStatus === '已关闭')
  const visible = filter === '待关闭' ? open : filter === '已关闭' ? closed : [...open, ...closed]

  return (
    <Frame title="跟进" next={task.next}>
      <div className="follow-up-layout">
        <header className="workspace-panel task-summary">
          <Link to={`/tasks/${taskId}`}>返回任务详情</Link>
          <div className="workspace-heading">
            <h2>{task.title}</h2>
            <span className="knowledge-status">{task.status}</span>
          </div>
          <p className={blockers ? 'review-attention' : 'meta'}>
            {blockers ? `还有 ${blockers} 条必关事项，关闭后可归档。` : '必关事项已处理完毕。'}
          </p>
        </header>
        <section className="workspace-panel" aria-labelledby="follow-up-heading">
          <header className="workspace-heading"><h2 id="follow-up-heading">跟进事项</h2></header>
          <div className="review-tabs" role="group" aria-label="筛选跟进事项">
            {[['全部', rows.length], ['待关闭', open.length], ['已关闭', closed.length]].map(([name, count]) => (
              <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(String(name))}>{name} {count}</button>
            ))}
          </div>
          <ErrorText error={error} />
          {message && <p role="status" className="knowledge-message">{message}</p>}
          {!visible.length && <p className="review-empty">当前没有跟进事项。</p>}
          {visible.map((row) => (
            <article key={row.riskId} className="knowledge-record follow-up-record">
              <header>
                <h3>{row.riskType}</h3>
                <div className="task-links">
                  {row.mustClose && <span className="report-draft">归档前必关</span>}
                  <span className="knowledge-status">{row.closeStatus || '未关闭'}</span>
                </div>
              </header>
              <Link to={`/tasks/${taskId}/review?riskId=${encodeURIComponent(row.riskId)}`}>查看审查风险</Link>
              <fieldset disabled={pending} className="follow-up-fields">
                <legend>跟进记录</legend>
                <label>对方态度
                  <select value={row.attitude} onChange={(event) => {
                    const attitude = event.target.value as FollowUp['attitude']
                    void run(() => updateFollowUp(taskId, row.riskId, { attitude }), '已更新对方态度。')
                  }}>
                    {ATTITUDES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label><input type="checkbox" checked={row.needSupplementSign} onChange={(event) => {
                  const needSupplementSign = event.target.checked
                  void run(() => updateFollowUp(taskId, row.riskId, { needSupplementSign }), '已更新补签状态。')
                }} /> 需要补签</label>
                <label><input type="checkbox" checked={row.suggestCase} onChange={(event) => {
                  const saveAsCase = event.target.checked
                  void run(() => updateFollowUp(taskId, row.riskId, { saveAsCase }), '已更新案例标记。')
                }} /> 沉淀为案例</label>
              </fieldset>
              {row.closeStatus === '已关闭' ? (
                <dl className="knowledge-fields">
                  <div><dt>关闭原因</dt><dd>{row.closeReason || '未记录'}</dd></div>
                  <div><dt>关闭人</dt><dd>{row.closedBy || '未记录'}</dd></div>
                  <div><dt>关闭时间</dt><dd>{row.closedAt || '未记录'}</dd></div>
                </dl>
              ) : canClose && (
                <form className="actions follow-up-close" onSubmit={(event) => {
                  event.preventDefault()
                  const reason = new FormData(event.currentTarget).get('reason')
                  if (typeof reason === 'string' && reason) {
                    void run(() => closeFollowUp(taskId, row.riskId, reason, row.suggestCase), '跟进事项已关闭。')
                  }
                }}>
                  <label>关闭原因 <select name="reason" required defaultValue="" disabled={pending}>
                    <option value="">选择关闭原因</option>
                    {REASONS.map((item) => <option key={item}>{item}</option>)}
                  </select></label>
                  <button type="submit" disabled={pending}>关闭事项</button>
                </form>
              )}
            </article>
          ))}
          {canClose && task.status !== '归档' && <div className="actions follow-up-archive">
            <button type="button" disabled={pending || blockers > 0} onClick={() => void run(
              () => archiveTask(taskId, '', true), '任务已归档。',
            )}>归档任务</button>
          </div>}
        </section>
      </div>
    </Frame>
  )
}
