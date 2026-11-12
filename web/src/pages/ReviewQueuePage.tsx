import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { coordinate, getCards, getReviewQueue, getTask } from '../api'
import { ErrorText, Frame, TaskProgress } from '../features/common'
import { hasRole, useSession } from '../session'
import type { RiskCard, Task } from '../types'

const actions = ['维持技术票', '维持法务票', '退回双方重审']
const priority = ['冲突', '重大项', '低置信']

export function ReviewQueuePage() {
  const { me } = useSession()
  const [groups, setGroups] = useState<Awaited<ReturnType<typeof getReviewQueue>>['groups'] | null>(null)
  const [tasks, setTasks] = useState<Record<string, Task>>({})
  const [locked, setLocked] = useState<RiskCard[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [loadingDetails, setLoadingDetails] = useState(true)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const canCoordinate = hasRole(me.roles, '项目负责人')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { groups } = await getReviewQueue()
        if (!active) return
        setGroups(groups)
        const taskIds = [...new Set(groups.flatMap((group) => group.taskIds))]
        const [taskResults, cardResults] = await Promise.all([
          Promise.allSettled(taskIds.map(getTask)),
          Promise.allSettled(taskIds.map(getCards)),
        ])
        if (!active) return
        setTasks(Object.fromEntries(taskResults.flatMap((result) =>
          result.status === 'fulfilled' ? [[result.value.taskId, result.value]] : [],
        )))
        setLocked(cardResults.flatMap((result) =>
          result.status === 'fulfilled'
            ? [...result.value.cards, ...result.value.unclosedFirst].filter((card) => card.locked)
            : [],
        ))
        if ([...taskResults, ...cardResults].some((result) => result.status === 'rejected')) {
          setError('部分任务详情或协调记录加载失败，刷新页面可重试。')
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '复核队列加载失败。')
      } finally {
        if (active) setLoadingDetails(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  async function applyCoordination(card: RiskCard, action: string) {
    setPending(true)
    setMessage('')
    setError('')
    try {
      await coordinate(card.taskId, card.riskId, action)
      setMessage(`已记录「${action}」。`)
      const [list, task] = await Promise.all([getCards(card.taskId), getTask(card.taskId)])
      setLocked((current) => [
        ...current.filter((item) => item.taskId !== card.taskId),
        ...[...list.cards, ...list.unclosedFirst].filter((item) => item.locked),
      ])
      setTasks((current) => ({ ...current, [task.taskId]: task }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '协调操作失败。')
    } finally {
      setPending(false)
    }
  }

  const orderedGroups = [
    ...(groups ?? []).filter((group) => priority.includes(group.key))
      .sort((left, right) => priority.indexOf(left.key) - priority.indexOf(right.key)),
    ...(groups ?? []).filter((group) => !priority.includes(group.key)),
  ]
  const visible = orderedGroups.filter((group) => !selectedGroup || group.key === selectedGroup)
  const total = new Set(orderedGroups.flatMap((group) => group.taskIds)).size

  return (
    <Frame title="复核队列">
      <div className="workbench-layout queue-layout">
        <aside className="workspace-nav queue-nav">
          <nav aria-label="复核分类">
            {[{ key: '', title: '全部任务', count: total }, ...orderedGroups.map((group) => ({
              key: group.key, title: group.key, count: group.taskIds.length,
            }))].map(({ key, title, count }) => (
              <button key={key} type="button" aria-pressed={selectedGroup === key} onClick={() => setSelectedGroup(key)}>
                <span>{title}</span>{groups && <span className="meta">{count}</span>}
              </button>
            ))}
          </nav>
        </aside>
        <div className="queue-content">
          <section className="workspace-panel" aria-labelledby="queue-heading">
            <header className="workspace-heading">
              <h2 id="queue-heading">{selectedGroup || '待复核任务'}</h2>
              {groups && <span className="meta" aria-live="polite">{selectedGroup ? visible[0]?.taskIds.length ?? 0 : total} 个任务</span>}
            </header>
            <ErrorText error={error} />
            {message && <p className="knowledge-message" role="status">{message}</p>}
            {loadingDetails && <p className="meta" role="status">正在加载{groups ? '任务详情' : '复核队列'}…</p>}
            {groups && total === 0 && !selectedGroup && <p className="review-empty">暂无待复核任务。</p>}
            {visible.filter((group) => selectedGroup || group.taskIds.length > 0).map((group) => (
              <section className="work-group" key={group.key}>
                {!selectedGroup && <h3>{group.key} <span>{group.taskIds.length}</span></h3>}
                {group.taskIds.length === 0 && <p className="review-empty">此分类暂无任务。</p>}
                {group.taskIds.map((taskId) => {
                  const task = tasks[taskId]
                  const version = task?.versions.find((item) => item.reviewing)
                  return (
                    <article className="queue-row" key={taskId}>
                      <div className="work-item">
                        <div>
                          <Link className="work-title" to={`/tasks/${taskId}`}>{task?.title || taskId}</Link>
                          {task && <p className="meta"><span>{taskId}</span>{task.projectName && <span>{task.projectName}</span>}{version && <span>审查版本 {version.version}</span>}</p>}
                        </div>
                        <div className="queue-row-actions">
                          {task && <span className="knowledge-status">{task.status}</span>}
                          <Link to={`/tasks/${taskId}/review`}>进入复核</Link>
                        </div>
                      </div>
                      {task && <TaskProgress next={task.next} />}
                      {task?.showPaymentArchiveWarning && <p className="queue-warning">重大风险未确认，建议暂缓付款或归档。</p>}
                    </article>
                  )
                })}
              </section>
            ))}
          </section>
          {canCoordinate && locked.length > 0 && (
            <section className="workspace-panel" aria-labelledby="coordination-heading">
              <header className="workspace-heading"><h2 id="coordination-heading">待协调冲突</h2><span className="meta">{locked.length} 条风险</span></header>
              {locked.map((card) => (
                <article key={`${card.taskId}/${card.riskId}`} className="knowledge-record">
                  <header>
                    <h3>{tasks[card.taskId]?.title || card.taskId} · {card.riskType}</h3>
                    <Link to={`/tasks/${card.taskId}/review?riskId=${encodeURIComponent(card.riskId)}`}>查看风险</Link>
                  </header>
                  {card.conflictNote && <p>{card.conflictNote}</p>}
                  {card.votes.length > 0 && <dl className="knowledge-fields">
                    {card.votes.map((vote) => <div key={vote.role}><dt>{vote.role}</dt><dd>{vote.action || vote.status}</dd></div>)}
                  </dl>}
                  <div className="actions">
                    {actions.map((action) => (
                      <button key={action} type="button" disabled={pending} onClick={() => void applyCoordination(card, action)}>{action}</button>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </Frame>
  )
}
