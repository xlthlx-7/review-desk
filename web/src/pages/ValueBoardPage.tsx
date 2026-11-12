import { useEffect, useState } from 'react'
import { getDashboard } from '../api'
import { ErrorText, Frame } from '../features/common'
import { hasRole, useSession } from '../session'
import type { Dashboard } from '../types'

const KEYS = ['本月审查时长', '相对基线节省的时长', '采纳率', '驳回率', '拦截的重大项数量', '重复问题下降', '新增规则数'] as const

export function ValueBoardPage() {
  const { me } = useSession()
  const [scope, setScope] = useState<'self' | 'project'>(hasRole(me.roles, '项目负责人') ? 'project' : 'self')
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard(scope, 'p-bridge').then(setData).catch((err: Error) => setError(err.message))
  }, [scope])

  return (
    <Frame title="价值看板">
      <ErrorText error={error} />
      {hasRole(me.roles, '项目负责人') ? (
        <div className="actions">
          <button type="button" onClick={() => setScope('self')}>自己参与的任务</button>
          <button type="button" onClick={() => setScope('project')}>本项目</button>
        </div>
      ) : null}
      <div className="metrics">
        {KEYS.map((key) => (
          <p key={key}>{key}<strong>{data?.[key]}</strong></p>
        ))}
      </div>
    </Frame>
  )
}
