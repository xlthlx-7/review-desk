import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWorkbench } from '../api'
import { ErrorText, Frame } from '../features/common'
import { atLeast } from '../release'
import { hasRole, useSession } from '../session'
import type { Workbench } from '../types'

export function WorkbenchPage() {
  const { me, config } = useSession()
  const [data, setData] = useState<Workbench | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getWorkbench().then(setData).catch((err: Error) => setError(err.message))
  }, [])

  const roles = me.roles
  const showCreate = ['审查员', '法务', '项目负责人'].some((role) => hasRole(roles, role as '审查员'))
  return (
    <Frame title="工作台" next={data?.next}>
      <div className="workbench-content">
        <section className="workspace-panel" aria-labelledby="my-work">
          <header className="workspace-heading">
            <h2 id="my-work">我的待办</h2>
            {showCreate && <Link className="primary-action" to="/tasks/new">新建审查</Link>}
          </header>
          <ErrorText error={error} />
          {!data && !error && <p role="status">正在读取待办…</p>}
          {data && (
            <>
              {data.groups
                .filter((group) => group.key !== '跟进待关闭' || atLeast(config.release, 'R2'))
                .map((group) => (
                  <section className="work-group" key={group.key}>
                    <h3>{group.key} <span>{group.count}</span></h3>
                    {group.items.length === 0 && <p className="meta">暂无任务</p>}
                    {group.items.map((item) => (
                      <div className="work-item" key={item.taskId}>
                        <div>
                          <Link className="work-title" to={`/tasks/${item.taskId}`}>{item.title || item.taskId}</Link>
                          <p className="meta">
                            {item.title && <span>{item.taskId}</span>}
                            {item.version != null && <span>版本 {item.version}</span>}
                            {item.uploadedAt && <span>上传于 {item.uploadedAt}</span>}
                          </p>
                        </div>
                        {group.key === '待我确认' || group.key === '待我补票'
                          ? <Link to={`/tasks/${item.taskId}/review`}>进入审查</Link>
                          : <Link to={`/tasks/${item.taskId}`}>查看任务</Link>}
                      </div>
                    ))}
                  </section>
                ))}
              {data.pendingConfirmStallReason && <p className="review-attention">{data.pendingConfirmStallReason}</p>}
              {atLeast(config.release, 'R3') && data.proactiveCards.map((card) => (
                <p key={card.taskId}><Link to={`/tasks/${card.taskId}/review`}>{card.event}</Link></p>
              ))}
            </>
          )}
        </section>
      </div>
    </Frame>
  )
}
