import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTask, getConfig } from '../api'
import { ErrorText, Frame } from '../features/common'
import { atLeast } from '../release'
import { useSession } from '../session'

const R1 = ['付款', '工期', '违约', '变更']
const R2 = ['安全', '质量', '索赔', '资质', '分包', '材料调价', '验收移交']
const TYPES_R1 = ['施工组织方案', '施工合同正文']
const TYPES_R2 = ['补充协议', '已确认的历史版本']
const CHANNELS = ['上传', 'OA', '邮件', '压缩包']

export function TaskCreatePage() {
  const navigate = useNavigate()
  const { config, me } = useSession()
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState('滨江大桥')
  const [fileName, setFileName] = useState('')
  const [fileKind, setFileKind] = useState<'pdf' | 'word' | 'zip'>('pdf')
  const [mainEntry, setMainEntry] = useState('')
  const [fileType, setFileType] = useState(TYPES_R1[0])
  const [versionNote, setVersionNote] = useState('')
  const [owner, setOwner] = useState(me.name)
  const [dueAt, setDueAt] = useState('2026-04-30')
  const [scope, setScope] = useState<string[]>(R1)
  const [syncBusiness, setSyncBusiness] = useState(false)
  const [attachment, setAttachment] = useState('')
  const [sourceChannel, setSourceChannel] = useState('上传')
  const [finalized, setFinalized] = useState(false)
  const [title, setTitle] = useState('')
  const [sizeMb, setSizeMb] = useState(12)
  const [pages, setPages] = useState(80)

  const types = atLeast(config.release, 'R2') ? [...TYPES_R1, ...TYPES_R2] : TYPES_R1
  const scopes = atLeast(config.release, 'R2') ? [...R1, ...R2] : R1
  const ready = projectId && fileName && fileType && versionNote && owner && dueAt && scope.length > 0

  async function submit() {
    if (!ready) return
    setError('')
    try {
      const limits = await getConfig()
      if (sizeMb > limits.maxUploadMb || pages > limits.maxPages) {
        setError(`超出上限 ${limits.maxUploadMb}MB 或 ${limits.maxPages} 页，任务进入异常`)
        return
      }
      await createTask({
        projectId,
        fileName,
        fileKind,
        mainEntry,
        fileType,
        versionNote,
        ownerAccountIds: [owner],
        dueAt,
        reviewScope: scope,
        syncBusiness,
        attachmentNames: attachment ? [attachment] : [],
        sourceChannel,
        finalized,
        title,
        sizeMb,
        pages,
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    }
  }

  return (
    <Frame title="新建审查任务">
      <form className="form" onSubmit={(event) => { event.preventDefault(); void submit() }}>
        <label>项目<input value={projectId} onChange={(event) => setProjectId(event.target.value)} /></label>
        <label>
          主文件
          <input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="合同.pdf" />
        </label>
        <label>
          文件种类
          <select value={fileKind} onChange={(event) => setFileKind(event.target.value as 'pdf' | 'word' | 'zip')}>
            <option value="pdf">PDF</option>
            <option value="word">Word</option>
            <option value="zip">压缩包</option>
          </select>
        </label>
        {fileKind === 'zip' ? (
          <label>指定主文件<input value={mainEntry} onChange={(event) => setMainEntry(event.target.value)} /></label>
        ) : null}
        <label>
          文件类型
          <select value={fileType} onChange={(event) => setFileType(event.target.value)}>
            {types.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label>版本说明<input value={versionNote} onChange={(event) => setVersionNote(event.target.value)} /></label>
        <label>审查负责人<input value={owner} onChange={(event) => setOwner(event.target.value)} /></label>
        <label>回复截止日期<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
        <fieldset>
          <legend>审查范围</legend>
          <div className="checks">
            {scopes.map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={scope.includes(item)}
                  onChange={(event) => {
                    setScope(event.target.checked ? [...scope, item] : scope.filter((name) => name !== item))
                  }}
                />
                {item}
              </label>
            ))}
          </div>
        </fieldset>
        <label>是否同步商务<input type="checkbox" checked={syncBusiness} onChange={(event) => setSyncBusiness(event.target.checked)} /></label>
        <label>附件<input value={attachment} onChange={(event) => setAttachment(event.target.value)} /></label>
        <label>
          来源渠道
          <select value={sourceChannel} onChange={(event) => setSourceChannel(event.target.value)}>
            {CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}
          </select>
        </label>
        <label>是否定稿<input type="checkbox" checked={finalized} onChange={(event) => setFinalized(event.target.checked)} /></label>
        <label>
          任务标题
          <input value={title} placeholder="项目 + 文件类型 + 版本" onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>大小 MB<input type="number" value={sizeMb} onChange={(event) => setSizeMb(Number(event.target.value))} /></label>
        <label>页数<input type="number" value={pages} onChange={(event) => setPages(Number(event.target.value))} /></label>
        <p className="meta">上限 {config.maxUploadMb}MB、{config.maxPages} 页</p>
        <button type="submit" disabled={!ready}>提交</button>
        <ErrorText error={error} />
      </form>
    </Frame>
  )
}
