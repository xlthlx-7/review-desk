/**
 * 唯一的模拟数据。
 * 对接后端时删除整个 src/mocks 目录，并只改 src/api/index.ts。
 * 页面组件不要引用本文件。
 */
import type {
  AuditLog,
  BackfillItem,
  Candidate,
  CandidateDiff,
  CardList,
  CreateTaskInput,
  Dashboard,
  DiffResult,
  ExceptionItem,
  FollowUp,
  HistoricalHint,
  KnowledgeCase,
  MaterialCard,
  Me,
  Preview,
  ProjectMember,
  Regulation,
  Report,
  RiskCard,
  SourceRef,
  Task,
  TaskNext,
  TimelineItem,
  Workbench,
} from '../types'

const nextOf = (ownerName: string, exitGap: string, timeoutHandover: string): TaskNext => ({
  ownerName,
  exitGap,
  timeoutHandover,
})

export const me: Me = {
  accountId: 'u-lin',
  name: '林审',
  roles: ['审查员', '法务', '技术负责人', '知识管理员', '系统管理员', '项目负责人'],
  projectIds: ['p-bridge'],
}

export const config = {
  release: 'R3' as const,
  maxUploadMb: 200,
  maxPages: 500,
  retentionYears: 5,
  retentionWarnDays: 30,
}

const opinionPresets = ['建议改为与范本一致', '依据不足，先补条款', '维持原文，会谈判']

const tasks = new Map<string, Task>()
const materials = new Map<string, MaterialCard>()
const cards = new Map<string, RiskCard[]>()
const timelines = new Map<string, TimelineItem[]>()
const followUps = new Map<string, FollowUp[]>()
const reports = new Map<string, Report>()

function seedTask(task: Task) {
  tasks.set(task.taskId, task)
}

const bridgeNext = nextOf('林审', '重大项还差法务票', '项目负责人')

seedTask({
  taskId: 't-bridge',
  projectId: 'p-bridge',
  projectName: '滨江大桥',
  title: '滨江大桥施工合同 V1',
  status: '待确认',
  reviewStatusNote: '待审',
  finalized: false,
  showPaymentArchiveWarning: true,
  manualMode: false,
  closedAs: null,
  next: bridgeNext,
  members: [
    { accountId: 'u-lin', name: '林审', role: '审查负责人' },
    { accountId: 'u-zhou', name: '周商', role: '商务' },
  ],
  versions: [
    {
      docId: 'd-bridge',
      version: 1,
      uploader: '林审',
      uploadedAt: '2026-03-02T09:00:00.000Z',
      hash: 'a11ce001',
      pages: 86,
      reviewing: true,
      readonly: false,
      draftWhileOlderFinal: true,
    },
    {
      docId: 'd-bridge',
      version: 2,
      uploader: '林审',
      uploadedAt: '2026-03-18T14:12:00.000Z',
      hash: 'b22ce002',
      pages: 88,
      reviewing: false,
      readonly: true,
      draftWhileOlderFinal: false,
    },
  ],
  duplicateUpload: null,
  fileType: '施工合同正文',
  versionNote: '招标稿',
  ownerAccountIds: ['u-lin'],
  dueAt: '2026-03-28',
  reviewScope: ['付款', '工期', '违约', '变更'],
  syncBusiness: true,
  sourceChannel: '上传',
})

seedTask({
  taskId: 't-done',
  projectId: 'p-bridge',
  projectName: '滨江大桥',
  title: '滨江大桥施工组织方案 V1',
  status: '已完成',
  reviewStatusNote: '',
  finalized: false,
  showPaymentArchiveWarning: false,
  manualMode: false,
  closedAs: null,
  next: nextOf('林审', '可以导出报告', '项目负责人'),
  members: [{ accountId: 'u-lin', name: '林审', role: '审查负责人' }],
  versions: [
    {
      docId: 'd-plan',
      version: 1,
      uploader: '林审',
      uploadedAt: '2026-02-11T08:00:00.000Z',
      hash: 'c33ce003',
      pages: 40,
      reviewing: true,
      readonly: false,
      draftWhileOlderFinal: false,
    },
  ],
  duplicateUpload: null,
  fileType: '施工组织方案',
  versionNote: '送审稿',
  ownerAccountIds: ['u-lin'],
  dueAt: '2026-02-20',
  reviewScope: ['工期'],
  syncBusiness: false,
  sourceChannel: '邮件',
})

seedTask({
  taskId: 't-follow',
  projectId: 'p-bridge',
  projectName: '滨江大桥',
  title: '滨江大桥补充协议 V2',
  status: '跟进中',
  reviewStatusNote: '',
  finalized: true,
  showPaymentArchiveWarning: false,
  manualMode: false,
  closedAs: null,
  next: nextOf('林审', '付款项尚未关闭', '项目负责人'),
  members: [{ accountId: 'u-lin', name: '林审', role: '审查负责人' }],
  versions: [
    {
      docId: 'd-add',
      version: 2,
      uploader: '林审',
      uploadedAt: '2026-01-20T08:00:00.000Z',
      hash: 'd44ce004',
      pages: 12,
      reviewing: true,
      readonly: true,
      draftWhileOlderFinal: false,
    },
  ],
  duplicateUpload: null,
  fileType: '补充协议',
  versionNote: '已发送',
  ownerAccountIds: ['u-lin'],
  dueAt: '2026-04-01',
  reviewScope: ['付款'],
  syncBusiness: false,
  sourceChannel: 'OA',
})

seedTask({
  taskId: 't-enc',
  projectId: 'p-bridge',
  projectName: '滨江大桥',
  title: '加密合同扫描件',
  status: '异常',
  reviewStatusNote: '',
  finalized: false,
  showPaymentArchiveWarning: false,
  manualMode: false,
  closedAs: null,
  next: nextOf('系统管理员', '上传人提供密码或明文', '系统管理员'),
  members: [{ accountId: 'u-lin', name: '林审', role: '审查负责人' }],
  versions: [
    {
      docId: 'd-enc',
      version: 1,
      uploader: '林审',
      uploadedAt: '2026-03-19T10:00:00.000Z',
      hash: 'e55ce005',
      pages: 3,
      reviewing: false,
      readonly: true,
      draftWhileOlderFinal: false,
    },
  ],
  duplicateUpload: null,
  fileType: '施工合同正文',
  versionNote: '扫描件',
  ownerAccountIds: ['u-lin'],
  dueAt: '2026-03-30',
  reviewScope: ['付款'],
  syncBusiness: false,
  sourceChannel: '上传',
})

seedTask({
  taskId: 't-running',
  projectId: 'p-bridge',
  projectName: '滨江大桥',
  title: '正在审查的合同',
  status: '审查中',
  reviewStatusNote: '',
  finalized: true,
  showPaymentArchiveWarning: false,
  manualMode: false,
  closedAs: null,
  next: nextOf('审查引擎', '卡片尚未生成完毕', '系统管理员'),
  members: [{ accountId: 'u-lin', name: '林审', role: '审查负责人' }],
  versions: [
    {
      docId: 'd-run',
      version: 1,
      uploader: '林审',
      uploadedAt: '2026-03-21T11:00:00.000Z',
      hash: 'f66ce006',
      pages: 20,
      reviewing: true,
      readonly: false,
      draftWhileOlderFinal: false,
    },
  ],
  duplicateUpload: null,
  fileType: '施工合同正文',
  versionNote: '审查中',
  ownerAccountIds: ['u-lin'],
  dueAt: '2026-04-02',
  reviewScope: ['违约'],
  syncBusiness: false,
  sourceChannel: '上传',
})

seedTask({
  taskId: 't-overdue',
  projectId: 'p-bridge',
  projectName: '滨江大桥',
  title: '逾期未确认的方案',
  status: '待确认',
  reviewStatusNote: '待专家确认',
  finalized: true,
  showPaymentArchiveWarning: false,
  manualMode: false,
  closedAs: null,
  next: nextOf('林审', '低置信项未裁决', '项目负责人'),
  members: [{ accountId: 'u-lin', name: '林审', role: '审查负责人' }],
  versions: [
    {
      docId: 'd-late',
      version: 1,
      uploader: '林审',
      uploadedAt: '2026-03-01T11:00:00.000Z',
      hash: '077ce007',
      pages: 15,
      reviewing: true,
      readonly: false,
      draftWhileOlderFinal: false,
    },
  ],
  duplicateUpload: null,
  fileType: '施工组织方案',
  versionNote: '逾期',
  ownerAccountIds: ['u-lin'],
  dueAt: '2026-03-05',
  reviewScope: ['工期'],
  syncBusiness: false,
  sourceChannel: '压缩包',
})

materials.set('t-bridge', {
  locked: false,
  versionConfirmed: true,
  metaOnly: false,
  historicalHints: [
    { topic: '质保金', conclusion: '上一次按 3% 采纳', sourceTaskId: 't-follow' },
    { topic: '变更签证', conclusion: '口头变更未采纳', sourceTaskId: 't-done' },
  ] satisfies HistoricalHint[],
  fields: [
    { key: '项目或标段', value: '滨江大桥', unrecognized: false, requiredLevel: '必抽', page: 1, docId: 'd-bridge', version: 1 },
    { key: '合同双方或方案相关单位', value: '市建集团 / 江岸公司', unrecognized: false, requiredLevel: '必抽', page: 2, docId: 'd-bridge', version: 1 },
    { key: '工期、开工与竣工日期', value: '2026-04-01 至 2028-03-31', unrecognized: false, requiredLevel: '必抽', page: 6, docId: 'd-bridge', version: 1 },
    { key: '合同价款', value: '128000000', unrecognized: false, requiredLevel: '必抽', page: 8, docId: 'd-bridge', version: 1 },
    { key: '付款节点', value: '预付款 10%，进度款按月', unrecognized: false, requiredLevel: '必抽', page: 9, docId: 'd-bridge', version: 1 },
    { key: '违约责任摘要', value: '', unrecognized: true, requiredLevel: '必抽', page: null, docId: 'd-bridge', version: 1 },
    { key: '引用规范清单', value: 'GB 50300', unrecognized: false, requiredLevel: '能抽则抽', page: 14, docId: 'd-bridge', version: 1 },
    { key: '条款编号索引', value: '3.2、5.1、8.4', unrecognized: false, requiredLevel: '必抽', page: 6, docId: 'd-bridge', version: 1 },
    { key: '附件及页码', value: '', unrecognized: true, requiredLevel: '能抽则抽', page: null, docId: 'd-bridge', version: 1 },
    { key: '质检结果', value: '通过', unrecognized: false, requiredLevel: '必有', page: 1, docId: 'd-bridge', version: 1 },
  ],
})

materials.set('t-done', {
  locked: true,
  versionConfirmed: true,
  metaOnly: false,
  historicalHints: [],
  fields: [
    { key: '项目或标段', value: '滨江大桥', unrecognized: false, requiredLevel: '必抽', page: 1, docId: 'd-plan', version: 1 },
    { key: '合同双方或方案相关单位', value: '市建集团', unrecognized: false, requiredLevel: '必抽', page: 1, docId: 'd-plan', version: 1 },
    { key: '工期、开工与竣工日期', value: '2026-05-01 开工', unrecognized: false, requiredLevel: '必抽', page: 4, docId: 'd-plan', version: 1 },
    { key: '合同价款', value: '', unrecognized: true, requiredLevel: '必抽', page: null, docId: 'd-plan', version: 1 },
    { key: '付款节点', value: '', unrecognized: true, requiredLevel: '必抽', page: null, docId: 'd-plan', version: 1 },
    { key: '违约责任摘要', value: '', unrecognized: true, requiredLevel: '必抽', page: null, docId: 'd-plan', version: 1 },
    { key: '引用规范清单', value: '', unrecognized: true, requiredLevel: '能抽则抽', page: null, docId: 'd-plan', version: 1 },
    { key: '条款编号索引', value: '第 5.1 节', unrecognized: false, requiredLevel: '必抽', page: 5, docId: 'd-plan', version: 1 },
    { key: '附件及页码', value: '', unrecognized: true, requiredLevel: '能抽则抽', page: null, docId: 'd-plan', version: 1 },
    { key: '质检结果', value: '通过', unrecognized: false, requiredLevel: '必有', page: 1, docId: 'd-plan', version: 1 },
  ],
})

const evidence = (page: number, clauseNo: string, rawText: string, sourceType = '合同'): SourceRef => ({
  docId: 'd-bridge',
  version: 1,
  page,
  clauseNo,
  sourceType,
  rawText,
})

const bridgeCards: RiskCard[] = [
  {
    riskId: 'r-major',
    taskId: 't-bridge',
    riskType: '工期',
    riskLevel: '重大',
    sourceLocation: '合同第 3.2 条；方案第 5.1 节',
    ruleOrStandard: '企业范本工期条款',
    caseRef: null,
    suggestion: '开工日期与方案进度计划不一致，建议对齐。',
    confidence: '高',
    conflictNote: '合同写 2026-04-01 开工，方案第 5.1 节写 2026-05-01。',
    sourceType: '合同',
    evidenceState: '高置信',
    reviewStatus: '双人复核中',
    mustConfirm: true,
    materialCorrected: false,
    expired: false,
    carryOver: false,
    locked: false,
    votes: [{ role: '技术负责人', accountId: 'u-tech', action: '确认采纳', status: '已提交' }],
    sourceRef: [
      evidence(6, '3.2', '开工日期为 2026 年 4 月 1 日。'),
      evidence(5, '5.1', '进度计划：2026 年 5 月 1 日开工。', '施工组织方案'),
    ],
  },
  {
    riskId: 'r-pay',
    taskId: 't-bridge',
    riskType: '付款',
    riskLevel: '一般',
    sourceLocation: '合同第 8.4 条',
    ruleOrStandard: '预付款比例',
    caseRef: '案例-质保金',
    suggestion: '预付款 10% 与范本 15% 不一致。',
    confidence: '高',
    conflictNote: '',
    sourceType: '企业规则',
    evidenceState: '高置信',
    reviewStatus: '待审',
    mustConfirm: false,
    materialCorrected: true,
    expired: false,
    carryOver: false,
    locked: false,
    votes: [],
    sourceRef: [evidence(9, '8.4', '预付款为合同价款的 10%。')],
  },
  {
    riskId: 'r-tip',
    taskId: 't-bridge',
    riskType: '变更',
    riskLevel: '提示',
    sourceLocation: '合同第 12 条',
    ruleOrStandard: '变更签证',
    caseRef: null,
    suggestion: '口头变更未写书面确认期限。',
    confidence: '高',
    conflictNote: '',
    sourceType: '合同',
    evidenceState: '高置信',
    reviewStatus: '待审',
    mustConfirm: false,
    materialCorrected: false,
    expired: false,
    carryOver: false,
    locked: false,
    votes: [],
    sourceRef: [evidence(21, '12', '变更可以口头通知后补签。')],
  },
  {
    riskId: 'r-none',
    taskId: 't-bridge',
    riskType: '违约',
    riskLevel: '一般',
    sourceLocation: '',
    ruleOrStandard: '',
    caseRef: null,
    suggestion: '',
    confidence: null,
    conflictNote: '',
    sourceType: '',
    evidenceState: '无依据',
    reviewStatus: '待补充依据',
    mustConfirm: false,
    materialCorrected: false,
    expired: false,
    carryOver: false,
    locked: false,
    votes: [],
    sourceRef: [],
  },
  {
    riskId: 'r-old',
    taskId: 't-bridge',
    riskType: '付款',
    riskLevel: '提示',
    sourceLocation: '旧版本第 4 页',
    ruleOrStandard: '',
    caseRef: null,
    suggestion: '此卡片属于被更换的版本。',
    confidence: '低',
    conflictNote: '',
    sourceType: '合同',
    evidenceState: '低置信',
    reviewStatus: '待审',
    mustConfirm: false,
    materialCorrected: false,
    expired: true,
    carryOver: false,
    locked: false,
    votes: [],
    sourceRef: [evidence(4, '2.1', '旧版本价款口径。')],
  },
  {
    riskId: 'r-lock',
    taskId: 't-bridge',
    riskType: '违约',
    riskLevel: '重大',
    sourceLocation: '合同第 9 条',
    ruleOrStandard: '违约金上限',
    caseRef: null,
    suggestion: '',
    confidence: '高',
    conflictNote: '技术票采纳，法务票驳回。',
    sourceType: '合同',
    evidenceState: '高置信',
    reviewStatus: '双人复核中',
    mustConfirm: true,
    materialCorrected: false,
    expired: false,
    carryOver: false,
    locked: true,
    votes: [
      { role: '技术负责人', accountId: 'u-tech', action: '确认采纳', status: '已提交' },
      { role: '法务', accountId: 'u-law', action: '驳回误报', status: '已提交' },
    ],
    sourceRef: [evidence(18, '9', '违约金按日万分之五，上不封顶。')],
  },
]

cards.set('t-bridge', bridgeCards)

cards.set('t-done', [
  {
    riskId: 'r-plan',
    taskId: 't-done',
    riskType: '工期',
    riskLevel: '一般',
    sourceLocation: '方案第 5.1 节',
    ruleOrStandard: '合同第 3.2 条',
    caseRef: null,
    suggestion: '方案开工日期已按合同修改。',
    confidence: '高',
    conflictNote: '',
    sourceType: '施工组织方案',
    evidenceState: '高置信',
    reviewStatus: '已采纳',
    mustConfirm: false,
    materialCorrected: false,
    expired: false,
    carryOver: false,
    locked: false,
    votes: [],
    sourceRef: [
      {
        docId: 'd-plan',
        version: 1,
        page: 5,
        clauseNo: '5.1',
        sourceType: '施工组织方案',
        rawText: '开工日期与合同第 3.2 条一致。',
      },
    ],
    beforeText: '方案写 5 月开工。',
    afterText: '方案开工日期已按合同修改。',
  },
])

cards.set('t-follow', [
  {
    riskId: 'r-fu',
    taskId: 't-follow',
    riskType: '付款',
    riskLevel: '重大',
    sourceLocation: '补充协议第 2 条',
    ruleOrStandard: '质保金',
    caseRef: null,
    suggestion: '质保金比例已确认。',
    confidence: '高',
    conflictNote: '',
    sourceType: '合同',
    evidenceState: '高置信',
    reviewStatus: '已采纳',
    mustConfirm: true,
    materialCorrected: false,
    expired: false,
    carryOver: true,
    locked: false,
    votes: [],
    sourceRef: [
      {
        docId: 'd-add',
        version: 2,
        page: 2,
        clauseNo: '2',
        sourceType: '合同',
        rawText: '质保金为结算价的 3%。',
      },
    ],
  },
])

cards.set('t-running', [])
cards.set('t-overdue', [])
cards.set('t-enc', [])

timelines.set('t-bridge', [
  {
    operator: '林审',
    at: '2026-03-02T09:00:00.000Z',
    objectId: 't-bridge',
    action: '上传',
    reason: '',
    before: '',
    after: '版本 1',
  },
  {
    operator: '林审',
    at: '2026-03-04T11:20:00.000Z',
    objectId: '合同价款',
    action: '材料卡改正',
    reason: '价款以封面为准',
    before: '未识别',
    after: '128000000',
  },
])

followUps.set('t-follow', [
  {
    riskId: 'r-fu',
    riskType: '付款',
    attitude: '未回复',
    needSupplementSign: true,
    closeStatus: '未关闭',
    closeReason: '',
    closedBy: '',
    closedAt: '',
    suggestCase: true,
    mustClose: true,
  },
])

reports.set('t-bridge', {
  status: '待确认',
  finalized: false,
  watermark: { project: '滨江大桥', version: 1, generatedAt: '2026-03-21T00:00:00.000Z', operator: '林审' },
  exportEnabled: false,
  frozen: false,
  sections: {
    基本信息: '滨江大桥施工合同，审查版本 1，非定稿。',
    材料卡摘要: '价款 128000000。违约责任摘要未识别。',
    重大风险: [{ riskId: 'r-major', text: '开工日期不一致。', docId: 'd-bridge', version: 1, page: 6, rawText: '开工日期为 2026 年 4 月 1 日。', at: '2026-03-02T09:00:00.000Z' }],
    一般风险: [{ riskId: 'r-pay', text: '预付款比例与范本不一致。' }],
    提示: [{ riskId: 'r-tip', text: '口头变更未写书面确认期限。' }],
    已驳回清单: [],
    证据清单: [{ riskId: 'r-major', text: '合同第 3.2 条', docId: 'd-bridge', version: 1, page: 6, rawText: '开工日期为 2026 年 4 月 1 日。' }],
    谈判话术: [],
  },
})

reports.set('t-done', {
  status: '已完成',
  finalized: false,
  watermark: { project: '滨江大桥', version: 1, generatedAt: '2026-02-18T00:00:00.000Z', operator: '林审' },
  exportEnabled: true,
  frozen: false,
  sections: {
    基本信息: '施工组织方案，审查版本 1。',
    材料卡摘要: '开工日期已抽取。',
    重大风险: [],
    一般风险: [{ riskId: 'r-plan', text: '方案开工日期已按合同修改。' }],
    提示: [],
    已驳回清单: [],
    证据清单: [{ riskId: 'r-plan', text: '方案第 5.1 节', docId: 'd-plan', version: 1, page: 5, rawText: '开工日期与合同第 3.2 条一致。', at: '2026-02-11T08:00:00.000Z' }],
    谈判话术: [{ riskId: 'r-plan', text: '开工日期以合同第 3.2 条为准。' }],
  },
})

reports.set('t-follow', {
  status: '跟进中',
  finalized: true,
  watermark: { project: '滨江大桥', version: 2, generatedAt: '2026-01-22T00:00:00.000Z', operator: '林审' },
  exportEnabled: true,
  frozen: true,
  sections: {
    基本信息: '补充协议已发送，报告已冻结。',
    材料卡摘要: '',
    重大风险: [{ riskId: 'r-fu', text: '质保金 3% 已采纳。' }],
    一般风险: [],
    提示: [],
    已驳回清单: [],
    证据清单: [],
    谈判话术: [{ riskId: 'r-fu', text: '质保金按 3% 执行。' }],
  },
})

const pageText: Record<string, string> = {
  'd-bridge:1:6': '第 3.2 条 开工日期为 2026 年 4 月 1 日。工期自开工日起算。',
  'd-bridge:1:9': '第 8.4 条 预付款为合同价款的 10%，进度款按月支付。',
  'd-bridge:1:5': '进度计划：2026 年 5 月 1 日开工。',
  'd-plan:1:5': '第 5.1 节 开工日期与合同第 3.2 条一致。',
  'd-add:2:2': '第 2 条 质保金为结算价的 3%。',
}

export function pageBody(docId: string, version: number, page: number) {
  return pageText[`${docId}:${version}:${page}`] ?? `第 ${page} 页没有更多模拟正文。`
}

const regulations: Regulation[] = [
  {
    id: 'law-1',
    name: '建设工程质量管理条例',
    version: '2019',
    effectiveAt: '2019-04-23',
    expiredAt: '',
    scope: '建设工程质量',
    historicalUse: false,
  },
  {
    id: 'law-old',
    name: '企业工期范本',
    version: '2014',
    effectiveAt: '2014-01-01',
    expiredAt: '2020-01-01',
    scope: '工期',
    historicalUse: false,
  },
]

let candidates: Candidate[] = [
  {
    id: 'c-1',
    riskType: '付款',
    pattern: '预付款低于范本',
    decision: '确认采纳',
    reason: '与招标文件不一致',
    sourceTaskId: 't-bridge',
    published: false,
  },
]

const cases: KnowledgeCase[] = [
  { id: 'case-1', title: '质保金 3%', summary: '已脱敏。价款口径保留，账号已掩码。' },
]

const backfill: BackfillItem[] = [{ id: 'b-1', reason: '违约金上限没有可用的企业规则' }]

const exceptions: ExceptionItem[] = [
  {
    taskId: 't-enc',
    ex: 'EX-04',
    title: '文件加密',
    reason: '文件加密',
    failedPages: [],
    suggestion: '补件',
    fileUrl: 'mock://files/d-enc',
    ownerRole: '上传人',
    next: nextOf('上传人', '提供密码或明文', '系统管理员'),
  },
  {
    taskId: 't-enc',
    ex: 'EX-05',
    title: '版本冲突',
    reason: '同一任务两人同时把不同文件标为定稿',
    failedPages: [],
    suggestion: '',
    fileUrl: 'mock://files/d-enc',
    ownerRole: '负责人',
    next: nextOf('林审', '指定唯一版本', '系统管理员'),
  },
  {
    taskId: 't-running',
    ex: 'EX-09',
    title: '模型超时',
    reason: '重试 2 次后仍有未完成项',
    failedPages: [11],
    suggestion: '转人工',
    fileUrl: 'mock://files/d-run',
    ownerRole: '系统管理员',
    next: nextOf('系统管理员', '重跑未完成项', '系统管理员'),
  },
]

let members: ProjectMember[] = [
  { accountId: 'u-lin', name: '林审', roles: ['审查员', '法务'] },
  { accountId: 'u-tech', name: '陈工', roles: ['技术负责人'] },
]

const auditLogs: AuditLog[] = [
  {
    operator: '林审',
    at: '2026-03-04T11:20:00.000Z',
    objectId: 't-bridge',
    action: '材料卡改正',
    reason: '价款以封面为准',
    before: '未识别',
    after: '128000000',
  },
  {
    operator: '系统管理员',
    at: '2026-03-21T02:00:00.000Z',
    objectId: 'audit',
    action: '查看审计',
    reason: '',
    before: '',
    after: '',
  },
]

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function readMe() {
  return clone(me)
}

export function readConfig() {
  return clone(config)
}

export function readQueue() {
  return {
    groups: [
      { key: '重大项', taskIds: ['t-bridge'] },
      { key: '低置信', taskIds: ['t-overdue'] },
      { key: '冲突', taskIds: ['t-bridge'] },
    ],
  }
}

export function readWorkbench(): Workbench {
  function item(taskId: string) {
    const task = tasks.get(taskId)
    const versions = task?.versions ?? []
    const version = versions.find((entry) => entry.reviewing) ?? versions[versions.length - 1]
    return { taskId, title: task?.title, version: version?.version, uploadedAt: version?.uploadedAt }
  }

  return {
    groups: [
      { key: '待我确认', count: 1, items: [item('t-bridge')] },
      { key: '待我补票', count: 0, items: [] },
      { key: '逾期', count: 1, items: [item('t-overdue')] },
      { key: '异常待处理', count: 1, items: [item('t-enc')] },
      { key: '知识待补', count: 0, items: [] },
      { key: '跟进待关闭', count: 1, items: [item('t-follow')] },
    ],
    pendingConfirmStallReason: '重大项法务票已超过 24 小时',
    proactiveCards: [
      { taskId: 't-bridge', event: '已引用法规发布新版本或失效' },
    ],
    next: bridgeNext,
  }
}

export function readTask(taskId: string) {
  const task = tasks.get(taskId)
  if (!task) return null
  if (!me.projectIds.includes(task.projectId)) return 'forbidden' as const
  return clone(task)
}

export function readTimeline(taskId: string) {
  return clone(timelines.get(taskId) ?? [])
}

export function readMaterial(taskId: string, asMetaOnly: boolean): MaterialCard | null {
  const card = materials.get(taskId)
  if (!card) return null
  if (asMetaOnly) return { locked: true, versionConfirmed: card.versionConfirmed, metaOnly: true, fields: [], historicalHints: [] }
  return clone(card)
}

export function saveMaterial(taskId: string, reason: string, fields: { key: string; value: string }[]) {
  const card = materials.get(taskId)
  if (!card) return { error: { code: 'REQUIRED', message: '没有材料卡' } }
  if (!reason.trim()) return { error: { code: 'REQUIRED', message: '保存校正时必须填写原因' } }
  for (const field of card.fields) {
    const next = fields.find((item) => item.key === field.key)
    if (!next) continue
    field.value = next.value
    field.unrecognized = next.value.trim() === ''
  }
  card.locked = true
  const list = cards.get(taskId) ?? []
  for (const risk of list) risk.materialCorrected = true
  timelines.set(taskId, [
    ...(timelines.get(taskId) ?? []),
    {
      operator: me.name,
      at: new Date().toISOString(),
      objectId: taskId,
      action: '材料卡改正',
      reason,
      before: '',
      after: fields.map((field) => `${field.key}:${field.value}`).join('；'),
    },
  ])
  return { data: clone(card) }
}

export function readPreview(docId: string, version: number, page: number): Preview | { error: { code: string; message: string } } {
  if (docId === 'd-bad') {
    return { error: { code: 'HASH_MISMATCH', message: '文件哈希对不上，拒绝展示' } }
  }
  return {
    previewPdfUrl: `mock://preview/${docId}/${version}/${page}`,
    page,
    version,
    status: 'ok',
    pageText: pageBody(docId, version, page),
  }
}

export function readCards(taskId: string): CardList {
  const list = cards.get(taskId) ?? []
  return {
    unclosedFirst: clone(list.filter((card) => card.carryOver)),
    cards: clone(list.filter((card) => card.evidenceState !== '无依据' && !card.carryOver)),
    noEvidence: clone(list.filter((card) => card.evidenceState === '无依据')),
  }
}

export function readPresets() {
  return clone(opinionPresets)
}

export function decideCard(taskId: string, riskId: string, input: { action: string; reason: string; clauseRef: string; suggestion: string; createSuppression: boolean }) {
  if (!input.reason.trim() && !input.clauseRef.trim()) {
    return { error: { code: 'REQUIRED', message: '理由为空不能提交' } }
  }
  const list = cards.get(taskId) ?? []
  const card = list.find((item) => item.riskId === riskId)
  if (!card) return { error: { code: 'REQUIRED', message: '没有这张卡片' } }
  if (card.locked) return { error: { code: 'SNAPSHOT_CHANGED', message: '卡片已锁定，请看最新快照', data: clone(card) } }
  if (card.mustConfirm && card.votes.some((vote) => vote.accountId === me.accountId)) {
    return { error: { code: 'SAME_ACCOUNT', message: '同一账号不能投两票' } }
  }
  const before = card.suggestion
  if (input.action === '驳回误报') card.reviewStatus = '已驳回'
  else if (input.action === '修改后采纳') {
    card.reviewStatus = '修改后采纳'
    card.beforeText = before
    card.afterText = input.suggestion || before
    card.suggestion = card.afterText
  } else card.reviewStatus = '已采纳'
  if (card.mustConfirm && me.roles.includes('法务') && !card.votes.some((vote) => vote.role === '法务')) {
    card.votes.push({ role: '法务', accountId: me.accountId, action: input.action, status: '已提交' })
  }
  return { data: clone(card) }
}

export function batchConfirm(taskId: string, riskIds: string[]) {
  const list = cards.get(taskId) ?? []
  const picked = list.filter((card) => riskIds.includes(card.riskId))
  const bad = picked.some((card) => card.riskLevel !== '提示' || card.confidence !== '高' || card.conflictNote || card.evidenceState !== '高置信' || card.mustConfirm)
  if (bad || picked.length === 0) return { error: { code: 'BATCH_REJECTED', message: '只有提示且高置信、无冲突的卡片可以批量确认' } }
  for (const card of picked) card.reviewStatus = '已采纳'
  return { data: clone(picked) }
}

export function setLevel(taskId: string, riskId: string, direction: string, reason: string) {
  if (!reason.trim()) return { error: { code: 'REQUIRED', message: '必须填写理由' } }
  const card = (cards.get(taskId) ?? []).find((item) => item.riskId === riskId)
  if (!card) return { error: { code: 'REQUIRED', message: '没有这张卡片' } }
  if (direction === '降级' && card.riskLevel === '重大' && card.ruleOrStandard) {
    return { error: { code: 'LEVEL_LOCKED', message: '模型产出不能把规则标成重大的项降成提示' } }
  }
  if (direction === '降级' && card.riskLevel === '重大') card.riskLevel = '一般'
  else if (direction === '降级' && card.riskLevel === '一般') card.riskLevel = '提示'
  else if (direction === '升级' && card.riskLevel === '提示') card.riskLevel = '一般'
  else if (direction === '升级' && card.riskLevel === '一般') card.riskLevel = '重大'
  return { data: clone(card) }
}

export function reopenCard(taskId: string, riskId: string) {
  const card = (cards.get(taskId) ?? []).find((item) => item.riskId === riskId)
  if (!card) return { error: { code: 'REQUIRED', message: '没有这张卡片' } }
  card.reviewStatus = '待审'
  card.carryOver = false
  return { data: clone(card) }
}

export function addManualCard(taskId: string, sourceLocation: string, rawText: string, standardRef: string) {
  const task = tasks.get(taskId)
  if (!task?.manualMode) return { error: { code: 'REQUIRED', message: '仅转为人工审查后可以手工新增' } }
  if (!sourceLocation.trim() || !rawText.trim() || !standardRef.trim()) {
    return { error: { code: 'REQUIRED', message: '必须填原文位置和依据' } }
  }
  const card: RiskCard = {
    riskId: `r-manual-${Date.now()}`,
    taskId,
    riskType: '付款',
    riskLevel: '一般',
    sourceLocation,
    ruleOrStandard: standardRef,
    caseRef: null,
    suggestion: '',
    confidence: '低',
    conflictNote: '',
    sourceType: '人工',
    evidenceState: '低置信',
    reviewStatus: '待审',
    mustConfirm: false,
    materialCorrected: false,
    expired: false,
    carryOver: false,
    locked: false,
    votes: [],
    sourceRef: [{ docId: task.versions[0]?.docId ?? '', version: task.versions[0]?.version ?? 1, page: 1, clauseNo: '', sourceType: '人工', rawText }],
  }
  cards.set(taskId, [...(cards.get(taskId) ?? []), card])
  return { data: clone(card) }
}

export function readStandard(standardRef: string) {
  const found = regulations.find((item) => item.id === standardRef || item.name === standardRef)
  return {
    name: found?.name ?? standardRef,
    version: found?.version ?? '',
    effectiveAt: found?.effectiveAt ?? '',
    expiredAt: found?.expiredAt ?? '',
    scope: found?.scope ?? '',
    applicable: Boolean(found && !found.expiredAt),
  }
}

export function coordinate(taskId: string, riskId: string, action: string) {
  if (action !== '维持技术票' && action !== '维持法务票' && action !== '退回双方重审') {
    return { error: { code: 'COORDINATOR_CANNOT_PASS', message: '项目负责人不能独自把重大项改成通过' } }
  }
  const card = (cards.get(taskId) ?? []).find((item) => item.riskId === riskId)
  if (!card?.locked) return { error: { code: 'REQUIRED', message: '卡片未锁定' } }
  card.conflictNote = action
  return { data: clone(card) }
}

export function readReport(taskId: string) {
  const report = reports.get(taskId)
  return report ? clone(report) : null
}

export function exportReport(taskId: string, includeNegotiation: boolean) {
  const report = reports.get(taskId)
  if (!report?.exportEnabled) return { error: { code: 'EXPORT_BLOCKED', message: '待确认或重大项缺少任一票时不能导出' } }
  const version = report.watermark.version
  const lines = [
    report.sections.基本信息,
    includeNegotiation ? report.sections.谈判话术.map((item) => item.text).join('\n') : '',
  ]
  return { data: { pdfUrl: `mock://report/${taskId}?talk=${includeNegotiation ? 1 : 0}&text=${encodeURIComponent(lines.join('\n'))}`, version } }
}

export function sendReport(taskId: string, channel: string) {
  const task = tasks.get(taskId)
  const report = reports.get(taskId)
  if (!task || !report) return { error: { code: 'REQUIRED', message: '没有报告' } }
  if (task.status !== '已完成') return { error: { code: 'REQUIRED', message: '仅已完成任务可以登记发送' } }
  task.status = '跟进中'
  report.frozen = true
  report.status = '跟进中'
  return { data: { channel, status: task.status } }
}

export function archiveTask(taskId: string, reason: string, fromFollowUp: boolean) {
  const task = tasks.get(taskId)
  if (!task) return { error: { code: 'REQUIRED', message: '没有任务' } }
  if (task.status === '归档') return { error: { code: 'ARCHIVED', message: '归档后只读' } }
  if (!fromFollowUp && !reason.trim()) return { error: { code: 'REQUIRED', message: '必须填写无需发送的原因' } }
  if (fromFollowUp) {
    const open = (followUps.get(taskId) ?? []).filter((item) => item.mustClose && item.closeStatus !== '已关闭')
    if (open.length) return { error: { code: 'REQUIRED', message: '必须关闭的项还没有全部关闭' } }
  }
  task.status = '归档'
  return { data: clone(task) }
}

export function readFollowUps(taskId: string) {
  return clone(followUps.get(taskId) ?? [])
}

export function patchFollowUp(taskId: string, riskId: string, input: { attitude?: FollowUp['attitude']; needSupplementSign?: boolean; saveAsCase?: boolean }, businessOnly: boolean) {
  const item = (followUps.get(taskId) ?? []).find((row) => row.riskId === riskId)
  if (!item) return { error: { code: 'REQUIRED', message: '没有这条跟进' } }
  if (businessOnly) return { error: { code: '403', message: '商务不能关闭' } }
  if (input.attitude) item.attitude = input.attitude
  if (typeof input.needSupplementSign === 'boolean') item.needSupplementSign = input.needSupplementSign
  if (typeof input.saveAsCase === 'boolean') item.suggestCase = input.saveAsCase
  return { data: clone(item) }
}

export function closeFollowUp(taskId: string, riskId: string, closeReason: string, saveAsCase: boolean) {
  const item = (followUps.get(taskId) ?? []).find((row) => row.riskId === riskId)
  if (!item) return { error: { code: 'REQUIRED', message: '没有这条跟进' } }
  if (!closeReason) return { error: { code: 'REQUIRED', message: '关闭原因必填' } }
  item.closeStatus = '已关闭'
  item.closeReason = closeReason
  item.closedBy = me.name
  item.closedAt = new Date().toISOString()
  item.suggestCase = saveAsCase
  return { data: clone(item) }
}

export function readRegulations() {
  return clone(regulations)
}

export function setHistoricalUse(id: string, enabled: boolean) {
  const item = regulations.find((regulation) => regulation.id === id)
  if (!item) return { error: { code: 'REQUIRED', message: '没有这条法规' } }
  item.historicalUse = enabled
  return { data: clone(item) }
}

export function readCandidates() {
  return clone(candidates)
}

export function updateCandidate(id: string, patch: Partial<Candidate>) {
  const item = candidates.find((candidate) => candidate.id === id)
  if (!item) return { error: { code: 'REQUIRED', message: '没有这条候选' } }
  Object.assign(item, patch, { published: item.published })
  return { data: clone(item) }
}

export function maskCandidate(id: string) {
  const item = candidates.find((candidate) => candidate.id === id)
  if (!item) return { error: { code: 'REQUIRED', message: '没有这条候选' } }
  const pattern = item.pattern.replace(/\d{6,}/g, '******')
  if (pattern !== item.pattern) saveKnowledgeRecord({ ...item, pattern })
  item.pattern = pattern
  return { data: clone(item) }
}

export function trialCandidate(id: string) {
  if (!candidates.some((candidate) => candidate.id === id)) return { error: { code: 'REQUIRED', message: '没有这条候选' } }
  return { data: { appliesTo: 'new-tasks-only' as const } }
}

export function publishCandidate(id: string) {
  const item = candidates.find((candidate) => candidate.id === id)
  if (!item) return { error: { code: 'REQUIRED', message: '没有这条候选' } }
  item.published = true
  return { data: { version: '1' } }
}

export function discardCandidate(id: string) {
  candidates = candidates.filter((candidate) => candidate.id !== id)
  return { data: { id } }
}

const candidateChanges = new Map<string, CandidateDiff>()

export function readCandidateDiff(id: string): CandidateDiff {
  const item = candidates.find((candidate) => candidate.id === id)
  return candidateChanges.get(id) ?? { operator: me.name, at: '', before: item?.pattern ?? '', after: item?.pattern ?? '' }
}

export function readCases() {
  return clone(cases)
}

export function readBackfill() {
  return clone(backfill)
}

export function readDiff(change: string[]): DiffResult {
  const rows = [
    { id: 'row-1', change: '修改' as const, aligned: true, riskId: 'r-major', leftText: '开工日期为 2026 年 4 月 1 日。', rightText: '开工日期为 2026 年 5 月 1 日。' },
    { id: 'row-2', change: '新增' as const, aligned: false, riskId: null, leftText: '', rightText: '新增质保金条款。' },
    { id: 'row-3', change: '未关闭' as const, aligned: true, riskId: 'r-fu', leftText: '质保金为结算价的 3%。', rightText: '质保金为结算价的 3%。' },
  ].filter((row) => change.length === 0 || change.includes(row.change))
  return {
    left: { label: '版本 1', docId: 'd-bridge', version: 1 },
    right: { label: '版本 2', docId: 'd-bridge', version: 2 },
    rows,
  }
}

export function readExceptions() {
  return clone(exceptions)
}

export function resolveVersion(taskId: string) {
  const task = tasks.get(taskId)
  if (!task) return { error: { code: 'REQUIRED', message: '没有任务' } }
  task.status = '待解析'
  return { data: clone(task) }
}

export function rerunTask(taskId: string) {
  const kept = clone(cards.get(taskId) ?? [])
  return { data: { kept } }
}

export function enableManual(taskId: string) {
  const task = tasks.get(taskId)
  if (!task) return { error: { code: 'REQUIRED', message: '没有任务' } }
  task.manualMode = true
  return { data: clone(task) }
}

export function closeTask(taskId: string, reason: string) {
  const task = tasks.get(taskId)
  if (!task) return { error: { code: 'REQUIRED', message: '没有任务' } }
  if (task.status !== '异常' && task.status !== '待确认') {
    return { error: { code: 'REQUIRED', message: '只能从异常或待确认关闭' } }
  }
  if (!reason.trim()) return { error: { code: 'REQUIRED', message: '原因必填' } }
  task.closedAs = '终止'
  return { data: clone(task) }
}

export function readMembers() {
  return clone(members)
}

export function writeMembers(next: ProjectMember[]) {
  members = clone(next)
  return clone(members)
}

export function readAudit(action: string) {
  return clone(auditLogs.filter((log) => !action || log.action === action))
}

export function exportAudit() {
  return '操作人：林审\n对象：t-bridge\n身份证号：**************1234\n银行账号：******\n合同价款：128000000\n工期：2026-04-01'
}

export function readDashboard(scope: 'self' | 'project'): Dashboard {
  return {
    本月审查时长: '18 小时',
    相对基线节省的时长: scope === 'project' ? '42 小时' : '6 小时',
    采纳率: '3/4',
    驳回率: '1/4',
    拦截的重大项数量: '2',
    重复问题下降: '1',
    新增规则数: '1',
  }
}

export function createTask(input: CreateTaskInput) {
  if (input.sizeMb > config.maxUploadMb || input.pages > config.maxPages) {
    return { error: { code: 'FILE_LIMIT', message: `超出上限 ${config.maxUploadMb}MB 或 ${config.maxPages} 页，任务进入异常` } }
  }
  if (input.fileKind === 'zip' && !input.mainEntry.trim()) {
    return { error: { code: 'REQUIRED', message: '多文件包必须指定主文件' } }
  }
  const taskId = `t-${Date.now()}`
  const title = input.title.trim() || `${input.projectId} + ${input.fileType} + 1`
  seedTask({
    taskId,
    projectId: 'p-bridge',
    projectName: input.projectId,
    title,
    status: '待解析',
    reviewStatusNote: '',
    finalized: input.finalized,
    showPaymentArchiveWarning: false,
    manualMode: false,
    closedAs: null,
    next: nextOf(me.name, '等待质检', '系统管理员'),
    members: [{ accountId: me.accountId, name: me.name, role: '审查负责人' }],
    versions: [
      {
        docId: `d-${taskId}`,
        version: 1,
        uploader: me.name,
        uploadedAt: new Date().toISOString(),
        hash: 'newhash',
        pages: input.pages,
        reviewing: true,
        readonly: false,
        draftWhileOlderFinal: false,
      },
    ],
    duplicateUpload: null,
    fileType: input.fileType,
    versionNote: input.versionNote,
    ownerAccountIds: input.ownerAccountIds,
    dueAt: input.dueAt,
    reviewScope: input.reviewScope,
    syncBusiness: input.syncBusiness,
    sourceChannel: input.sourceChannel,
  })
  cards.set(taskId, [])
  return { data: { taskId, status: '待解析' as const } }
}

export function markReviewVersion(taskId: string, version: number) {
  const task = tasks.get(taskId)
  if (!task) return { error: { code: 'REQUIRED', message: '没有任务' } }
  for (const item of task.versions) {
    item.reviewing = item.version === version
    item.readonly = item.version !== version
  }
  task.status = '待解析'
  for (const card of cards.get(taskId) ?? []) card.expired = true
  return { data: clone(task) }
}

export function rereview(taskId: string) {
  const task = tasks.get(taskId)
  if (!task) return { error: { code: 'REQUIRED', message: '没有任务' } }
  task.status = '待解析'
  return { data: clone(task) }
}

export function saveKnowledgeRecord(record: Regulation | Candidate | KnowledgeCase | BackfillItem) {
  function save<T extends { id: string }>(items: T[], value: T) {
    const index = items.findIndex((item) => item.id === value.id)
    if (index === -1) items.push(clone(value))
    else items[index] = clone(value)
  }

  if ('historicalUse' in record) save(regulations, record)
  else if ('published' in record) {
    const previous = candidates.find((item) => item.id === record.id)
    if (!previous || previous.pattern !== record.pattern) {
      candidateChanges.set(record.id, { operator: me.name, at: new Date().toISOString(), before: previous?.pattern ?? '', after: record.pattern })
    }
    save(candidates, record)
  }
  else if ('summary' in record) save(cases, record)
  else save(backfill, record)
}

export function deleteKnowledgeRecord(section: '法规' | '企业规则' | '案例' | '补库队列', id: string) {
  const items = { 法规: regulations, 企业规则: candidates, 案例: cases, 补库队列: backfill }[section]
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) items.splice(index, 1)
}
