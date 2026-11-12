import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getConfig, getMe } from './api'
import type { AppConfig, Me, Role } from './types'

interface SessionValue {
  me: Me
  config: AppConfig
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<SessionValue | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getMe(), getConfig()])
      .then(([me, config]) => setValue({ me, config }))
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) return <p className="banner">{error}</p>
  if (!value) return <p className="banner">正在读取当前用户</p>
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('session missing')
  return value
}

export function hasRole(roles: Role[], role: Role) {
  return roles.includes(role)
}
