import type { ReactNode } from 'react'
import type { Preview, TaskNext } from '../types'

export function TaskProgress({ next }: { next: TaskNext }) {
  return (
    <section className="progress">
      <p>当前责任人 {next.ownerName}</p>
      <p>退出条件还差什么 {next.exitGap}</p>
      <p>超时后谁接手 {next.timeoutHandover}</p>
    </section>
  )
}

export function RiskNotice() {
  return <p className="notice">重大风险未确认，建议不要进入付款或归档</p>
}

export function SourcePreview({ preview, highlight }: { preview: Preview | null; highlight?: string }) {
  if (!preview) return <p>没有原文页。</p>
  if (preview.status === 'hash_mismatch') return <p className="banner">文件哈希对不上，拒绝展示</p>
  // pageText 只存在于模拟数据。对接后端后改为用 preview.previewPdfUrl 展示原文页。
  const body = preview.pageText
  const parts = highlight && body.includes(highlight) ? body.split(highlight) : null
  return (
    <article className="sheet">
      <p className="meta">版本 {preview.version} · 第 {preview.page} 页</p>
      <p>
        {parts ? (
          <>
            {parts[0]}
            <mark>{highlight}</mark>
            {parts.slice(1).join(highlight)}
          </>
        ) : (
          body
        )}
      </p>
    </article>
  )
}

export function Frame({
  title,
  next,
  warning,
  children,
}: {
  title: string
  next?: TaskNext
  warning?: boolean
  children: ReactNode
}) {
  return (
    <div className="page">
      <header className="mast">
        <h1>{title}</h1>
      </header>
      {next ? <TaskProgress next={next} /> : null}
      {warning ? <RiskNotice /> : null}
      {children}
    </div>
  )
}

export function ErrorText({ error }: { error: string }) {
  if (!error) return null
  return <p className="banner">{error}</p>
}
