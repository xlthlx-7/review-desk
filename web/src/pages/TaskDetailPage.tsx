import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getTask, getTimeline, markReviewVersion, rereview, uploadNextVersion } from '../api'
import { ErrorText, Frame, RiskNotice } from '../features/common'
import { atLeast } from '../release'
import { hasRole, useSession } from '../session'
import type { Task, TimelineItem } from '../types'

const POLL = new Set(['待解析', '已解析', '审查中'])

export function TaskDetailPage() {
  const navigate = useNavigate()
  const { taskId = '' } = useParams()
  const { me, config } = useSession()
  const [task, setTask] = useState<Task | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [error, setError] = useState('')

  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    return Promise.all([getTask(taskId), getTimeline(taskId)])
      .then(([nextTask, nextTimeline]) => {
        setTask(nextTask)
        setTimeline(nextTimeline)
      })
      .catch((err: Error) => setError(err.message))
  }, [taskId])

  useEffect(() => {
    void load()
  }, [load])

  const status = task?.taskId === taskId ? task.status : undefined
  useEffect(() => {
    if (!status || !POLL.has(status)) return
    const timer = window.setInterval(() => { void load() }, 8000)
    return () => window.clearInterval(timer)
  }, [status, load])

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
    <Frame title="任务详情">{error ? <ErrorText error={error} /> : <p role="status">正在加载任务…</p>}</Frame>
  )

  const owner = hasRole(me.roles, '审查员') || hasRole(me.roles, '法务') || hasRole(me.roles, '项目负责人')
  const r2 = atLeast(config.release, 'R2')
  const base = `/tasks/${task.taskId}`
  const versions = [...task.versions].sort((left, right) => right.version - left.version)
  const reviewing = versions.find((version) => version.reviewing)
  const latest = versions[0]

  return (
    <Frame title="任务详情">
      <div className="task-detail-layout">
        <section className="workspace-panel task-summary" aria-labelledby="task-title">
          <div className="workspace-heading">
            <div>
              <p className="meta">{[task.projectName, task.taskId].filter(Boolean).join(' · ')}</p>
              <h2 id="task-title">{task.title}</h2>
            </div>
            <Link className="primary-action" to={`${base}/review`}>进入审查工作台</Link>
          </div>
          <p><span className="knowledge-status">{task.closedAs || task.status}</span></p>
          {task.status === '待确认' && task.reviewStatusNote && <p>{task.reviewStatusNote}</p>}
          <dl className="knowledge-fields">
            <div><dt>当前责任人</dt><dd>{task.next.ownerName}</dd></div>
            <div><dt>还需完成</dt><dd>{task.next.exitGap}</dd></div>
            <div><dt>超时接手人</dt><dd>{task.next.timeoutHandover}</dd></div>
          </dl>
          {task.showPaymentArchiveWarning && <RiskNotice />}
          <nav className="task-links" aria-label="任务相关页面">
            <Link to={`${base}/material`}>查看材料</Link>
            <Link to={`${base}/report`}>查看报告</Link>
            {r2 && <><Link to={`${base}/follow-up`}>查看跟进</Link><Link to={`${base}/diff`}>对比版本</Link></>}
          </nav>
        </section>
        <section className="workspace-panel" aria-labelledby="versions-heading">
          <header className="workspace-heading">
            <h2 id="versions-heading">材料版本</h2><span className="meta">{versions.length} 个版本</span>
          </header>
          <ErrorText error={error} />
          {message && <p className="knowledge-message" role="status">{message}</p>}
          {latest && reviewing && latest.version > reviewing.version && (
            <p className="review-attention">当前审查使用版本 {reviewing.version}，最新上传为版本 {latest.version}。</p>
          )}
          {task.duplicateUpload && <p className="review-attention">{task.duplicateUpload}</p>}
          {!versions.length && <p className="review-empty">暂无材料版本。</p>}
          {versions.map((version) => (
            <article className="knowledge-record task-version" key={version.version}>
              <header>
                <h3>版本 {version.version}</h3>
                <div className="task-links">
                  {version.reviewing && <span className="knowledge-status">当前审查</span>}
                  {version === latest && <span className="knowledge-status">最新上传</span>}
                  {version.readonly && <span className="meta">只读</span>}
                </div>
              </header>
              <dl className="knowledge-fields">
                <div><dt>上传人</dt><dd>{version.uploader}</dd></div>
                <div><dt>上传时间</dt><dd>{version.uploadedAt}</dd></div>
                <div><dt>页数</dt><dd>{version.pages} 页</dd></div>
              </dl>
              <details className="audit-diff"><summary>查看文件哈希</summary><p>{version.hash}</p></details>
              {owner && !version.reviewing && <div className="actions">
                <button type="button" disabled={pending} onClick={() => void run(
                  () => markReviewVersion(task.taskId, version.docId, version.version), `已切换到版本 ${version.version}。`,
                )}>设为审查版本</button>
              </div>}
            </article>
          ))}
          {owner && <div className="actions task-version-actions">
            <button type="button" disabled={pending} onClick={() => void run(() => rereview(task.taskId), '已提交重审。')}>按新版本重审</button>
            {r2 && <button type="button" disabled={pending} onClick={() => void run(async () => {
              await uploadNextVersion(task.taskId, '新版本.pdf')
              navigate('/')
            }, '已提交新版本。')}>基于此任务上传新版本</button>}
          </div>}
        </section>
        <aside className="workspace-panel task-members" aria-labelledby="members-heading">
          <header className="workspace-heading"><h2 id="members-heading">任务成员</h2></header>
          {task.members.length ? <ul className="task-plain-list">
            {task.members.map((member) => <li key={`${member.accountId}/${member.role}`}><strong>{member.name}</strong><span className="meta">{member.role}</span></li>)}
          </ul> : <p className="review-empty">暂无成员记录。</p>}
        </aside>
        <section className="workspace-panel task-history" aria-labelledby="timeline-heading">
          <header className="workspace-heading"><h2 id="timeline-heading">任务时间线</h2></header>
          {timeline.length ? <ol className="task-timeline">
            {[...timeline].sort((left, right) => right.at.localeCompare(left.at)).map((item, index) => (
              <li key={`${item.at}/${item.action}/${index}`}>
                <strong>{item.action}</strong>
                <p className="meta">{item.operator} · {item.at}</p>
                {item.reason && <p>{item.reason}</p>}
                {(item.before || item.after) && <details className="audit-diff">
                  <summary>查看变更前后</summary>
                  <dl className="knowledge-fields">
                    <div><dt>变更前</dt><dd>{item.before || '无内容'}</dd></div>
                    <div><dt>变更后</dt><dd>{item.after || '无内容'}</dd></div>
                  </dl>
                </details>}
              </li>
            ))}
          </ol> : <p className="review-empty">暂无操作记录。</p>}
        </section>
      </div>
    </Frame>
  )
}
