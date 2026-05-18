'use client'

import { useCallback, useMemo, useRef } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { VariablePopover } from './variable-popover'
import type { NodeDefinition, NodeParamDefinition, WizardNode } from './types'

interface StepEditDrawerProps {
  open: boolean
  onClose: () => void
  node: WizardNode | null
  nodeDef: NodeDefinition | null
  precedingNodeTypes: string[]
  triggerVars?: Array<{ name?: string; value?: string }>
  onChange: (params: Record<string, any>) => void
  onRename: (name: string) => void
  onDelete: () => void
}

/**
 * Side drawer that renders a node's params dynamically from its NodeDefinition.
 * Long-form text fields get a "Variable" popover to insert `${path}` tokens at
 * the cursor. Array fields (menu options, buttons) render as add/remove rows.
 */
export function StepEditDrawer({
  open,
  onClose,
  node,
  nodeDef,
  precedingNodeTypes,
  triggerVars,
  onChange,
  onRename,
  onDelete,
}: StepEditDrawerProps) {
  if (!node || !nodeDef) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-md" />
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-muted text-lg">
              {nodeDef.icon}
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate text-base">{nodeDef.label}</SheetTitle>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {nodeDef.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Step label override (cosmetic, helps users find this step in the list) */}
          <div>
            <Label className="text-xs font-medium">Step label</Label>
            <Input
              value={node.name}
              onChange={(e) => onRename(e.target.value)}
              placeholder={nodeDef.label}
              className="mt-1.5"
            />
          </div>

          {nodeDef.params.length === 0 ? (
            <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              This step has no settings.
            </p>
          ) : (
            nodeDef.params.map((paramDef) => (
              <ParamField
                key={paramDef.key}
                def={paramDef}
                value={node.params?.[paramDef.key]}
                onChange={(value) => onChange({ [paramDef.key]: value })}
                precedingNodeTypes={precedingNodeTypes}
                triggerVars={triggerVars}
              />
            ))
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onDelete()
              onClose()
            }}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete step
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Param field renderer ────────────────────────────────────────────────────

function ParamField({
  def,
  value,
  onChange,
  precedingNodeTypes,
  triggerVars,
}: {
  def: NodeParamDefinition
  value: any
  onChange: (value: any) => void
  precedingNodeTypes: string[]
  triggerVars?: Array<{ name?: string; value?: string }>
}) {
  const showVariablePicker = def.type === 'string'
  const labelText = humanizeParamKey(def.key)
  const hint = paramHint(def)

  if (def.type === 'boolean') {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label className="text-sm font-medium">{labelText}</Label>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    )
  }

  if (def.type === 'select' && def.constraints?.enum?.length) {
    return (
      <div>
        <Label className="text-sm font-medium">{labelText}</Label>
        <Select value={value ?? ''} onValueChange={onChange}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            {def.constraints.enum.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    )
  }

  if (def.type === 'number') {
    return (
      <div>
        <Label className="text-sm font-medium">{labelText}</Label>
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          min={def.constraints?.min}
          max={def.constraints?.max}
          className="mt-1.5"
        />
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    )
  }

  if (def.type === 'array' && def.items?.length) {
    return (
      <ArrayField
        def={def}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
        precedingNodeTypes={precedingNodeTypes}
        triggerVars={triggerVars}
      />
    )
  }

  // string (default)
  const isMultiline = def.key === 'message' || def.key === 'body' || def.key === 'body_text' || def.key === 'description' || def.key === 'resultsMessage'

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{labelText}</Label>
        {showVariablePicker && (
          <VariablePopover
            precedingNodeTypes={precedingNodeTypes}
            triggerVars={triggerVars}
            onInsert={(path) => onChange(insertAtEnd(value, `\${${path}}`))}
          />
        )}
      </div>
      {isMultiline ? (
        <Textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 min-h-24 font-sans text-sm"
          placeholder={paramPlaceholder(def)}
        />
      ) : (
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5"
          placeholder={paramPlaceholder(def)}
        />
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ArrayField({
  def,
  value,
  onChange,
  precedingNodeTypes,
  triggerVars,
}: {
  def: NodeParamDefinition
  value: any[]
  onChange: (value: any[]) => void
  precedingNodeTypes: string[]
  triggerVars?: Array<{ name?: string; value?: string }>
}) {
  const labelText = humanizeParamKey(def.key)
  const min = def.constraints?.min ?? 0
  const max = def.constraints?.max ?? 99
  const canAdd = value.length < max
  const canRemove = value.length > min

  const itemDefs = def.items ?? []

  const addRow = useCallback(() => {
    const blank = itemDefs.reduce<Record<string, any>>((acc, p) => {
      acc[p.key] = p.type === 'boolean' ? false : ''
      return acc
    }, {})
    // Auto-fill id with a stable key when present
    if (itemDefs.some((p) => p.key === 'id')) {
      blank.id = `opt_${Date.now()}_${value.length + 1}`
    }
    onChange([...value, blank])
  }, [itemDefs, onChange, value])

  const removeRow = (idx: number) => onChange(value.filter((_, i) => i !== idx))

  const setRowField = (idx: number, key: string, fieldValue: any) => {
    onChange(value.map((row, i) => (i === idx ? { ...row, [key]: fieldValue } : row)))
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{labelText}</Label>
        {canAdd && (
          <Button variant="outline" size="sm" onClick={addRow} className="h-7 text-xs">
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        )}
      </div>
      {value.length === 0 ? (
        <button
          onClick={addRow}
          className="mt-2 w-full rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground hover:bg-muted/50"
        >
          Add the first item
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          {value.map((row, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                {canRemove && (
                  <button
                    onClick={() => removeRow(idx)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {itemDefs
                  .filter((p) => p.key !== 'id') // hide the auto-generated id
                  .map((field) => (
                    <ParamField
                      key={field.key}
                      def={field}
                      value={row?.[field.key]}
                      onChange={(v) => setRowField(idx, field.key, v)}
                      precedingNodeTypes={precedingNodeTypes}
                      triggerVars={triggerVars}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">
        {min === max
          ? `Exactly ${min}`
          : max < 99
          ? `${min}–${max} item${max === 1 ? '' : 's'}`
          : `At least ${min}`}
      </p>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function humanizeParamKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (s) => s.toUpperCase())
}

function paramHint(def: NodeParamDefinition): string | null {
  if (def.key === 'message') return 'The text customers will see on WhatsApp.'
  if (def.key === 'header') return 'Optional title above the message.'
  if (def.key === 'footer') return 'Optional small text below.'
  if (def.key === 'intent') return 'Internal intent label — matches the AI triage output.'
  if (def.key === 'template_name') return 'Must match an approved WhatsApp template in your business.'
  if (def.key === 'prompt') return 'Optional message to send before pausing for the user reply.'
  return null
}

function paramPlaceholder(def: NodeParamDefinition): string | undefined {
  if (def.key === 'message') return 'Hi ${contact.name}, …'
  if (def.key === 'title') return 'Tap me'
  if (def.key === 'label') return 'Show details'
  if (def.key === 'header') return 'Welcome!'
  if (def.key === 'footer') return 'Reply STOP to opt out'
  return undefined
}

function insertAtEnd(current: any, token: string): string {
  const s = typeof current === 'string' ? current : ''
  if (!s) return token
  return s.endsWith(' ') ? `${s}${token}` : `${s} ${token}`
}
