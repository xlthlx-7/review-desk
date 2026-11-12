import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { archiveTask, exportReport, getReport, getTask, registerSend } from '../api'
import { ErrorText, Frame } from '../features/common'
import { atLeast } from '../release'
import { hasRole, useSession } from '../session'
import type { Report, Task } from '../types'

const CHANNELS = ['系统内登记', '邮件', 'OA']

export function ReportPage() {
  const { taskId = '' } = useParams()
  const { me, config } = useSession()
  const [task, setTask] = useState<Task | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [includeNegotiation, setIncludeNegotiation] = useState(false)
  const [channel, setChannel] = useState(CHANNELS[0])
  const [recipient, setRecipient] = useState('')
  const [sentAt, setSentAt] = useState('')
  const [note, setNote] = useState('')
  const [archiveReason, setArchiveReason] = useState('')
  const [error, setError] = useState('')

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [download, setDownload] = useState('')

  const load = useCallback(() => {
    return Promise.all([getTask(taskId), getReport(taskId)])
      .then(([nextTask, nextReport]) => {
        setTask(nextTask)
        setReport(nextReport)
      })
      .catch((err: Error) => setError(err.message))
  }, [taskId])

  useEffect(() => { void load() }, [load])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试。')
    } finally {
      setBusy(false)
    }
  }

  if (!task || task.taskId !== taskId || !report) return <Frame title="报告">{error ? <ErrorText error={error} /> : <p role="status">正在加载报告…</p>}</Frame>

  const canExport = hasRole(me.roles, '审查员') || hasRole(me.roles, '法务') || hasRole(me.roles, '项目负责人')
  const sections = [
    ['基本信息', report.sections.基本信息],
    ['材料卡摘要', report.sections.材料卡摘要],
    ['重大风险', report.sections.重大风险],
    ['一般风险', report.sections.一般风险],
    ['提示', report.sections.提示],
    ['已驳回清单', report.sections.已驳回清单],
    ['证据清单', report.sections.证据清单],
    ['谈判话术', report.sections.谈判话术],
  ] as const

  function jumpToSection(event: React.MouseEvent<HTMLAnchorElement>) {
    if (import.meta.env.MODE !== 'pages') return
    event.preventDefault()
    const section = document.getElementById(event.currentTarget.hash.slice(1))
    section?.focus({ preventScroll: true })
    section?.scrollIntoView()
  }

  const canRegister = canExport && atLeast(config.release, 'R2') && task.status === '已完成'
  const canArchive = hasRole(me.roles, '项目负责人') && task.status === '已完成'

  return (
    <Frame title="审查报告" next={task.next} warning={task.showPaymentArchiveWarning}>
      <header className="report-heading">
        <Link to={`/tasks/${taskId}`}>返回任务详情</Link>
        <div className="workspace-heading">
          <h2>{task.title}</h2>
          <span className={report.finalized ? 'knowledge-status' : 'report-draft'}>{report.finalized ? '已定稿' : '非定稿'}</span>
        </div>
        <dl className="knowledge-fields">
          <div><dt>项目</dt><dd>{report.watermark.project}</dd></div>
          <div><dt>报告版本</dt><dd>{report.watermark.version}</dd></div>
          <div><dt>生成时间</dt><dd>{report.watermark.generatedAt}</dd></div>
          <div><dt>操作人</dt><dd>{report.watermark.operator}</dd></div>
        </dl>
      </header>
      <div className="workbench-layout report-layout">
        <aside className="workspace-nav report-nav">
          <nav aria-label="报告目录">
            {sections.map(([name, body], index) => (
              <a key={name} href={`#report-section-${index}`} onClick={jumpToSection}>
                <span>{name}</span>{Array.isArray(body) && <span className="meta">{body.length}</span>}
              </a>
            ))}
            {canExport && <a href="#report-actions" onClick={jumpToSection}>报告操作</a>}
          </nav>
        </aside>
        <div className="report-content">
          <article className="workspace-panel">
            {sections.map(([name, body], index) => (
              <section key={name} id={`report-section-${index}`} className="report-section" tabIndex={-1}>
                <header className="workspace-heading">
                  <h2 className={name === '重大风险' && body.length ? 'risk-major' : ''}>{name}</h2>
                  {Array.isArray(body) && <span className="meta">{body.length} 条</span>}
                </header>
                {typeof body === 'string' ? <p className="knowledge-text">{body || '暂无内容。'}</p>
                  : body.length ? <ul className="report-items">
                    {body.map((item, index) => {
                      const source = new URLSearchParams()
                      if (item.riskId) source.set('riskId', item.riskId)
                      if (item.docId && item.page != null && item.version != null) {
                        source.set('docId', item.docId)
                        source.set('version', String(item.version))
                        source.set('page', String(item.page))
                      }
                      return (
                        <li key={`${item.riskId ?? name}/${index}`}>
                          <p className="knowledge-text">{item.text}</p>
                          {item.rawText && <blockquote>{item.rawText}</blockquote>}
                          {source.size > 0 && <Link to={`/tasks/${taskId}/review?${source}`}>
                            {source.has('page') ? `查看原文 · 版本 ${item.version} 第 ${item.page} 页` : '查看风险'}
                          </Link>}
                          {item.at && <span className="meta"> {item.at}</span>}
                        </li>
                      )
                    })}
                  </ul> : <p className="meta">暂无记录。</p>}
              </section>
            ))}
          </article>
          {canExport && <section className="workspace-panel report-operations" id="report-actions" tabIndex={-1} aria-labelledby="report-action-title">
            <header className="workspace-heading"><h2 id="report-action-title">报告操作</h2></header>
            <ErrorText error={error} />
            {message && <p className="knowledge-message" role="status">{message}</p>}
            <div className="actions">
              <label><input type="checkbox" checked={includeNegotiation} onChange={(event) => {
                setIncludeNegotiation(event.target.checked)
                setDownload('')
              }} /> 导出时加入谈判话术</label>
              <button type="button" disabled={busy || !report.exportEnabled || report.frozen} onClick={() => void run(async () => {
                setDownload('')
                const file = await exportReport(taskId, includeNegotiation)
                const url = new URL(file.pdfUrl, window.location.href)
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                  setDownload(url.href)
                  setMessage(`版本 ${file.version} 的 PDF 已就绪。`)
                } else {
                  setMessage(`版本 ${file.version} 的模拟导出已完成。`)
                }
              })}>导出 PDF</button>
              {download && <a href={download}>打开 PDF</a>}
            </div>
            {(report.frozen || !report.exportEnabled) && <p className="meta">{report.frozen ? '报告已冻结，暂不可导出。' : '完成待确认事项后可导出。'}</p>}
            {canRegister && <form className="form report-form" onSubmit={(event) => {
              event.preventDefault()
              void run(async () => {
                await registerSend(taskId, { channel, recipient: recipient.trim(), sentAt, note })
                setMessage('发送记录已保存。')
                await load()
              })
            }}>
              <h3>登记发送</h3>
              <label>发送渠道<select value={channel} onChange={(event) => setChannel(event.target.value)}>{CHANNELS.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>接收方<input required value={recipient} onChange={(event) => setRecipient(event.target.value)} /></label>
              <label>发送日期<input required type="date" value={sentAt} onChange={(event) => setSentAt(event.target.value)} /></label>
              <label>备注<input value={note} onChange={(event) => setNote(event.target.value)} /></label>
              <button type="submit" disabled={busy || !recipient.trim()}>保存发送记录</button>
            </form>}
            {canArchive && <form className="form report-form" onSubmit={(event) => {
              event.preventDefault()
              void run(async () => {
                await archiveTask(taskId, archiveReason.trim())
                setMessage('任务已归档。')
                await load()
              })
            }}>
              <h3>无需发送</h3>
              <label>归档原因<input required value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} /></label>
              <button type="submit" disabled={busy || !archiveReason.trim()}>归档任务</button>
            </form>}
          </section>}
        </div>
      </div>
    </Frame>
  )
}
