import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  batchConfirm,
  changeLevel,
  createManualCard,
  getCards,
  getOpinionPresets,
  getPreview,
  getStandard,
  getTask,
  reopenCard,
  submitDecision,
} from '../api'
import { ApiError } from '../api/errors'
import { ErrorText, Frame, SourcePreview } from '../features/common'
import { atLeast } from '../release'
import { hasRole, useSession } from '../session'
import type { CardList, Preview, RiskCard, Task } from '../types'

const LEVELS = ['重大', '一般', '提示']
const EVIDENCE = ['高置信', '低置信', '无依据']
const STATUS = ['待审', '待专家确认', '双人复核中', '待补充依据', '已采纳', '修改后采纳', '已驳回']
const COMPLETED = new Set(['已采纳', '修改后采纳', '已驳回'])
const TYPES_R1 = ['付款', '工期', '违约', '变更']
const TYPES_R2 = ['安全', '质量', '索赔', '资质', '分包', '材料调价', '验收移交']
const POLL = new Set(['待解析', '已解析', '审查中'])

export function ReviewDeskPage() {
  const { taskId = '' } = useParams()
  const [params] = useSearchParams()
  const { me, config } = useSession()
  const [task, setTask] = useState<Task | null>(null)
  const [list, setList] = useState<CardList | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [selectedId, setSelectedId] = useState(params.get('riskId') ?? '')
  const [view, setView] = useState<'pending' | 'completed' | 'all'>(params.has('riskId') ? 'all' : 'pending')
  const [useLinkedSource, setUseLinkedSource] = useState(true)
  const [evidenceIndex, setEvidenceIndex] = useState(0)
  const [filters, setFilters] = useState({ riskType: '', riskLevel: '', evidenceState: '', reviewStatus: '' })
  const [presets, setPresets] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [clauseRef, setClauseRef] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [levelReason, setLevelReason] = useState('')
  const [standard, setStandard] = useState<{ name: string; version: string; effectiveAt: string; expiredAt: string; scope: string; applicable: boolean; riskId: string } | null>(null)
  const [error, setError] = useState('')
  const [manual, setManual] = useState({ sourceLocation: '', rawText: '', standardRef: '' })

  const types = atLeast(config.release, 'R2') ? [...TYPES_R1, ...TYPES_R2] : TYPES_R1

  const sourceRef = useRef<HTMLElement>(null)
  const load = useCallback(() => {
    return Promise.all([getTask(taskId), getCards(taskId), getOpinionPresets()])
      .then(([nextTask, nextList, nextPresets]) => {
        setTask(nextTask)
        setList(nextList)
        setPresets(nextPresets)
      })
      .catch((err: Error) => setError(err.message))
  }, [taskId])

  useEffect(() => { void load() }, [load])

  const taskStatus = task?.status
  useEffect(() => {
    if (!taskStatus || !POLL.has(taskStatus)) return
    const timer = window.setInterval(() => { void load() }, 8000)
    return () => window.clearInterval(timer)
  }, [taskStatus, load])

  const all = useMemo(() => {
    if (!list) return []
    return [...list.unclosedFirst, ...list.cards, ...list.noEvidence]
  }, [list])

  const visible = all.filter((card) => {
    if (view !== 'all' && COMPLETED.has(card.reviewStatus) !== (view === 'completed')) return false
    if (filters.riskType && card.riskType !== filters.riskType) return false
    if (filters.riskLevel && card.riskLevel !== filters.riskLevel) return false
    if (filters.evidenceState && card.evidenceState !== filters.evidenceState) return false
    if (filters.reviewStatus && card.reviewStatus !== filters.reviewStatus) return false
    return true
  })
  const selected = visible.find((card) => card.riskId === selectedId) ?? visible[0]
  const evidence = selected?.sourceRef[evidenceIndex]

  useEffect(() => {
    const linkedSource = useLinkedSource && evidenceIndex === 0
    const docId = (linkedSource && params.get('docId')) || evidence?.docId
    const version = Number((linkedSource && params.get('version')) || evidence?.version || 0)
    const page = Number((linkedSource && params.get('page')) || evidence?.page || 0)
    let active = true
    setPreview(null)
    if (docId && version && page) {
      getPreview(docId, version, page).then((result) => {
        if (active) setPreview(result)
      }).catch((err: Error) => {
        if (active) setError(err.message)
      })
    }
    return () => { active = false }
  }, [evidence?.docId, evidence?.version, evidence?.page, evidenceIndex, params, useLinkedSource])

  useEffect(() => {
    setEvidenceIndex(0)
    setStandard(null)
    setReason('')
    setClauseRef('')
    setSuggestion('')
    setLevelReason('')
  }, [selected?.riskId])

  useEffect(() => {
    const sheet = sourceRef.current?.querySelector('.sheet')
    const mark = sheet?.querySelector('mark')
    if (sheet && mark) {
      sheet.scrollTop += mark.getBoundingClientRect().top - sheet.getBoundingClientRect().top - 48
    }
  }, [preview, evidence?.rawText])

  if (!task || !list) return <Frame title="审查工作台"><ErrorText error={error || '正在读取'} /></Frame>

  const hideSource = hasRole(me.roles, '系统管理员') && !hasRole(me.roles, '审查员') && !hasRole(me.roles, '法务') && !hasRole(me.roles, '技术负责人')
  const canDecide = hasRole(me.roles, '审查员') || hasRole(me.roles, '法务') || hasRole(me.roles, '技术负责人')

  async function run(action: () => Promise<unknown>) {
    try {
      await action()
      setError('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
      if (err instanceof ApiError && err.code === 'SNAPSHOT_CHANGED') await load()
    }
  }

  function pendingRole(card: RiskCard) {
    if (!card.mustConfirm) return ''
    if (hasRole(me.roles, '法务') && !card.votes.some((vote) => vote.role === '法务')) return '法务票'
    if (hasRole(me.roles, '技术负责人') && !card.votes.some((vote) => vote.role === '技术负责人')) return '技术票'
    return ''
  }

  return (
    <Frame title="审查工作台" next={task.next} warning={task.showPaymentArchiveWarning}>
      <ErrorText error={error} />
      <header className="review-heading">
        <Link to={`/tasks/${taskId}`}>任务详情</Link>
        <h2>{task.title}</h2>
      </header>
      <div className="review-layout">
        <section ref={sourceRef} className="review-source" aria-labelledby="source-heading">
          <h2 id="source-heading">材料原文</h2>
          {hideSource ? <p>当前角色无权查看材料原文。</p> : <SourcePreview preview={preview} highlight={evidence?.rawText} />}
        </section>
        <section className="review-panel" aria-labelledby="risk-heading">
          <header className="workspace-heading">
            <h2 id="risk-heading">风险审查</h2>
            <span className="meta">已处理 {all.filter((card) => COMPLETED.has(card.reviewStatus)).length} / {all.length}</span>
          </header>
          <div className="review-tabs" role="group" aria-label="处理状态">
            {(['pending', 'completed', 'all'] as const).map((status) => (
              <button key={status} type="button" aria-pressed={view === status} onClick={() => {
                setUseLinkedSource(false)
                setView(status)
              }}>{ { pending: '待处理', completed: '已处理', all: '全部' }[status]}</button>
            ))}
          </div>
          <div className="checks review-filters" onChange={() => setUseLinkedSource(false)}>
            <select aria-label="审查项" value={filters.riskType} onChange={(event) => setFilters({ ...filters, riskType: event.target.value })}>
              <option value="">审查项</option>
              {types.map((type) => <option key={type}>{type}</option>)}
            </select>
            <select aria-label="风险等级" value={filters.riskLevel} onChange={(event) => setFilters({ ...filters, riskLevel: event.target.value })}>
              <option value="">等级</option>
              {LEVELS.map((level) => <option key={level}>{level}</option>)}
            </select>
            <select aria-label="证据状态" value={filters.evidenceState} onChange={(event) => setFilters({ ...filters, evidenceState: event.target.value })}>
              <option value="">证据状态</option>
              {EVIDENCE.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="确认状态" value={filters.reviewStatus} onChange={(event) => setFilters({ ...filters, reviewStatus: event.target.value })}>
              <option value="">确认状态</option>
              {STATUS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          {canDecide && view !== 'completed' ? (
            <button
              type="button"
              disabled={!visible.some((card) => !COMPLETED.has(card.reviewStatus) && card.riskLevel === '提示' && card.confidence === '高' && !card.conflictNote && card.evidenceState === '高置信')}
              onClick={() => {
                const ids = visible.filter((card) => !COMPLETED.has(card.reviewStatus) && card.riskLevel === '提示' && card.confidence === '高' && !card.conflictNote && card.evidenceState === '高置信').map((card) => card.riskId)
                void run(() => batchConfirm(taskId, ids))
              }}
            >
              批量确认
            </button>
          ) : null}
          {visible.length === 0 && <p className="review-empty" role="status">没有符合当前条件的风险</p>}
          <ul className="risk-list" aria-label="风险列表">
            {visible.map((card) => (
              <li key={card.riskId}>
                <button type="button" aria-pressed={selected?.riskId === card.riskId} onClick={() => {
                  setSelectedId(card.riskId)
                  setEvidenceIndex(0)
                  setUseLinkedSource(false)
                }}>
                  <strong>{card.riskType}</strong>
                  <span className={card.riskLevel === '重大' ? 'risk-major' : 'meta'}>{card.riskLevel}</span>
                  <span className="meta">{card.reviewStatus}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected && [selected].map((card) => (
            <article key={card.riskId} className="card risk-detail">
              <h3>{card.riskType}风险</h3>
              {list.unclosedFirst.some((entry) => entry.riskId === card.riskId) && <p className="review-attention">上一版本未关闭</p>}
              {card.evidenceState === '无依据' && <p className="review-attention">依据不足，未生成修改建议</p>}
              {card.sourceLocation && <p className="meta">原文位置 {card.sourceLocation}</p>}
              {card.ruleOrStandard && <p>审查依据 {card.ruleOrStandard}</p>}
              <p className="meta">{[card.caseRef, card.confidence, card.sourceType].filter(Boolean).join(' · ')}</p>
              {card.suggestion && <><h4>修改建议</h4><p>{card.suggestion}</p></>}
              {card.conflictNote ? <p>{card.conflictNote}</p> : null}
              {card.materialCorrected ? <p>材料卡已经人工校正</p> : null}
              {card.expired ? <p>已过期</p> : null}
              {atLeast(config.release, 'R2') && (card.reviewStatus === '已采纳' || card.reviewStatus === '已驳回') && !card.expired ? (
                <p>
                  沿用上次结论
                  <button type="button" onClick={() => { void run(() => reopenCard(taskId, card.riskId)) }}>展开重开</button>
                </p>
              ) : null}
              {selected?.riskId === card.riskId && card.sourceRef.length > 1 ? (
                <div className="actions">
                  <button type="button" disabled={evidenceIndex === 0} onClick={() => setEvidenceIndex(evidenceIndex - 1)}>上一条</button>
                  <button type="button" disabled={evidenceIndex >= card.sourceRef.length - 1} onClick={() => setEvidenceIndex(evidenceIndex + 1)}>下一条</button>
                </div>
              ) : null}
              {selected?.riskId === card.riskId && card.ruleOrStandard ? (
                <button
                  type="button"
                  onClick={() => {
                    void getStandard(card.ruleOrStandard).then((result) => setStandard({ ...result, riskId: card.riskId })).catch((err: Error) => setError(err.message))
                  }}
                >
                  法规依据
                </button>
              ) : null}
              {selected?.riskId === card.riskId && standard?.riskId === card.riskId ? (
                <div className="dialog">
                  <p>{standard.name}</p>
                  <p>{standard.version} {standard.effectiveAt} {standard.expiredAt} {standard.scope}</p>
                  {standard.applicable ? null : <p>不作为有效依据，请更换版本</p>}
                </div>
              ) : null}
              {selected?.riskId === card.riskId && canDecide && card.evidenceState !== '无依据' ? (
                <>
                  <details><summary>调整风险等级</summary>
                  <label>降级或升级的理由<input value={levelReason} onChange={(event) => setLevelReason(event.target.value)} /></label>
                  <div className="actions">
                    <button type="button" onClick={() => { void run(() => changeLevel(taskId, card.riskId, '降级', levelReason)) }}>降级</button>
                    <button type="button" onClick={() => { void run(() => changeLevel(taskId, card.riskId, '升级', levelReason)) }}>升级</button>
                  </div>
                  </details>
                </>
              ) : null}
              {card.reviewStatus === '修改后采纳' ? (
                <p>修改前 {card.beforeText} 修改后 {card.afterText}</p>
              ) : null}
              {selected?.riskId === card.riskId && canDecide && card.evidenceState !== '无依据' ? (
                <div className="actions review-decision">
                  <select aria-label="常用意见" onChange={(event) => setReason(event.target.value)} value="">
                    <option value="">常用意见</option>
                    {presets.map((preset) => <option key={preset}>{preset}</option>)}
                  </select>
                  <input value={reason} onChange={(event) => setReason(event.target.value)} aria-label="本次理由" placeholder="本次理由" />
                  <input value={clauseRef} onChange={(event) => setClauseRef(event.target.value)} aria-label="引用条款" placeholder="引用条款" />
                  <input value={suggestion} onChange={(event) => setSuggestion(event.target.value)} aria-label="修改后的建议" placeholder="修改后的建议" />
                  {card.locked ? <p>卡片锁定。{card.votes.map((vote) => `${vote.role}${vote.action}`).join('，')}</p> : (
                    <>
                      <button type="button" disabled={!reason && !clauseRef} onClick={() => { void run(() => submitDecision(taskId, card.riskId, { action: '确认采纳', reason, clauseRef, suggestion, createSuppression: false })) }}>
                        {pendingRole(card) || '确认采纳'}
                      </button>
                      <button type="button" disabled={!reason && !clauseRef} onClick={() => { void run(() => submitDecision(taskId, card.riskId, { action: '修改后采纳', reason, clauseRef, suggestion, createSuppression: false })) }}>修改后采纳</button>
                      <button type="button" disabled={!reason && !clauseRef} onClick={() => { void run(() => submitDecision(taskId, card.riskId, { action: '驳回误报', reason, clauseRef, suggestion, createSuppression: true })) }}>驳回误报</button>
                    </>
                  )}
                  <p>{card.votes.map((vote) => `${vote.role} ${vote.status}`).join(' ')}</p>
                </div>
              ) : null}
            </article>
          ))}
          {task.manualMode && hasRole(me.roles, '审查员') ? (
            <form className="form" onSubmit={(event) => { event.preventDefault(); void run(() => createManualCard(taskId, manual.sourceLocation, manual.rawText, manual.standardRef)) }}>
              <h2>手工新增卡片</h2>
              <input value={manual.sourceLocation} onChange={(event) => setManual({ ...manual, sourceLocation: event.target.value })} aria-label="原文位置" placeholder="原文位置" />
              <input value={manual.rawText} onChange={(event) => setManual({ ...manual, rawText: event.target.value })} aria-label="原文" placeholder="原文" />
              <input value={manual.standardRef} onChange={(event) => setManual({ ...manual, standardRef: event.target.value })} aria-label="依据" placeholder="依据" />
              <button type="submit">手工新增卡片</button>
            </form>
          ) : null}
        </section>
      </div>
    </Frame>
  )
}
