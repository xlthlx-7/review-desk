import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDiff, getPreview, getTask } from '../api'
import { ErrorText, Frame, SourcePreview } from '../features/common'
import type { DiffResult, Preview, Task } from '../types'

const FILTERS = ['新增', '修改', '删除', '未关闭']

export function VersionDiffPage() {
  const { taskId = '' } = useParams()
  const [task, setTask] = useState<Task | null>(null)
  const [diff, setDiff] = useState<DiffResult | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [left, setLeft] = useState<Preview | null>(null)
  const [right, setRight] = useState<Preview | null>(null)
  const [highlight, setHighlight] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getTask(taskId).then(setTask).catch((err: Error) => setError(err.message))
  }, [taskId])

  useEffect(() => {
    getDiff(taskId, picked).then((result) => {
      setDiff(result)
      return Promise.all([
        getPreview(result.left.docId, result.left.version, 6),
        getPreview(result.right.docId, result.right.version, 6),
      ])
    }).then(([nextLeft, nextRight]) => {
      setLeft(nextLeft)
      setRight(nextRight)
    }).catch((err: Error) => setError(err.message))
  }, [taskId, picked])

  if (!task || !diff) return <Frame title="版本对比"><ErrorText error={error || '正在读取'} /></Frame>

  return (
    <Frame title="版本对比" next={task.next}>
      <ErrorText error={error} />
      <div className="checks">
        {FILTERS.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={picked.includes(item)}
              onChange={(event) => setPicked(event.target.checked ? [...picked, item] : picked.filter((name) => name !== item))}
            />
            {item}
          </label>
        ))}
      </div>
      <div className="split split-3">
        <div>
          <p>{diff.left.label}</p>
          <SourcePreview preview={left} highlight={highlight} />
        </div>
        <div>
          <ul>
            {diff.rows.map((row) => (
              <li key={row.id}>
                <button type="button" onClick={() => setHighlight(row.leftText || row.rightText)}>
                  {row.change}{row.aligned ? '' : ' 无法对齐'}
                </button>
                {row.riskId ? <Link to={`/tasks/${taskId}/review?riskId=${row.riskId}`}>打开对应风险卡片</Link> : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p>{diff.right.label}</p>
          <SourcePreview preview={right} highlight={highlight} />
        </div>
      </div>
    </Frame>
  )
}
