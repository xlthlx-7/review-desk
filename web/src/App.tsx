import type { ReactNode } from 'react'
import { BrowserRouter, HashRouter, matchPath, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { atLeast } from './release'
import { SessionProvider, hasRole, useSession } from './session'
import { WorkbenchPage } from './pages/WorkbenchPage'
import { TaskCreatePage } from './pages/TaskCreatePage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { MaterialCardPage } from './pages/MaterialCardPage'
import { ReviewDeskPage } from './pages/ReviewDeskPage'
import { ReviewQueuePage } from './pages/ReviewQueuePage'
import { ReportPage } from './pages/ReportPage'
import { FollowUpPage } from './pages/FollowUpPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { VersionDiffPage } from './pages/VersionDiffPage'
import { ExceptionCenterPage } from './pages/ExceptionCenterPage'
import { AdminAuditPage } from './pages/AdminAuditPage'
import { ValueBoardPage } from './pages/ValueBoardPage'

function Gate({ allow, children }: { allow: boolean; children: ReactNode }) {
  if (!allow) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { me, config } = useSession()
  const roles = me.roles
  const r2 = atLeast(config.release, 'R2')
  const r3 = atLeast(config.release, 'R3')
  const canCreate = hasRole(roles, '审查员') || hasRole(roles, '法务') || hasRole(roles, '项目负责人')
  const canReview = hasRole(roles, '法务') || hasRole(roles, '技术负责人')
  const canManage = hasRole(roles, '系统管理员') || hasRole(roles, '项目负责人')
  const { pathname } = useLocation()
  const task = matchPath('/tasks/:taskId/*', pathname)?.params.taskId
  const taskBase = task && task !== 'new' ? `/tasks/${encodeURIComponent(task)}` : ''
  const modules = [
    { to: '/', label: '工作台', visible: true },
    { to: '/tasks/new', label: '新建审查', visible: canCreate },
    { to: '/review-queue', label: '复核队列', visible: canReview },
    { to: '/knowledge', label: '知识库', visible: r2 && (canReview || hasRole(roles, '知识管理员')) },
    { to: '/exceptions', label: '异常中心', visible: hasRole(roles, '系统管理员') },
    { to: '/admin', label: '管理与审计', visible: canManage },
    { to: '/dashboard', label: '价值看板', visible: r3 && (hasRole(roles, '项目负责人') || hasRole(roles, '法务')) },
  ]
  const taskPages = [
    { suffix: '', label: '任务详情', visible: true },
    { suffix: '/material', label: '材料卡', visible: true },
    { suffix: '/review', label: '审查工作台', visible: true },
    { suffix: '/report', label: '审查报告', visible: true },
    { suffix: '/follow-up', label: '跟进', visible: r2 },
    { suffix: '/diff', label: '版本对比', visible: r2 },
  ]

  return (
    <div className="app-shell">
      <a href="#app-content" className="skip-link" onClick={(event) => {
        event.preventDefault()
        document.getElementById('app-content')?.focus()
      }}>跳到正文</a>
      <aside className="app-sidebar">
        <NavLink className="app-brand" to="/" end>审阅台</NavLink>
        <nav className="app-nav" aria-label="系统模块">
          {modules.filter((item) => item.visible).map((item) => (
            <NavLink key={item.to} to={item.to} end>{item.label}</NavLink>
          ))}
        </nav>
        {taskBase && <nav className="app-nav task-nav" aria-label="当前任务">
          <p>当前任务</p>
          {taskPages.filter((item) => item.visible).map((item) => (
            <NavLink key={item.suffix} to={taskBase + item.suffix} end>{item.label}</NavLink>
          ))}
        </nav>}
      </aside>
      <main id="app-content" className="app-content" tabIndex={-1}>
        <Routes>
            <Route path="/" element={<WorkbenchPage />} />
            <Route path="/tasks/new" element={<Gate allow={canCreate}><TaskCreatePage /></Gate>} />
            <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="/tasks/:taskId/material" element={<MaterialCardPage />} />
            <Route path="/tasks/:taskId/review" element={<ReviewDeskPage />} />
            <Route path="/review-queue" element={<Gate allow={canReview}><ReviewQueuePage /></Gate>} />
            <Route path="/tasks/:taskId/report" element={<ReportPage />} />
            <Route path="/tasks/:taskId/follow-up" element={r2 ? <FollowUpPage /> : <Navigate to="/" replace />} />
            <Route path="/knowledge" element={r2 ? <KnowledgePage /> : <Navigate to="/" replace />} />
            <Route path="/tasks/:taskId/diff" element={r2 ? <VersionDiffPage /> : <Navigate to="/" replace />} />
            <Route path="/exceptions" element={<Gate allow={hasRole(roles, '系统管理员')}><ExceptionCenterPage /></Gate>} />
            <Route path="/admin" element={<Gate allow={canManage}><AdminAuditPage /></Gate>} />
            <Route path="/dashboard" element={r3 ? <ValueBoardPage /> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const Router = import.meta.env.MODE === 'pages' ? HashRouter : BrowserRouter
  return (
    <Router>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </Router>
  )
}
