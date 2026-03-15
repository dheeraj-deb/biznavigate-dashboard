'use client'
import { AttributeField, ServiceFormData } from './types'
import { Switch } from '@/components/ui/switch'
import { X, Plus } from 'lucide-react'

const INPUT_CLS = 'h-10 w-full bg-transparent text-[13px] text-[#4B4B4B] placeholder:text-[#989898] rounded-[4px] border border-[#989898] px-3 focus:outline-none focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors shadow-none'

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[13px] font-bold text-[#4B4B4B]">
      {children}{required && <span className="ml-1 text-[#0066FF]">*</span>}
    </label>
  )
}

/** Renders a single dynamic attribute field based on its type */
export function DynamicField({ field, value, onChange }: {
  field: AttributeField
  value: unknown
  onChange: (key: string, val: unknown) => void
}) {
  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-slate-50/60 px-4 py-3">
        <FieldLabel>{field.label}</FieldLabel>
        <Switch checked={!!value} onCheckedChange={v => onChange(field.key, v)} />
      </div>
    )
  }
  if (field.type === 'select') {
    return (
      <div className="space-y-1.5">
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <select
          value={String(value ?? '')}
          onChange={e => onChange(field.key, e.target.value)}
          className={INPUT_CLS}
        >
          <option value="">Select…</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }
  if (field.type === 'multi-select') {
    const selected = (value as string[]) || []
    return (
      <div className="space-y-1.5">
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {field.options?.map(opt => {
            const active = selected.includes(opt)
            return (
              <button
                key={opt} type="button"
                onClick={() => onChange(field.key, active ? selected.filter(s => s !== opt) : [...selected, opt])}
                className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-all ${active ? 'bg-[#0066FF] border-[#0066FF] text-white' : 'border-[#E5E5E5] text-[#6E6E6E] hover:border-[#0066FF] hover:text-[#0066FF]'}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  // text | number
  return (
    <div className="space-y-1.5">
      <FieldLabel required={field.required}>{field.label}</FieldLabel>
      <input
        type={field.type}
        value={String(value ?? '')}
        onChange={e => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
        className={INPUT_CLS}
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    </div>
  )
}

/** Slide-over form panel for Add / Edit service */
export function ServiceFormPanel({ open, schema, editData, serviceType: _serviceType, typeLabel, accent, onClose, onSubmit, submitting }: {
  open: boolean
  schema: AttributeField[]
  editData: ServiceFormData
  serviceType: string
  typeLabel: string
  accent: string
  onClose: () => void
  onSubmit: (data: ServiceFormData) => void
  submitting: boolean
}) {
  const [form, setForm] = React.useState<ServiceFormData>(editData)
  const [newUrl, setNewUrl] = React.useState('')

  React.useEffect(() => { setForm(editData) }, [editData])

  const set = (k: keyof ServiceFormData, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const setAttr = (k: string, v: unknown) => setForm(p => ({ ...p, attributes: { ...p.attributes, [k]: v } }))
  const addUrl = () => {
    if (newUrl.trim()) { set('image_urls', [...form.image_urls, newUrl.trim()]); setNewUrl('') }
  }
  const removeUrl = (i: number) => set('image_urls', form.image_urls.filter((_, idx) => idx !== i))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold mb-1" style={{ background: `${accent}15`, color: accent }}>
              {typeLabel}
            </span>
            <h2 className="text-[17px] font-bold text-[#4B4B4B]">
              {editData.name ? `Edit ${typeLabel}` : `Add New ${typeLabel}`}
            </h2>
          </div>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl border border-[#E5E5E5] hover:bg-slate-50 transition-colors">
            <X className="h-4 w-4 text-[#4B4B4B]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Fixed fields */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider">Basic Details</p>
            <div className="space-y-1.5">
              <FieldLabel required>Name</FieldLabel>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={`e.g. Deluxe ${typeLabel}`} className={INPUT_CLS} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Description</FieldLabel>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                placeholder="Brief description…"
                className="w-full bg-transparent text-[13px] text-[#4B4B4B] placeholder:text-[#989898] rounded-[4px] border border-[#989898] px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors shadow-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel required>Base Price (₹)</FieldLabel>
                <input type="number" value={form.base_price} onChange={e => set('base_price', e.target.value)} placeholder="0" className={INPUT_CLS} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Capacity (units)</FieldLabel>
                <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="0" className={INPUT_CLS} />
              </div>
            </div>
          </div>

          {/* Dynamic attribute fields */}
          {schema.length > 0 && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider">Attributes</p>
              {schema.map(field => (
                <DynamicField key={field.key} field={field} value={form.attributes[field.key]} onChange={setAttr} />
              ))}
            </div>
          )}

          {/* Image URLs */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider">Image URLs</p>
            <div className="flex gap-2">
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                placeholder="https://…" className={`${INPUT_CLS} flex-1`} />
              <button type="button" onClick={addUrl} className="h-10 px-3 rounded-[4px] border border-[#0066FF] text-[#0066FF] hover:bg-blue-50 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.image_urls.length > 0 && (
              <div className="space-y-1.5">
                {form.image_urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-[#E5E5E5] bg-slate-50 px-3 py-2">
                    <span className="flex-1 text-[12px] text-[#6E6E6E] truncate">{url}</span>
                    <button type="button" onClick={() => removeUrl(i)} className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-full border border-[#E5E5E5] text-[13px] font-semibold text-[#4B4B4B] hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button" onClick={() => onSubmit(form)} disabled={submitting || !form.name.trim() || !form.base_price || !form.capacity}
            className="flex-1 h-10 rounded-full text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 4px 14px ${accent}40` }}
          >
            {submitting ? <><span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> Saving…</> : `Save ${typeLabel}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Need React imported for useState/useEffect
import React from 'react'
