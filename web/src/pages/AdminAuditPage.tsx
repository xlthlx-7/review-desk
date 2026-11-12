import { useEffect, useState } from 'react'
import { exportAuditLogs, getAuditLogs, getConfig, getMembers, saveMembers } from '../api'
import { RecordEditor } from '../features/RecordEditor'
import { ErrorText, Frame } from '../features/common'
import { hasRole, useSession } from '../session'
import type { AppConfig, AuditLog, ProjectMember, Role } from '../types'

const ROLES: Role[] = ['审查员', '法务', '技术负责人', '知识管理员', '系统管理员', '项目负责人', '商务']
const ACTIONS = ['上传', '定版', '质检结果', '材料卡改正', '卡片生成与拦截', '裁决', '批量确认', '报告导出', '发送登记', '跟进关闭', '规则发布与停用', '权限变更', '脱敏导出']

export function AdminAuditPage() {
  const { me } = useSession()
  const [members, setMembers] = useState<ProjectMember[] | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [action, setAction] = useState('')
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [section, setSection] = useState('操作日志')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState('')
  const [error, setError] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [memberBusy, setMemberBusy] = useState(false)
  const [memberMessage, setMemberMessage] = useState('')
  const admin = hasRole(me.roles, '系统管理员')

  useEffect(() => {
    let active = true
    getAuditLogs(action).then((result) => {
      if (active) setLogs(result)
    }).catch((err: Error) => {
      if (active) {
        setLogs([])
        setError(err.message)
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [action])

  useEffect(() => {
    getConfig().then(setConfig).catch((err: Error) => setError(err.message))
    if (admin) getMembers('p-bridge').then(setMembers).catch((err: Error) => setError(err.message))
  }, [admin])

  async function changeMembers(change: () => ProjectMember[], message: string) {
    setMemberBusy(true)
    setError('')
    setMemberMessage('')
    try {
      setMembers(await saveMembers('p-bridge', change()))
      setMemberMessage(message)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存成员失败。')
      return false
    } finally {
      setMemberBusy(false)
    }
  }

  function memberEditor(member?: ProjectMember) {
    if (!members) return null
    return <RecordEditor
      label={member ? '编辑成员' : '新增成员'}
      busy={memberBusy}
      fields={[
        ...(!member ? [{ name: 'accountId', label: '账号编号' }] : []),
        { name: 'name', label: '姓名', value: member?.name },
        { name: 'roles', label: '角色（多个角色用顿号分隔）', value: member?.roles.join('、'), optional: true },
      ]}
      onSave={(values) => changeMembers(() => {
        const accountId = member?.accountId ?? values.accountId
        if (!accountId || !values.name) throw new Error('请填写账号编号和姓名。')
        if (!member && members.some((entry) => entry.accountId === accountId)) throw new Error('该账号已在项目中。')
        const roles = [...new Set(values.roles.split(/[、,，]/).map((role) => role.trim()).filter(Boolean))]
        if (roles.some((role) => !ROLES.includes(role as Role))) throw new Error(`可选角色为${ROLES.join('、')}。`)
        const next = { accountId, name: values.name, roles: roles as Role[] }
        if (!member) setMemberQuery('')
        return member ? members.map((entry) => entry.accountId === accountId ? next : entry) : [...members, next]
      }, member ? '已更新成员。' : '已新增成员。')}
      onDelete={member ? () => changeMembers(() => members.filter((entry) => entry.accountId !== member.accountId), '已移除成员。') : undefined}
    />
  }

  async function prepareExport() {
    setExporting(true)
    setError('')
    try {
      setExported(await exportAuditLogs())
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成脱敏副本失败。')
    } finally {
      setExporting(false)
    }
  }

  function downloadExport() {
    const url = URL.createObjectURL(new Blob([exported], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = '审计日志-脱敏副本.txt'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const keyword = query.trim().toLowerCase()
  const visible = logs.filter((log) =>
    [log.operator, log.objectId, log.reason].some((field) => field.toLowerCase().includes(keyword)),
  ).sort((left, right) => right.at.localeCompare(left.at))

  const memberKeyword = memberQuery.trim().toLowerCase()
  const visibleMembers = (members ?? []).filter((member) =>
    [member.name, member.accountId, ...member.roles].some((value) => value.toLowerCase().includes(memberKeyword)),
  )

  return (
    <Frame title="管理与审计">
      <div className="workbench-layout audit-layout">
        <aside className="workspace-nav queue-nav">
          <nav aria-label="管理与审计导航">
            {(admin ? ['操作日志', '项目成员', '脱敏导出'] : ['操作日志']).map((item) => (
              <button key={item} type="button" aria-pressed={section === item} onClick={() => setSection(item)}>{item}</button>
            ))}
          </nav>
        </aside>
        <section className="workspace-panel" aria-labelledby="audit-heading">
          <header className="workspace-heading"><h2 id="audit-heading">{section}</h2></header>
          <ErrorText error={error} />
          {section === '操作日志' && <>
            {config && <p className="meta">默认保留 {config.retentionYears} 年，到期前 {config.retentionWarnDays} 天提醒管理员。</p>}
            <div className="audit-filters">
              <label>操作类型
                <select value={action} onChange={(event) => {
                  setError('')
                  setLoading(true)
                  setAction(event.target.value)
                }}>
                  <option value="">全部动作</option>
                  {ACTIONS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>搜索日志
                <input type="search" placeholder="操作人、对象编号或原因" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
            </div>
            {loading ? <p role="status">正在加载操作日志…</p> : <>
              {!error && <p className="meta" role="status">{visible.length} 条记录</p>}
              {!error && visible.length === 0 && <p className="review-empty">没有符合当前条件的日志。</p>}
              {visible.map((log, index) => (
                <article className="knowledge-record" key={JSON.stringify([log, index])}>
                  <header><h3>{log.action}</h3><time className="meta">{log.at}</time></header>
                  <dl className="knowledge-fields">
                    <div><dt>操作人</dt><dd>{log.operator || '未记录'}</dd></div>
                    <div><dt>对象编号</dt><dd>{log.objectId || '未记录'}</dd></div>
                    <div><dt>操作原因</dt><dd>{log.reason || '未记录'}</dd></div>
                  </dl>
                  {(log.before || log.after) && <details className="audit-diff">
                    <summary>查看变更前后</summary>
                    <dl className="knowledge-fields">
                      <div><dt>变更前</dt><dd>{log.before || '无内容'}</dd></div>
                      <div><dt>变更后</dt><dd>{log.after || '无内容'}</dd></div>
                    </dl>
                  </details>}
                </article>
              ))}
            </>}
          </>}
          {admin && section === '项目成员' && <>
            <p className="meta">桥梁项目</p>
            <div className="knowledge-search">
              <input type="search" aria-label="搜索项目成员" placeholder="姓名、账号编号或角色" value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} />
            </div>
            {memberEditor()}
            {memberMessage && <p role="status">{memberMessage}</p>}
            {members && !visibleMembers.length && <p className="review-empty">没有符合条件的项目成员。</p>}
            {visibleMembers.map((member) => (
              <article className="knowledge-record" key={member.accountId}>
                <header><h3>{member.name}</h3><span className="meta">{member.accountId}</span></header>
                <p>{member.roles.join('、') || '未分配角色'}</p>
                {memberEditor(member)}
              </article>
            ))}
          </>}
          {admin && section === '脱敏导出' && <>
            <p>身份证号、银行账号、手机号和邮箱替换为掩码。价款和工期保留。</p>
            <div className="actions">
              <button type="button" disabled={exporting} onClick={() => void prepareExport()}>{exporting ? '正在生成…' : '生成脱敏预览'}</button>
              {exported && <button type="button" onClick={downloadExport}>下载文本副本</button>}
            </div>
            {exported && <pre className="audit-preview" aria-label="脱敏副本预览">{exported}</pre>}
          </>}
        </section>
      </div>
    </Frame>
  )
}
