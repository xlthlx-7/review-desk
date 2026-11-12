import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteKnowledgeRecord,
  saveKnowledgeRecord,
  getBackfill,
  getCandidateDiff,
  getCandidates,
  getCases,
  getRegulations,
  maskCandidate,
  publishCandidate,
  setHistoricalUse,
  trialCandidate,
} from '../api'
import { RecordEditor, type RecordField } from '../features/RecordEditor'
import { ErrorText, Frame } from '../features/common'
import { hasRole, useSession } from '../session'
import type { BackfillItem, Candidate, CandidateDiff, KnowledgeCase, Regulation } from '../types'

const sections = ['法规', '企业规则', '案例', '补库队列'] as const

type KnowledgeRecord = Regulation | Candidate | KnowledgeCase | BackfillItem

const fields: Record<typeof sections[number], RecordField[]> = {
  法规: [
    { name: 'name', label: '法规名称' },
    { name: 'version', label: '版本' },
    { name: 'effectiveAt', label: '生效日期', type: 'date', optional: true },
    { name: 'expiredAt', label: '失效日期', type: 'date', optional: true },
    { name: 'scope', label: '适用范围', optional: true },
  ],
  企业规则: [
    { name: 'riskType', label: '风险类型' },
    { name: 'pattern', label: '规则正文', type: 'textarea' },
    { name: 'decision', label: '处理结论', optional: true },
    { name: 'reason', label: '规则原因', optional: true },
    { name: 'sourceTaskId', label: '来源任务编号', optional: true },
  ],
  案例: [{ name: 'title', label: '案例标题' }, { name: 'summary', label: '案例摘要', type: 'textarea' }],
  补库队列: [{ name: 'reason', label: '补库原因', type: 'textarea' }],
}

async function readKnowledge() {
  const [regulations, candidates, cases, backfill] = await Promise.all([
    getRegulations(), getCandidates(), getCases(), getBackfill(),
  ])
  return { regulations, candidates, cases, backfill }
}

export function KnowledgePage() {
  const { me } = useSession()
  const admin = hasRole(me.roles, '知识管理员')
  const [data, setData] = useState<Awaited<ReturnType<typeof readKnowledge>> | null>(null)
  const [section, setSection] = useState<typeof sections[number]>('法规')
  const [query, setQuery] = useState('')
  const [diff, setDiff] = useState<{ id: string; value: CandidateDiff } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    readKnowledge().then((result) => {
      if (active) setData(result)
    }).catch((err: Error) => {
      if (active) setError(err.message)
    })
    return () => { active = false }
  }, [])

  async function run(action: () => Promise<unknown>, success: string, refresh = true) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(success)
      if (refresh) setData(await readKnowledge())
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试。')
      return false
    } finally {
      setBusy(false)
    }
  }

  const keyword = query.trim().toLowerCase()
  const matches = (...fields: string[]) => fields.some((field) => field.toLowerCase().includes(keyword))
  const regulations = data?.regulations.filter((item) => matches(item.name, item.version, item.scope)) ?? []
  const candidates = data?.candidates.filter((item) => matches(item.riskType, item.pattern, item.reason, item.decision, item.sourceTaskId)) ?? []
  const cases = data?.cases.filter((item) => matches(item.title, item.summary)) ?? []
  const backfill = data?.backfill.filter((item) => matches(item.id, item.reason)) ?? []
  const total = [data?.regulations.length, data?.candidates.length, data?.cases.length, data?.backfill.length]
  const shown = [regulations.length, candidates.length, cases.length, backfill.length][sections.indexOf(section)]

  function editor(item?: KnowledgeRecord) {
    if (!admin) return null
    const current = item ? Object.fromEntries(Object.entries(item)) : {}
    return <RecordEditor
      key={item?.id ?? section}
      label={item ? '编辑' : section === '补库队列' ? '新增补库事项' : `新增${section}`}
      fields={fields[section].map((field) => ({ ...field, value: current[field.name] }))}
      busy={busy}
      onSave={(values) => run(async () => {
        if (fields[section].some((field) => !field.optional && !values[field.name])) {
          throw new Error('请填写必填字段。')
        }
        const id = item?.id ?? crypto.randomUUID()
        const record = { ...values, id }
        if (section === '法规') {
          if (values.effectiveAt && values.expiredAt && values.expiredAt < values.effectiveAt) {
            throw new Error('失效日期不能早于生效日期。')
          }
          await saveKnowledgeRecord({ ...record, name: values.name, version: values.version, effectiveAt: values.effectiveAt, expiredAt: values.expiredAt, scope: values.scope, historicalUse: Boolean(current.historicalUse) })
        } else if (section === '企业规则') {
          await saveKnowledgeRecord({ ...record, riskType: values.riskType, pattern: values.pattern, decision: values.decision, reason: values.reason, sourceTaskId: values.sourceTaskId, published: Boolean(current.published) })
          setDiff(null)
        } else if (section === '案例') {
          await saveKnowledgeRecord({ id, title: values.title, summary: values.summary })
        } else {
          await saveKnowledgeRecord({ id, reason: values.reason })
        }
        if (!item) setQuery('')
      }, item ? '已保存修改。' : '已新增记录。')}
      onDelete={item ? () => run(() => deleteKnowledgeRecord(section, item.id), '已删除记录。') : undefined}
    />
  }

  function ruleActions(item: Candidate) {
    return (
      <>
        <div className="actions knowledge-actions">
          {!item.published && <>
            <button type="button" disabled={busy} onClick={() => void run(() => maskCandidate(item.id), '规则已脱敏。')}>脱敏</button>
            <button type="button" disabled={busy} onClick={() => void run(() => trialCandidate(item.id), '已开启试用，仅对新任务生效。')}>试用</button>
            <button type="button" disabled={busy} onClick={() => void run(() => publishCandidate(item.id), '规则已发布。')}>发布</button>
          </>}
          <button type="button" disabled={busy} aria-expanded={diff?.id === item.id} onClick={() => {
            if (diff?.id === item.id) setDiff(null)
            else void run(async () => setDiff({ id: item.id, value: await getCandidateDiff(item.id) }), '', false)
          }}>正文差异</button>
        </div>
        {diff?.id === item.id && (
          <section className="knowledge-diff" aria-label="正文差异">
            <p className="meta">{diff.value.operator} {diff.value.at}</p>
            <dl className="knowledge-fields">
              <div><dt>修改前</dt><dd>{diff.value.before || '无正文'}</dd></div>
              <div><dt>修改后</dt><dd>{diff.value.after || '无正文'}</dd></div>
            </dl>
          </section>
        )}
      </>
    )
  }

  return (
    <Frame title="知识库">
      <div className="workbench-layout knowledge-layout">
        <aside className="workspace-nav">
          <nav aria-label="知识库分类">
            {sections.map((name, index) => (
              <button key={name} type="button" aria-pressed={section === name} onClick={() => {
                setSection(name)
                setQuery('')
              }}>
                <span>{name}</span>{data && <span className="meta">{total[index]}</span>}
              </button>
            ))}
          </nav>
        </aside>
        <section className="workspace-panel" aria-labelledby="knowledge-section">
          <header className="workspace-heading">
            <h2 id="knowledge-section">{section}</h2>
            {data && <span className="meta" aria-live="polite">{shown} 条记录</span>}
          </header>
          <div className="knowledge-search">
            <input type="search" aria-label={`搜索${section}`} placeholder={`搜索${section}`} value={query} onChange={(event) => setQuery(event.target.value)} />
            {query && <button type="button" onClick={() => setQuery('')}>清除</button>}
          </div>
          {data && editor()}
          <ErrorText error={error} />
          {message && <p className="knowledge-message" role="status">{message}</p>}
          {!data && !error && <p role="status">正在加载知识库…</p>}
          {data && shown === 0 && <p className="review-empty">{keyword ? '没有匹配的记录，试试其他关键词。' : `暂无${section}记录。`}</p>}
          {section === '法规' && regulations.map((item) => (
            <article className="knowledge-record" key={item.id}>
              <header><h3>{item.name}</h3><span className="knowledge-status">{item.historicalUse ? '已启用历史适用' : item.expiredAt ? '有失效日期' : '未登记失效日期'}</span></header>
              <dl className="knowledge-fields">
                <div><dt>版本</dt><dd>{item.version || '未记录'}</dd></div>
                <div><dt>生效日期</dt><dd>{item.effectiveAt || '未记录'}</dd></div>
                <div><dt>失效日期</dt><dd>{item.expiredAt || '未记录'}</dd></div>
                <div><dt>适用范围</dt><dd>{item.scope || '未记录'}</dd></div>
              </dl>
              {item.expiredAt && !item.historicalUse && <p className="meta">失效后默认不参与新任务。</p>}
              {admin && <button type="button" disabled={busy} onClick={() => void run(
                () => setHistoricalUse(item.id, !item.historicalUse),
                item.historicalUse ? '已取消历史适用。' : '已启用历史适用。',
              )}>{item.historicalUse ? '取消历史适用' : '启用历史适用'}</button>}
              {editor(item)}
            </article>
          ))}
          {section === '企业规则' && <>
            <p className="meta">从驳回原因生成的抑制规则，在发布前不进入正式检索。</p>
            {candidates.map((item) => (
              <article className="knowledge-record" key={item.id}>
                <header><h3>{item.riskType}规则</h3><span className="knowledge-status">{item.published ? '已发布' : '待发布'}</span></header>
                <p className="knowledge-text">{item.pattern}</p>
                <dl className="knowledge-fields">
                  <div><dt>处理结论</dt><dd>{item.decision || '未记录'}</dd></div>
                  <div><dt>规则原因</dt><dd>{item.reason || '未记录'}</dd></div>
                  <div><dt>来源任务</dt><dd>{item.sourceTaskId ? <Link to={`/tasks/${item.sourceTaskId}`}>{item.sourceTaskId}</Link> : '未记录'}</dd></div>
                </dl>
                {editor(item)}
                {admin && ruleActions(item)}
              </article>
            ))}
          </>}
          {section === '案例' && cases.map((item) => (
            <article className="knowledge-record" key={item.id}><h3>{item.title}</h3><p className="knowledge-text">{item.summary}</p>{editor(item)}</article>
          ))}
          {section === '补库队列' && backfill.map((item) => (
            <article className="knowledge-record" key={item.id}><h3>{item.reason}</h3><p className="meta">记录编号 {item.id}</p>{editor(item)}</article>
          ))}
        </section>
      </div>
    </Frame>
  )
}
