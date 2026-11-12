import { useEffect, useState } from 'react'
import { closeTask, enableManualMode, getExceptions, rerunTask, resolveVersion } from '../api'
import { ErrorText, Frame, TaskProgress } from '../features/common'
import { hasRole, useSession } from '../session'
import type { ExceptionItem } from '../types'

export function ExceptionCenterPage() {
  const { me } = useSession()
  const [items, setItems] = useState<ExceptionItem[]>([])
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  function load() {
    return getExceptions().then(setItems).catch((err: Error) => setError(err.message))
  }

  useEffect(() => { void load() }, [])

  const admin = hasRole(me.roles, '系统管理员')
  const owner = hasRole(me.roles, '项目负责人') || admin

  return (
    <Frame title="异常中心">
      <ErrorText error={error} />
      {note ? <p>{note}</p> : null}
      {items.map((item) => (
        <article key={`${item.ex}${item.taskId}`} className="card">
          <TaskProgress next={item.next} />
          <h2>{item.ex} {item.title}</h2>
          <p>失败原因 {item.reason}</p>
          <p>失败页 {item.failedPages.join('、') || '无'}</p>
          <p>建议动作 {item.suggestion || '无'}</p>
          <p>原始文件入口 {item.fileUrl}</p>
          <p>责任人 {item.ownerRole}</p>
          {item.ex === 'EX-05' && owner ? (
            <button type="button" onClick={() => { void resolveVersion(item.taskId, 'd-enc', 1).then(() => setNote('已指定唯一版本，恢复审查')).then(load) }}>
              指定唯一版本
            </button>
          ) : null}
          {item.ex === 'EX-09' && admin ? (
            <button type="button" onClick={() => { void rerunTask(item.taskId).then((result) => setNote(`已保留 ${result.kept.length} 张合格卡片`)) }}>
              重跑
            </button>
          ) : null}
        </article>
      ))}
      {admin ? (
        <button type="button" onClick={() => { void enableManualMode('t-enc').then(() => setNote('已转为人工审查')) }}>
          转为人工审查
        </button>
      ) : null}
      {hasRole(me.roles, '项目负责人') ? (
        <form className="form" onSubmit={(event) => {
          event.preventDefault()
          void closeTask('t-enc', reason).then(() => setNote('已关闭，记为终止')).catch((err: Error) => setError(err.message))
        }}>
          <label>原因<input value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          <button type="submit" disabled={!reason.trim()}>关闭任务</button>
        </form>
      ) : null}
    </Frame>
  )
}
