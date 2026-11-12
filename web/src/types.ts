export type Release = 'R1' | 'R2' | 'R3'

export type Role =
  | '审查员'
  | '法务'
  | '技术负责人'
  | '知识管理员'
  | '系统管理员'
  | '项目负责人'
  | '商务'

export type TaskStatus =
  | '待解析'
  | '已解析'
  | '审查中'
  | '待确认'
  | '已完成'
  | '跟进中'
  | '异常'
  | '归档'

export type ReviewStatus =
  | '待审'
  | '待专家确认'
  | '双人复核中'
  | '待补充依据'
  | '已采纳'
  | '修改后采纳'
  | '已驳回'

export interface Me {
  accountId: string
  name: string
  roles: Role[]
  projectIds: string[]
}

export interface AppConfig {
  release: Release
  maxUploadMb: number
  maxPages: number
  retentionYears: number
  retentionWarnDays: number
}

export interface TaskNext {
  ownerName: string
  exitGap: string
  timeoutHandover: string
}

export interface WorkbenchItem {
  taskId: string
  title?: string
  version?: number
  uploadedAt?: string
}

export interface ProactiveCard {
  taskId: string
  event: string
}

export interface WorkbenchGroup {
  key: string
  count: number
  items: WorkbenchItem[]
}

export interface Workbench {
  groups: WorkbenchGroup[]
  pendingConfirmStallReason: string
  proactiveCards: ProactiveCard[]
  next: TaskNext
}

export interface Member {
  accountId: string
  name: string
  role: string
}

export interface TaskVersion {
  docId: string
  version: number
  uploader: string
  uploadedAt: string
  hash: string
  pages: number
  reviewing: boolean
  readonly: boolean
  draftWhileOlderFinal: boolean
  hashMismatch?: boolean
}

export interface Task {
  taskId: string
  projectId: string
  title: string
  status: TaskStatus
  reviewStatusNote: string
  finalized: boolean
  showPaymentArchiveWarning: boolean
  manualMode: boolean
  closedAs: '终止' | null
  next: TaskNext
  members: Member[]
  versions: TaskVersion[]
  duplicateUpload: string | null
  fileType: string
  versionNote: string
  ownerAccountIds: string[]
  dueAt: string
  reviewScope: string[]
  syncBusiness: boolean
  sourceChannel: string
  projectName: string
}

export interface TimelineItem {
  operator: string
  at: string
  objectId: string
  action: string
  reason: string
  before: string
  after: string
}

export interface MaterialField {
  key: string
  value: string
  unrecognized: boolean
  requiredLevel: '必抽' | '能抽则抽' | '必有'
  page: number | null
  docId: string
  version: number
}

export interface HistoricalHint {
  topic: string
  conclusion: string
  sourceTaskId: string
}

export interface MaterialCard {
  locked: boolean
  versionConfirmed: boolean
  fields: MaterialField[]
  historicalHints: HistoricalHint[]
  metaOnly: boolean
}

export interface SourceRef {
  docId: string
  version: number
  page: number
  clauseNo: string
  sourceType: string
  rawText: string
}

export interface Vote {
  role: '技术负责人' | '法务'
  accountId: string
  action: string
  status: string
}

export interface RiskCard {
  riskId: string
  taskId: string
  riskType: string
  riskLevel: '重大' | '一般' | '提示'
  sourceLocation: string
  ruleOrStandard: string
  caseRef: string | null
  suggestion: string
  confidence: '高' | '低' | null
  conflictNote: string
  sourceType: string
  evidenceState: '高置信' | '低置信' | '无依据'
  reviewStatus: ReviewStatus
  mustConfirm: boolean
  sourceRef: SourceRef[]
  materialCorrected: boolean
  expired: boolean
  carryOver: boolean
  locked: boolean
  votes: Vote[]
  beforeText?: string
  afterText?: string
}

export interface CardList {
  unclosedFirst: RiskCard[]
  cards: RiskCard[]
  noEvidence: RiskCard[]
}

export interface Preview {
  previewPdfUrl: string
  page: number
  version: number
  status: 'ok' | 'hash_mismatch'
  /** 模拟原文。对接后端后删除本字段，页面改为用 previewPdfUrl 展示原文。 */
  pageText: string
}

export interface ReportSectionItem {
  riskId?: string
  text: string
  docId?: string
  version?: number
  page?: number
  rawText?: string
  at?: string
}

export interface Report {
  status: TaskStatus
  finalized: boolean
  watermark: { project: string; version: number; generatedAt: string; operator: string }
  sections: {
    基本信息: string
    材料卡摘要: string
    重大风险: ReportSectionItem[]
    一般风险: ReportSectionItem[]
    提示: ReportSectionItem[]
    已驳回清单: ReportSectionItem[]
    证据清单: ReportSectionItem[]
    谈判话术: ReportSectionItem[]
  }
  exportEnabled: boolean
  frozen: boolean
}

export interface FollowUp {
  riskId: string
  riskType: string
  attitude: '接受' | '不接受' | '部分接受' | '未回复'
  needSupplementSign: boolean
  closeStatus: string
  closeReason: string
  closedBy: string
  closedAt: string
  suggestCase: boolean
  mustClose: boolean
}

export interface Regulation {
  id: string
  name: string
  version: string
  effectiveAt: string
  expiredAt: string
  scope: string
  historicalUse: boolean
}

export interface Candidate {
  id: string
  riskType: string
  pattern: string
  decision: string
  reason: string
  sourceTaskId: string
  published: boolean
}

export interface CandidateDiff {
  operator: string
  at: string
  before: string
  after: string
}

export interface KnowledgeCase {
  id: string
  title: string
  summary: string
}

export interface BackfillItem {
  id: string
  reason: string
}

export interface DiffSide {
  label: string
  docId: string
  version: number
}

export interface DiffRow {
  id: string
  change: '新增' | '修改' | '删除' | '未关闭'
  aligned: boolean
  riskId: string | null
  leftText: string
  rightText: string
}

export interface DiffResult {
  left: DiffSide
  right: DiffSide
  rows: DiffRow[]
}

export interface ExceptionItem {
  taskId: string
  ex: string
  title: string
  reason: string
  failedPages: number[]
  suggestion: '补件' | '转人工' | ''
  fileUrl: string
  ownerRole: string
  next: TaskNext
}

export interface AuditLog {
  operator: string
  at: string
  objectId: string
  action: string
  reason: string
  before: string
  after: string
}

export interface ProjectMember {
  accountId: string
  name: string
  roles: Role[]
}

export interface Dashboard {
  本月审查时长: string
  相对基线节省的时长: string
  采纳率: string
  驳回率: string
  拦截的重大项数量: string
  重复问题下降: string
  新增规则数: string
}

export interface CreateTaskInput {
  projectId: string
  fileName: string
  fileKind: 'pdf' | 'word' | 'zip'
  mainEntry: string
  fileType: string
  versionNote: string
  ownerAccountIds: string[]
  dueAt: string
  reviewScope: string[]
  syncBusiness: boolean
  attachmentNames: string[]
  sourceChannel: string
  finalized: boolean
  title: string
  sizeMb: number
  pages: number
}
