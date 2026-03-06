'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Trash2, AlertCircle } from 'lucide-react'
import type { Node } from 'reactflow'
import type { WorkflowNodeData } from '@/types/workflow.types'

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

// ── Array item editor ────────────────────────────────────────────────────────

function ArrayItemEditor({
  param,
  label,
  value,
  error,
  onChange,
}: {
  param: NodeParam
  label: string
  value: any[]
  error?: string
  onChange: (v: any[]) => void
}) {
  const items: any[] = Array.isArray(value) ? value : []
  const fields: NodeParam[] = param.items ?? []
  const isRequired = !OPTIONAL_KEYS.has(param.key)

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

            {fields.length === 0 ? (
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
}: {
  param: NodeParam
  value: any
  error?: string
  onChange: (v: any) => void
}) {
  const label = toLabel(param.key)
  const isRequired = !OPTIONAL_KEYS.has(param.key)

  // Resolve select options: backend enum constraints take priority over client-side map
  const selectOpts =
    param.constraints?.enum
      ? param.constraints.enum.map((v) => ({ label: toLabel(v), value: v }))
      : (SELECT_OPTIONS[param.key] ?? [])

  if (param.type === 'array') {
    return (
      <ArrayItemEditor
        param={param}
        label={label}
        value={value}
        error={error}
        onChange={onChange}
      />
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={param.key}>
        {label}
        {isRequired && param.type !== 'boolean' && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </Label>

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
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          rows={3}
        />
      ) : (
        <Input
          id={param.key}
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

  const handleChange = (key: string, value: any) => {
    const next = { ...values, [key]: value }
    setValues(next)
    if (touched) setErrors(validate(schema, next))
  }

  const handleApply = () => {
    const errs = validate(schema, values)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setTouched(true)
      return
    }
    // schema → data.schema (preserved for re-open), values → data.params (backend format)
    onUpdate({ ...node, data: { ...data, schema, params: values } })
    onClose()
  }

  const nodeType: string = data.type ?? node.type ?? ''
  const categoryColor =
    node.type === 'trigger'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
      : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Properties</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg">{data.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.label}</p>
            <Badge className={`text-[10px] px-1.5 py-0 mt-0.5 ${categoryColor}`}>
              {nodeType}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
        {schema.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This node has no configurable parameters.
          </p>
        ) : (
          schema.map((param) => (
            <ParamField
              key={param.key}
              param={param}
              value={values[param.key]}
              error={errors[param.key]}
              onChange={(v) => handleChange(param.key, v)}
            />
          ))
        )}

        {data.waitForInput && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <span className="text-amber-600 dark:text-amber-400 text-sm">⏳</span>
            <p className="text-xs text-amber-700 dark:text-amber-300">Waits for user reply before continuing</p>
          </div>
        )}

        <div className="space-y-2">
          <Button onClick={handleApply} className="w-full" size="sm">
            Apply
          </Button>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            Node ID: {node.id}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
