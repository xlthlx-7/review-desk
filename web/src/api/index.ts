/**
 * 页面对外只使用本文件。
 * 对接后端时：
 * 1. 删除 src/mocks 目录
 * 2. 把下面每个函数里的 mock 调用换成 fetch('/api/...')
 * 3. 不要改函数名和返回字段
 */
import { ApiError } from './errors'
import * as mock from '../mocks/db'
import type { CreateTaskInput, FollowUp, Preview, ProjectMember } from '../types'

type MockResult<T> = { data: T } | { error: { code: string; message: string; ex?: string } }

function unwrap<T>(result: MockResult<T> | T): T {
  if (result && typeof result === 'object' && 'error' in result && result.error) {
    throw new ApiError(result.error)
  }
  if (result && typeof result === 'object' && 'data' in result) return result.data
  return result as T
}

export function getConfig() {
  return Promise.resolve(mock.readConfig())
}

export function getMe() {
  return Promise.resolve(mock.readMe())
}

export function getWorkbench() {
  return Promise.resolve(mock.readWorkbench())
}

export function getTask(taskId: string) {
  const task = mock.readTask(taskId)
  if (task === 'forbidden') throw new ApiError({ code: '403', message: '无权查看这个项目的任务' })
  if (!task) throw new ApiError({ code: '404', message: '没有这个任务' })
  return Promise.resolve(task)
}

export function getTimeline(taskId: string) {
  return Promise.resolve(mock.readTimeline(taskId))
}

export function getMaterialCard(taskId: string, metaOnly: boolean) {
  const card = mock.readMaterial(taskId, metaOnly)
  if (!card) throw new ApiError({ code: '404', message: '没有材料卡' })
  return Promise.resolve(card)
}

export function saveMaterialCard(taskId: string, reason: string, fields: { key: string; value: string }[]) {
  const result = mock.saveMaterial(taskId, reason, fields)
  if ('error' in result && result.error) return Promise.reject(new ApiError(result.error))
  return Promise.resolve(result.data)
}

export function getPreview(docId: string, version: number, page: number): Promise<Preview> {
  const result = mock.readPreview(docId, version, page)
  if ('error' in result && result.error) return Promise.reject(new ApiError(result.error))
  return Promise.resolve(result as Preview)
}

export function getCards(taskId: string) {
  return Promise.resolve(mock.readCards(taskId))
}

export function getOpinionPresets() {
  return Promise.resolve(mock.readPresets())
}

export function submitDecision(
  taskId: string,
  riskId: string,
  input: { action: string; reason: string; clauseRef: string; suggestion: string; createSuppression: boolean },
) {
  return Promise.resolve(unwrap(mock.decideCard(taskId, riskId, input)))
}

export function batchConfirm(taskId: string, riskIds: string[]) {
  return Promise.resolve(unwrap(mock.batchConfirm(taskId, riskIds)))
}

export function changeLevel(taskId: string, riskId: string, direction: string, reason: string) {
  return Promise.resolve(unwrap(mock.setLevel(taskId, riskId, direction, reason)))
}

export function reopenCard(taskId: string, riskId: string) {
  return Promise.resolve(unwrap(mock.reopenCard(taskId, riskId)))
}

export function createManualCard(taskId: string, sourceLocation: string, rawText: string, standardRef: string) {
  return Promise.resolve(unwrap(mock.addManualCard(taskId, sourceLocation, rawText, standardRef)))
}

export function getStandard(standardRef: string) {
  return Promise.resolve(mock.readStandard(standardRef))
}

export function getReviewQueue() {
  return Promise.resolve(mock.readQueue())
}

export function coordinate(taskId: string, riskId: string, action: string) {
  return Promise.resolve(unwrap(mock.coordinate(taskId, riskId, action)))
}

export function getReport(taskId: string) {
  const report = mock.readReport(taskId)
  if (!report) throw new ApiError({ code: '404', message: '还没有报告' })
  return Promise.resolve(report)
}

export function exportReport(taskId: string, includeNegotiation: boolean) {
  const result = mock.exportReport(taskId, includeNegotiation)
  if ('error' in result && result.error) return Promise.reject(new ApiError(result.error))
  return Promise.resolve(result.data)
}

export function registerSend(taskId: string, input: { channel: string; recipient: string; sentAt: string; note: string }) {
  return Promise.resolve(unwrap(mock.sendReport(taskId, input.channel)))
}

export function archiveTask(taskId: string, reason: string, fromFollowUp = false) {
  return Promise.resolve(unwrap(mock.archiveTask(taskId, reason, fromFollowUp)))
}

export function getFollowUps(taskId: string) {
  return Promise.resolve(mock.readFollowUps(taskId))
}

export function updateFollowUp(taskId: string, riskId: string, input: { attitude?: FollowUp['attitude']; needSupplementSign?: boolean; saveAsCase?: boolean }) {
  return Promise.resolve(unwrap(mock.patchFollowUp(taskId, riskId, input, false)))
}

export function closeFollowUp(taskId: string, riskId: string, closeReason: string, saveAsCase: boolean) {
  return Promise.resolve(unwrap(mock.closeFollowUp(taskId, riskId, closeReason, saveAsCase)))
}

export function getRegulations() {
  return Promise.resolve(mock.readRegulations())
}

export function setHistoricalUse(id: string, enabled: boolean) {
  return Promise.resolve(unwrap(mock.setHistoricalUse(id, enabled)))
}

export function getCandidates() {
  return Promise.resolve(mock.readCandidates())
}

export function editCandidate(id: string, pattern: string) {
  return Promise.resolve(unwrap(mock.updateCandidate(id, { pattern })))
}

export function maskCandidate(id: string) {
  return Promise.resolve(unwrap(mock.maskCandidate(id)))
}

export function trialCandidate(id: string) {
  return Promise.resolve(unwrap(mock.trialCandidate(id)))
}

export function publishCandidate(id: string) {
  return Promise.resolve(unwrap(mock.publishCandidate(id)))
}

export function discardCandidate(id: string) {
  return Promise.resolve(unwrap(mock.discardCandidate(id)))
}

export function getCandidateDiff(id: string) {
  return Promise.resolve(mock.readCandidateDiff(id))
}

export function getCases() {
  return Promise.resolve(mock.readCases())
}

export function getBackfill() {
  return Promise.resolve(mock.readBackfill())
}

export function getDiff(taskId: string, change: string[]) {
  void taskId
  return Promise.resolve(mock.readDiff(change))
}

export function getExceptions() {
  return Promise.resolve(mock.readExceptions())
}

export function resolveVersion(taskId: string, docId: string, version: number) {
  void docId
  void version
  return Promise.resolve(unwrap(mock.resolveVersion(taskId)))
}

export function rerunTask(taskId: string) {
  return Promise.resolve(unwrap(mock.rerunTask(taskId)))
}

export function enableManualMode(taskId: string) {
  return Promise.resolve(unwrap(mock.enableManual(taskId)))
}

export function closeTask(taskId: string, reason: string) {
  return Promise.resolve(unwrap(mock.closeTask(taskId, reason)))
}

export function getMembers(projectId: string) {
  void projectId
  return Promise.resolve(mock.readMembers())
}

export function saveMembers(projectId: string, members: ProjectMember[]) {
  void projectId
  return Promise.resolve(mock.writeMembers(members))
}

export function getAuditLogs(action: string) {
  return Promise.resolve(mock.readAudit(action))
}

export function exportAuditLogs() {
  return Promise.resolve(mock.exportAudit())
}

export function getDashboard(scope: 'self' | 'project', projectId: string) {
  void projectId
  return Promise.resolve(mock.readDashboard(scope))
}

export function createTask(input: CreateTaskInput) {
  return Promise.resolve(unwrap(mock.createTask(input)))
}

export function markReviewVersion(taskId: string, docId: string, version: number) {
  void docId
  return Promise.resolve(unwrap(mock.markReviewVersion(taskId, version)))
}

export function rereview(taskId: string) {
  return Promise.resolve(unwrap(mock.rereview(taskId)))
}

export function uploadNextVersion(taskId: string, fileName: string) {
  void fileName
  return Promise.resolve(unwrap(mock.createTask({
    projectId: taskId,
    fileName,
    fileKind: 'pdf',
    mainEntry: '',
    fileType: '施工合同正文',
    versionNote: '新版本',
    ownerAccountIds: ['u-lin'],
    dueAt: '2026-05-01',
    reviewScope: ['付款'],
    syncBusiness: false,
    attachmentNames: [],
    sourceChannel: '上传',
    finalized: false,
    title: '',
    sizeMb: 1,
    pages: 1,
  })))
}

export async function saveKnowledgeRecord(record: Parameters<typeof mock.saveKnowledgeRecord>[0]) {
  mock.saveKnowledgeRecord(record)
}

export async function deleteKnowledgeRecord(...args: Parameters<typeof mock.deleteKnowledgeRecord>) {
  mock.deleteKnowledgeRecord(...args)
}
