import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMaterialCard, getTask, saveMaterialCard } from '../api'
import { ErrorText, Frame } from '../features/common'
import { atLeast } from '../release'
import { hasRole, useSession } from '../session'
import type { MaterialCard, Task } from '../types'

export function MaterialCardPage() {
  const { taskId = '' } = useParams()
  const { me, config } = useSession()
  const [task, setTask] = useState<Task | null>(null)
  const [card, setCard] = useState<MaterialCard | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const metaOnly = hasRole(me.roles, '系统管理员') && !hasRole(me.roles, '审查员') && !hasRole(me.roles, '法务')
  const canEdit = !metaOnly && !hasRole(me.roles, '商务') && (hasRole(me.roles, '审查员') || hasRole(me.roles, '法务') || hasRole(me.roles, '技术负责人') || hasRole(me.roles, '项目负责人'))

  useEffect(() => {
    Promise.all([getTask(taskId), getMaterialCard(taskId, metaOnly)])
      .then(([nextTask, nextCard]) => {
        setTask(nextTask)
        setCard(nextCard)
      })
      .catch((err: Error) => setError(err.message))
  }, [taskId, metaOnly])

  if (!task || !card) return <Frame title="材料卡"><ErrorText error={error || '正在读取'} /></Frame>

  const fields = [...card.fields].sort((a, b) => Number(b.unrecognized) - Number(a.unrecognized))

  async function save() {
    if (!card) return
    try {
      const saved = await saveMaterialCard(taskId, reason, card.fields.map((field) => ({ key: field.key, value: field.value })))
      setCard(saved)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  return (
    <Frame title="材料卡" next={task.next}>
      <ErrorText error={error} />
      {card.metaOnly ? <p>仅异常文件元数据</p> : null}
      {atLeast(config.release, 'R2') && card.historicalHints.length > 0 ? (
        <ul>
          {card.historicalHints.map((hint) => (
            <li key={hint.topic}>{hint.topic}：{hint.conclusion}（来源任务 {hint.sourceTaskId}）</li>
          ))}
        </ul>
      ) : null}
      <form className="form" onSubmit={(event) => { event.preventDefault(); void save() }}>
        {fields.map((field) => (
          <label key={field.key}>
            {field.key}{field.unrecognized ? ' 未识别' : ''}
            <input
              value={field.value}
              disabled={!canEdit || card.locked}
              onChange={(event) => {
                const value = event.target.value
                setCard({ ...card, fields: card.fields.map((item) => item.key === field.key ? { ...item, value } : item) })
              }}
            />
            {field.page ? (
              <Link to={`/tasks/${taskId}/review?docId=${field.docId}&version=${field.version}&page=${field.page}`}>第 {field.page} 页</Link>
            ) : null}
          </label>
        ))}
        {canEdit && !card.locked ? (
          <>
            <label>原因<textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label>
            <button type="submit" disabled={!reason.trim()}>保存校正</button>
          </>
        ) : null}
        {card.locked ? <p>已锁定</p> : null}
      </form>
    </Frame>
  )
}
