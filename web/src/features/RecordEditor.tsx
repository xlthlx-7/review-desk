import { useState } from 'react'

export interface RecordField {
  name: string
  label: string
  value?: string
  type?: 'date' | 'textarea'
  optional?: boolean
}

export function RecordEditor({ fields, label, busy, onSave, onDelete }: {
  fields: RecordField[]
  label: string
  busy: boolean
  onSave: (values: Record<string, string>) => Promise<boolean>
  onDelete?: () => Promise<boolean>
}) {
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null)

  return (
    <div className="record-editor">
      {mode === null && <div className="actions">
        <button type="button" disabled={busy} onClick={() => setMode('edit')}>{label}</button>
        {onDelete && <button type="button" disabled={busy} onClick={() => setMode('delete')}>删除</button>}
      </div>}
      {mode === 'edit' && <form className="form knowledge-editor" onSubmit={async (event) => {
        event.preventDefault()
        const values = Object.fromEntries([...new FormData(event.currentTarget)].map(([name, value]) => [name, String(value).trim()]))
        if (await onSave(values)) setMode(null)
      }}>
        <fieldset disabled={busy}>
          <legend>{label}</legend>
          {fields.map(({ name, label, value, type, optional }) => (
            <label key={name}>{label}
              {type === 'textarea'
                ? <textarea name={name} defaultValue={value} rows={3} required={!optional} />
                : <input name={name} type={type || 'text'} defaultValue={value} required={!optional} />}
            </label>
          ))}
          <div className="actions">
            <button type="submit">保存</button>
            <button type="button" onClick={() => setMode(null)}>取消</button>
          </div>
        </fieldset>
      </form>}
      {mode === 'delete' && onDelete && <div className="review-attention">
        <p>确认删除这条记录？</p>
        <div className="actions">
          <button type="button" disabled={busy} onClick={async () => { if (await onDelete()) setMode(null) }}>确认删除</button>
          <button type="button" disabled={busy} onClick={() => setMode(null)}>取消</button>
        </div>
      </div>}
    </div>
  )
}
