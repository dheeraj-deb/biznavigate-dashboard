'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCheck, ChevronRight, ChevronDown, Braces, Save, Loader2 } from 'lucide-react'
import type { Node } from 'reactflow'
import type { WorkflowNodeData } from '@/types/workflow.types'
import { useWorkflowVariables } from '@/hooks/use-workflow-nodes'
import type { WorkflowVariablesResponse } from '@/hooks/use-workflow-nodes'
import { useApprovedTemplates, useTemplateByName } from '@/hooks/use-whatsapp-templates'
import type { ApprovedTemplate } from '@/hooks/use-whatsapp-templates'

// ── Param type (matches backend NodeParamDefinition) ─────────────────────────

interface NodeParamConstraints {
  min?: number
  max?: number
  pattern?: string
  enum?: string[]
}

interface NodeParam {
  key: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'select'
  items?: NodeParam[]
  constraints?: NodeParamConstraints
}

// ── Client-side metadata ──────────────────────────────────────────────────────

/** Keys the user is not required to fill in */
const OPTIONAL_KEYS = new Set([
  'header', 'footer', 'query', 'description', 'skipLabel',
  'resultsMessage', 'model', 'prompt',
])

/** Keys that should render as a multiline textarea */
const MULTILINE_KEYS = new Set(['message', 'resultsMessage'])

/** Keys where the variable picker is relevant (content / dynamic text fields) */
const VARIABLE_KEYS = new Set(['message', 'body', 'header', 'footer', 'to', 'text', 'caption', 'resultsMessage', 'prompt'])

/** Options for select-type params, keyed by param.key */
const SELECT_OPTIONS: Record<string, { label: string; value: string }[]> = {
  presentationType: [
    { label: 'Buttons', value: 'buttons' },
    { label: 'List',    value: 'list'    },
    { label: 'Menu',    value: 'menu'    },
  ],
}

/** Convert camelCase / snake_case key → readable label */
function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

// ── Validation ───────────────────────────────────────────────────────────────

function validate(
  params: NodeParam[],
  values: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const p of params) {
    const optional = OPTIONAL_KEYS.has(p.key)
    const v = values[p.key]
    const c = p.constraints

    if (p.type === 'array') {
      const arr: any[] = Array.isArray(v) ? v : []
      const min = c?.min ?? (optional ? 0 : 1)
      const max = c?.max
      if (arr.length < min) {
        errors[p.key] = `Add at least ${min} ${toLabel(p.key).toLowerCase()} item${min !== 1 ? 's' : ''}`
      } else if (max !== undefined && arr.length > max) {
        errors[p.key] = `Max ${max} ${toLabel(p.key).toLowerCase()} item${max !== 1 ? 's' : ''} allowed`
      }
    } else if (p.type === 'boolean') {
      // booleans are always valid
    } else {
      const isEmpty = v === undefined || v === null || v === ''
      if (!optional && isEmpty) {
        errors[p.key] = `${toLabel(p.key)} is required`
      } else if (!isEmpty) {
        if (p.type === 'number') {
          const num = Number(v)
          if (c?.min !== undefined && num < c.min) {
            errors[p.key] = `Minimum value is ${c.min}`
          } else if (c?.max !== undefined && num > c.max) {
            errors[p.key] = `Maximum value is ${c.max}`
          }
        } else if (p.type === 'string' && c?.pattern) {
          if (!new RegExp(c.pattern).test(String(v))) {
            errors[p.key] = `${toLabel(p.key)} format is invalid`
          }
        }
      }
    }
  }
  return errors
}

const PREVIEW_INTERACTIVE_KEYS = ['menu', 'options', 'buttons', 'items']

// ── Node Preview (WhatsApp bubble, no handles) ────────────────────────────────

function NodePreview({ params }: { params: Record<string, any> }) {
  const interactiveKey = PREVIEW_INTERACTIVE_KEYS.find(
    (k) => Array.isArray(params[k]) && (params[k] as any[]).length > 0,
  )
  const items: any[] = interactiveKey ? (params[interactiveKey] as any[]) : []
  const isButtons = interactiveKey === 'buttons'

  if (items.length > 0) {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-[11px]">
        <div className="bg-[#ECE5DD] px-2 pt-2 pb-0">
          <div className="bg-white rounded-lg rounded-tl-none shadow-sm">
            {params.header && (
              <div className="px-3 pt-2 pb-1">
                <p className="text-xs font-bold text-[#1E1E1E]">{params.header}</p>
              </div>
            )}
            <div className="px-3 pt-2 pb-1">
              <p className="text-xs text-[#1E1E1E] leading-relaxed whitespace-pre-wrap break-words line-clamp-3">
                {params.message || <span className="italic text-gray-400">No message</span>}
              </p>
            </div>
            {params.footer && (
              <div className="px-3 pb-1">
                <p className="text-[10px] text-gray-400 italic">{params.footer}</p>
              </div>
            )}
            <div className="flex justify-end px-3 pb-2 gap-1 items-center">
              <span className="text-[9px] text-[#8C9A88]">now</span>
              <CheckCheck className="h-3 w-3 text-[#34B7F1]" />
            </div>
            <div className="border-t border-gray-100" />
            {isButtons
              ? items.map((item: any, idx: number) => (
                  <div key={idx} className="border-b last:border-b-0 border-gray-100">
                    <div className="flex items-center justify-center px-3 py-2">
                      <span className="text-xs font-medium text-[#0084FF] truncate">
                        {item.label ?? item.title ?? item.text ?? item.id}
                      </span>
                    </div>
                  </div>
                ))
              : items.map((item: any, idx: number) => (
                  <div key={idx} className="border-b last:border-b-0 border-gray-100">
                    <div className="flex items-center gap-2 px-3 py-2 pr-6">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1E1E1E] truncate">
                          {item.label ?? item.title ?? item.text ?? item.id}
                        </p>
                        {item.description && (
                          <p className="text-[10px] text-gray-400 truncate">{item.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
                    </div>
                  </div>
                ))}
          </div>
          <div className="h-2" />
        </div>
      </div>
    )
  }

  if (!params.message) return null

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="bg-[#ECE5DD] px-2 py-2">
        <div className="bg-[#DCF8C6] rounded-lg rounded-tl-none px-3 py-2 shadow-sm relative">
          <span
            className="absolute -left-2 top-0 w-0 h-0"
            style={{ borderRight: '8px solid #DCF8C6', borderBottom: '8px solid transparent' }}
          />
          <p className="text-xs text-[#1E1E1E] leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
            {params.message}
          </p>
          <div className="flex justify-end mt-1 gap-1 items-center">
            <span className="text-[9px] text-[#8C9A88]">now</span>
            <CheckCheck className="h-3 w-3 text-[#34B7F1]" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Variable Picker ───────────────────────────────────────────────────────────

function VariablePicker({
  variables,
  onSelect,
}: {
  variables: WorkflowVariablesResponse
  onSelect: (path: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as unknown as globalThis.Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const hasVars =
    (variables.system?.length ?? 0) > 0 || (variables.node_outputs?.length ?? 0) > 0
  if (!hasVars) return null

  return (
    <div className="relative flex-shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
        title="Insert variable"
      >
        <Braces className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {(variables.system?.length ?? 0) > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-900 sticky top-0">
                  System
                </p>
                {variables.system.map((v) => (
                  <button
                    key={v.path}
                    type="button"
                    onClick={() => { onSelect(v.path); setOpen(false) }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors border-b border-gray-50 dark:border-gray-800"
                  >
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{v.label}</p>
                    <p className="text-[10px] font-mono text-gray-400 truncate">
                      {`{{${v.path}}}`} · {v.example}
                    </p>
                  </button>
                ))}
              </>
            )}
            {(variables.node_outputs?.length ?? 0) > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-900 sticky top-0">
                  Node Outputs
                </p>
                {variables.node_outputs.map((v) => (
                  <button
                    key={v.path}
                    type="button"
                    onClick={() => { onSelect(v.path); setOpen(false) }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors border-b border-gray-50 dark:border-gray-800"
                  >
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{v.label}</p>
                    <p className="text-[10px] font-mono text-gray-400 truncate">
                      {`{{${v.path}}}`} · {v.example}
                    </p>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Array item editor ────────────────────────────────────────────────────────

function ArrayItemEditor({
  param,
  label,
  value,
  error,
  onChange,
  variables,
}: {
  param: NodeParam
  label: string
  value: any[]
  error?: string
  onChange: (v: any[]) => void
  variables?: WorkflowVariablesResponse
}) {
  const items: any[] = Array.isArray(value) ? value : []
  const fields: NodeParam[] = param.items ?? []
  const isRequired = !OPTIONAL_KEYS.has(param.key)
  const isVariablesParam = param.key === 'variables'

  const addItem = () => {
    const empty: Record<string, any> = { id: `option_${items.length + 1}` }
    fields.filter((f) => f.key !== 'id').forEach((f) => { empty[f.key] = '' })
    onChange([...items, empty])
  }

  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  const updateItem = (i: number, key: string, v: string) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [key]: v }
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {isVariablesParam && variables ? (
              // variables array: show a grouped select per item value
              <div className="space-y-1">
                <Label className="text-xs">Variable</Label>
                <select
                  value={item.value ?? ''}
                  onChange={(e) => updateItem(i, 'value', e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a variable…</option>
                  {(variables.system?.length ?? 0) > 0 && (
                    <optgroup label="System">
                      {variables.system.map((v) => (
                        <option key={v.path} value={`{{${v.path}}}`}>
                          {v.label} — {v.example}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {(variables.node_outputs?.length ?? 0) > 0 && (
                    <optgroup label="Node Outputs">
                      {variables.node_outputs.map((v) => (
                        <option key={v.path} value={`{{${v.path}}}`}>
                          {v.label} — {v.example}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            ) : fields.length === 0 ? (
              <Input
                value={item.value ?? ''}
                onChange={(e) => updateItem(i, 'value', e.target.value)}
                placeholder="Value"
                className="h-7 text-xs"
              />
            ) : (
              fields.filter((f) => f.key !== 'id').map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{toLabel(field.key)}</Label>
                  <Input
                    value={item[field.key] ?? ''}
                    onChange={(e) => updateItem(i, field.key, e.target.value)}
                    placeholder={toLabel(field.key)}
                    className="h-7 text-xs"
                  />
                </div>
              ))
            )}
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            No items yet — click Add
          </p>
        )}
      </div>
    </div>
  )
}

// ── Single param field ───────────────────────────────────────────────────────

function ParamField({
  param,
  value,
  error,
  onChange,
  variables,
}: {
  param: NodeParam
  value: any
  error?: string
  onChange: (v: any) => void
  variables?: WorkflowVariablesResponse
}) {
  const elRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const label = toLabel(param.key)
  const isRequired = !OPTIONAL_KEYS.has(param.key)

  // Resolve select options: backend enum constraints take priority over client-side map
  const selectOpts =
    param.constraints?.enum
      ? param.constraints.enum.map((v) => ({ label: toLabel(v), value: v }))
      : (SELECT_OPTIONS[param.key] ?? [])

  // Show variable picker only on content/text fields — not on IDs, names, language, etc.
  const canInsertVar = VARIABLE_KEYS.has(param.key) && !!variables

  const insertVariable = (path: string) => {
    const snippet = `{{${path}}}`
    const el = elRef.current
    if (el !== null && typeof el.selectionStart === 'number') {
      const start = el.selectionStart ?? 0
      const end = el.selectionEnd ?? start
      const cur = String(value ?? '')
      onChange(cur.slice(0, start) + snippet + cur.slice(end))
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + snippet.length
        el.focus()
      })
    } else {
      onChange(String(value ?? '') + snippet)
    }
  }

  if (param.type === 'array') {
    return (
      <ArrayItemEditor
        param={param}
        label={label}
        value={value}
        error={error}
        onChange={onChange}
        variables={variables}
      />
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={param.key}>
          {label}
          {isRequired && param.type !== 'boolean' && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        {canInsertVar && variables && (
          <VariablePicker variables={variables} onSelect={insertVariable} />
        )}
      </div>

      {param.type === 'select' ? (
        <select
          id={param.key}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select…</option>
          {selectOpts.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : param.type === 'boolean' ? (
        <div className="flex items-center gap-2">
          <input
            id={param.key}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        </div>
      ) : param.type === 'number' ? (
        <Input
          id={param.key}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      ) : MULTILINE_KEYS.has(param.key) ? (
        <Textarea
          id={param.key}
          ref={elRef as any}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          rows={3}
        />
      ) : (
        <Input
          id={param.key}
          ref={elRef as any}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
        />
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
}

// ── Template Preview (uses real template components + substituted variables) ──

function TemplatePreview({
  template,
  variables,
}: {
  template: ApprovedTemplate | null
  variables: Array<{ value: string }>
}) {
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <span className="text-2xl">📄</span>
        <p className="text-xs text-gray-500 italic">Select a template to preview</p>
      </div>
    )
  }

  // components is an object: { body, header, footer, buttons }
  const c = template.components ?? {}

  const interpolate = (text: string) =>
    text.replace(/\{\{(\d+)\}\}/g, (_m, n) => {
      const val = variables[parseInt(n, 10) - 1]?.value
      return val || `{{${n}}}`
    })

  const headerText = c.header?.text ? interpolate(c.header.text) : null
  const bodyText   = c.body   ? interpolate(c.body)   : null
  const footerText = c.footer ?? null

  return (
    <div className="rounded-lg overflow-hidden text-[11px]">
      <div className="bg-[#ECE5DD] px-2 py-2">
        <div className="bg-white rounded-lg rounded-tl-none shadow-sm relative">
          <span
            className="absolute -left-2 top-0 w-0 h-0"
            style={{ borderRight: '8px solid #ffffff', borderBottom: '8px solid transparent' }}
          />
          {headerText && (
            <div className="px-3 pt-2 pb-1 border-b border-gray-100">
              <p className="text-xs font-bold text-[#1E1E1E]">{headerText}</p>
            </div>
          )}
          {bodyText && (
            <div className="px-3 pt-2 pb-1">
              <p className="text-xs text-[#1E1E1E] leading-relaxed whitespace-pre-wrap break-words">
                {bodyText}
              </p>
            </div>
          )}
          {footerText && (
            <div className="px-3 pb-1">
              <p className="text-[10px] text-gray-400 italic">{footerText}</p>
            </div>
          )}
          <div className="flex justify-end px-3 pb-2 gap-1 items-center">
            <span className="text-[9px] text-[#8C9A88]">now</span>
            <CheckCheck className="h-3 w-3 text-[#34B7F1]" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Send Template Fields (template node custom form) ─────────────────────────

function SendTemplateFields({
  values,
  onChange,
  variables,
}: {
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  variables?: WorkflowVariablesResponse
}) {
  const { data: approvedTemplates = [], isLoading: listLoading } = useApprovedTemplates()
  const selectedName = (values.template_name ?? '') as string

  // Fetch full template details when a name is selected — this is the API call on selection
  const { data: fetchedTemplate, isLoading: detailLoading } = useTemplateByName(selectedName)

  // Prefer fetched details; fall back to approved-list entry for instant display
  const selectedTemplate: ApprovedTemplate | null =
    fetchedTemplate ?? (approvedTemplates.find((t) => t.name === selectedName) ?? null)

  const prevNameRef = useRef<string | null>(null)

  // Auto-fill language + resize variables array whenever the resolved template changes
  useEffect(() => {
    if (!selectedTemplate) return
    if (selectedTemplate.name === prevNameRef.current) return
    prevNameRef.current = selectedTemplate.name

    onChange('language', selectedTemplate.language)

    const sc = selectedTemplate.components ?? {}
    const combined = (sc.header?.text ?? '') + (sc.body ?? '')
    const varCount = new Set((combined.match(/\{\{(\d+)\}\}/g) ?? []).map((m) => m.replace(/\D/g, ''))).size
    const existing: any[] = Array.isArray(values.variables) ? values.variables : []
    onChange('variables', Array.from({ length: varCount }, (_, i) => existing[i] ?? { value: '' }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.name])

  const vars: any[] = Array.isArray(values.variables) ? values.variables : []

  const updateVar = (idx: number, val: string) => {
    const updated = [...vars]
    updated[idx] = { ...updated[idx], value: val }
    onChange('variables', updated)
  }

  return (
    <div className="space-y-6">

      {/* Template dropdown */}
      <div className="space-y-1.5">
        <Label>
          Template <span className="text-destructive">*</span>
        </Label>
        {approvedTemplates.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading templates…
          </div>
        ) : (
          <select
            value={selectedName}
            onChange={(e) => {
              const name = e.target.value
              onChange('template_name', name)
              const tpl = approvedTemplates.find((t) => t.name === name)
              if (tpl) onChange('language', tpl.language)
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a template…</option>
            {approvedTemplates.map((t) => (
              <option key={t._id} value={t.name}>
                {t.name} · {t.language.toUpperCase()} · {t.category}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Language — auto-filled, read-only */}
      {values.language && (
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Input value={values.language} readOnly className="bg-muted text-muted-foreground cursor-default" />
        </div>
      )}


      {/* Variable mapping */}
      {vars.length > 0 && (
        <div className="space-y-3">
          <div>
            <Label>Variable Mapping</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Map each placeholder to a workflow variable
            </p>
          </div>
          {vars.map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-muted rounded px-1.5 py-0.5 flex-shrink-0">
                {`{{${i + 1}}}`}
              </span>
              <div className="flex-1">
                {variables ? (
                  <select
                    value={v.value ?? ''}
                    onChange={(e) => updateVar(i, e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select variable…</option>
                    {(variables.system?.length ?? 0) > 0 && (
                      <optgroup label="System">
                        {variables.system.map((wv) => (
                          <option key={wv.path} value={`{{${wv.path}}}`}>
                            {wv.label} — {wv.example}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {(variables.node_outputs?.length ?? 0) > 0 && (
                      <optgroup label="Node Outputs">
                        {variables.node_outputs.map((wv) => (
                          <option key={wv.path} value={`{{${wv.path}}}`}>
                            {wv.label} — {wv.example}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                ) : (
                  <Input
                    value={v.value ?? ''}
                    onChange={(e) => updateVar(i, e.target.value)}
                    placeholder={`Value for {{${i + 1}}}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface NodePropertiesProps {
  node: Node<WorkflowNodeData>
  onUpdate: (node: Node<WorkflowNodeData>) => void
  onClose: () => void
}

export function NodeProperties({ node, onUpdate, onClose }: NodePropertiesProps) {
  const data = node.data as any

  // Schema lives in data.schema after first apply, or in data.params (array) on first open.
  // data.params (object) holds user-filled values after first apply.
  const schema: NodeParam[] =
    data.schema ?? (Array.isArray(data.params) ? data.params : [])

  const nodeDataType: string = data.type ?? ''
  const { data: variables } = useWorkflowVariables(nodeDataType ? [nodeDataType] : undefined)

  // Matches 'action.send_template', 'action.sendtemplate', 'sendTemplate', etc.
  const isTemplateNode = nodeDataType.toLowerCase().replace(/[_\s]/g, '').includes('sendtemplate')

  const initValues = (src: any) => {
    const pv: Record<string, any> =
      !Array.isArray(src.params) && src.params ? src.params : {}
    const init: Record<string, any> = {}
    schema.forEach((p) => {
      init[p.key] = pv[p.key] ?? (p.type === 'array' ? [] : (p.type === 'boolean' ? false : ''))
    })
    return init
  }

  const [values, setValues] = useState<Record<string, any>>(() => initValues(data))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    setValues(initValues(data))
    setErrors({})
    setTouched(false)
  }, [node.id])

  // For sendtemplate nodes: load approved list once, find selected by name (no second API call)
  const { data: allApprovedTemplates = [] } = useApprovedTemplates()
  const selectedTemplate = isTemplateNode
    ? (allApprovedTemplates.find((t) => t.name === (values.template_name ?? '')) ?? null)
    : null

  const handleChange = (key: string, value: any) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      if (touched) setErrors(validate(schema, next))
      return next
    })
  }

  const handleApply = () => {
    // Template nodes are self-validating via their own form — skip schema validation
    if (!isTemplateNode) {
      const errs = validate(schema, values)
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        setTouched(true)
        return
      }
    }
    // schema → data.schema (preserved for re-open), values → data.params (backend format)
    onUpdate({ ...node, data: { ...data, schema, params: values } })
    onClose()
  }

  const nodeType: string = data.type ?? node.type ?? ''
  const isTrigger = node.type === 'trigger'
  const categoryLabel = isTrigger ? 'Trigger' : 'Action'

  return (
    <div className="fixed inset-0 z-50 flex bg-background">

      {/* ══ LEFT PANEL — form (wider) ═════════════════════════════════════════ */}
      <div className="flex flex-col flex-[3] min-w-0 bg-card border-r border-border">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflow
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-xl">{data.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{data.label}</p>
              <p className="text-[11px] text-muted-foreground">{categoryLabel} · {nodeType}</p>
            </div>
          </div>

          <Button onClick={handleApply} size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {isTemplateNode ? (
            <SendTemplateFields
              values={values}
              onChange={handleChange}
              variables={variables ?? undefined}
            />
          ) : schema.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <span className="text-3xl">{data.icon}</span>
              <p className="text-sm text-muted-foreground">No configurable parameters.</p>
            </div>
          ) : (
            schema.map((param) => (
              <ParamField
                key={param.key}
                param={param}
                value={values[param.key]}
                error={errors[param.key]}
                onChange={(v) => handleChange(param.key, v)}
                variables={variables ?? undefined}
              />
            ))
          )}

          {data.waitForInput && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <span>⏳</span>
              <p className="text-xs text-amber-700 dark:text-amber-300">Waits for user reply before continuing</p>
            </div>
          )}
        </div>

        <div className="px-8 py-3 border-t border-border flex-shrink-0">
          <p className="text-[11px] text-muted-foreground/50 font-mono">{node.id}</p>
        </div>
      </div>

      {/* ══ RIGHT PANEL — preview (narrower) ═════════════════════════════════ */}
      <div className="flex flex-col flex-[2] min-w-0 bg-muted/30 overflow-y-auto items-center justify-start gap-4 p-6">
        <div className="w-full">
          <p className="text-xs font-semibold text-foreground">Preview</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Live WhatsApp message preview</p>
        </div>

        {/* Compact phone */}
        <div
          className="flex-shrink-0 bg-gray-900"
          style={{ width: 260, borderRadius: 36, border: '7px solid #1C1C1E', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}
        >
          <div className="overflow-hidden" style={{ borderRadius: 29 }}>
            {/* WA header */}
            <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">BN</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[10px] font-semibold leading-none truncate">BizNavigate Bot</p>
                <p className="text-white/60 text-[9px] mt-0.5">online</p>
              </div>
            </div>
            {/* Chat */}
            <div className="bg-[#E5DDD5] p-2.5 min-h-[280px]">
              {isTemplateNode
                ? <TemplatePreview
                    template={selectedTemplate ?? null}
                    variables={Array.isArray(values.variables) ? values.variables : []}
                  />
                : <NodePreview params={values} />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
