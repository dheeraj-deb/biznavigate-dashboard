'use client'

import { useMemo, useState } from 'react'
import {
  Braces,
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Filter,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  UserMinus,
  UserPlus,
  Workflow,
  XCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorkflowNodes } from '@/hooks/use-workflow-nodes'
import { ScheduleConfig } from './schedule-config'
import { EventConfig } from './event-config'
import type { NodeDefinition, WizardNode } from './types'

interface StepTriggerProps {
  triggerNode: WizardNode | null
  /** Replace the entire trigger (type + params). */
  onSelectTrigger: (type: string, params?: Record<string, any>) => void
}

const TRIGGER_VISUALS: Record<string, { icon: typeof MessageSquare; tone: string }> = {
  'trigger.whatsapp': { icon: MessageSquare, tone: 'from-emerald-50 to-emerald-100 text-emerald-700' },
  'trigger.whatsapp.intent': { icon: Sparkles, tone: 'from-violet-50 to-violet-100 text-violet-700' },
  'trigger.schedule': { icon: CalendarClock, tone: 'from-sky-50 to-sky-100 text-sky-700' },
  'trigger.event.lead_status_changed': { icon: Workflow, tone: 'from-indigo-50 to-indigo-100 text-indigo-700' },
  'trigger.event.booking_created': { icon: UserPlus, tone: 'from-emerald-50 to-emerald-100 text-emerald-700' },
  'trigger.event.booking_cancelled': { icon: XCircle, tone: 'from-rose-50 to-rose-100 text-rose-700' },
  'trigger.event.payment_captured': { icon: CircleDollarSign, tone: 'from-amber-50 to-amber-100 text-amber-700' },
  'trigger.event.lead_inactive': { icon: UserMinus, tone: 'from-slate-50 to-slate-100 text-slate-700' },
}

// Categorize triggers for the grouped picker. Anything missing from the map
// (e.g. future trigger types) falls into 'other'.
const TRIGGER_GROUPS: Array<{ id: 'message' | 'schedule' | 'event'; label: string; description: string; types: string[] }> = [
  {
    id: 'message',
    label: 'On message',
    description: 'A customer sent you a WhatsApp message.',
    types: ['trigger.whatsapp', 'trigger.whatsapp.intent'],
  },
  {
    id: 'schedule',
    label: 'On schedule',
    description: 'Run at a specific time or interval, with no customer message.',
    types: ['trigger.schedule'],
  },
  {
    id: 'event',
    label: 'On event',
    description: "Run when something happens elsewhere — a booking, a payment, a status change.",
    types: [
      'trigger.event.lead_status_changed',
      'trigger.event.booking_created',
      'trigger.event.booking_cancelled',
      'trigger.event.payment_captured',
      'trigger.event.lead_inactive',
    ],
  },
]

const INTENT_OPTIONS = [
  { value: 'greeting', label: 'Greeting (hi, hello)', description: 'Customer says hi or starts a conversation' },
  { value: 'browse', label: 'Browse / what do you have', description: 'Customer wants to see products or services' },
  { value: 'booking', label: 'Booking / appointment', description: 'Customer wants to book or make an appointment' },
  { value: 'status', label: 'Status check', description: 'Customer asks about their existing booking or order' },
  { value: 'cancellation', label: 'Cancellation', description: 'Customer wants to cancel a booking or order' },
  { value: 'payment', label: 'Payment query', description: 'Customer asks about payments, invoices, refunds' },
  { value: 'faq', label: 'FAQ / general question', description: 'Customer asks about facilities, policies, or business info' },
  { value: 'support', label: 'Support request', description: 'Customer needs help with a problem' },
  { value: 'complaint', label: 'Complaint', description: 'Customer reports a bad experience' },
  { value: 'handoff', label: 'Wants a human', description: 'Customer explicitly asks to talk to someone' },
]

const FIELD_OPTIONS: Array<{ value: 'lead.status' | 'lead.tags' | 'lead.source' | 'message.text'; label: string }> = [
  { value: 'lead.status', label: 'Lead status' },
  { value: 'lead.tags', label: 'Lead tag' },
  { value: 'lead.source', label: 'Lead source' },
  { value: 'message.text', label: 'Message text' },
]

const OPERATOR_OPTIONS_BY_FIELD: Record<string, Array<{ value: string; label: string }>> = {
  'lead.status': [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'in', label: 'is one of' },
    { value: 'not_in', label: 'is none of' },
  ],
  'lead.tags': [
    { value: 'contains', label: 'has tag' },
    { value: 'not_contains', label: 'does not have tag' },
  ],
  'lead.source': [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'in', label: 'is one of' },
  ],
  'message.text': [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals', label: 'is exactly' },
  ],
}

const LEAD_STATUS_OPTIONS = ['new', 'active', 'qualified', 'booked', 'lost']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Sensible starting params for each trigger type so the user lands in a usable
 * config (rather than an empty object that the validator might later reject).
 */
function defaultParamsForTrigger(type: string): Record<string, any> {
  switch (type) {
    case 'trigger.schedule':
      return {
        schedule: { mode: 'daily', time: '09:00' },
        target: 'each_lead',
        audience: {},
      }
    case 'trigger.event.lead_status_changed':
      return { event: 'lead.status_changed' }
    case 'trigger.event.booking_created':
      return { event: 'booking.created' }
    case 'trigger.event.booking_cancelled':
      return { event: 'booking.cancelled' }
    case 'trigger.event.payment_captured':
      return { event: 'payment.captured' }
    case 'trigger.event.lead_inactive':
      return { event: 'lead.inactive', days: 7 }
    default:
      return {}
  }
}

/**
 * Fallback row when the backend adds a trigger type the wizard hasn't
 * categorized yet. Keeps the UI from silently dropping options.
 */
function UncategorizedTriggers({
  triggers,
  selectedType,
  onSelectTrigger,
}: {
  triggers: NodeDefinition[]
  selectedType: string | undefined
  onSelectTrigger: (type: string, params?: Record<string, any>) => void
}) {
  if (!triggers.length) return null
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Other
      </h4>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {triggers.map((trigger) => {
          const isSelected = selectedType === trigger.type
          return (
            <button
              key={trigger.type}
              onClick={() => onSelectTrigger(trigger.type, isSelected ? undefined : defaultParamsForTrigger(trigger.type))}
              className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-muted">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-sm font-semibold">{trigger.label}</h5>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{trigger.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function StepTrigger({ triggerNode, onSelectTrigger }: StepTriggerProps) {
  const { data: nodeDefsResult, isLoading } = useWorkflowNodes()

  const triggers = useMemo<NodeDefinition[]>(() => {
    const all = (nodeDefsResult as any)?.data?.nodes ?? (nodeDefsResult as any)?.nodes ?? []
    return all.filter((n: NodeDefinition) => n.category === 'trigger')
  }, [nodeDefsResult])

  const selectedType = triggerNode?.type
  const params = triggerNode?.params ?? {}

  // Helper to patch the trigger's params without losing type/intent.
  const patchParams = (patch: Record<string, any>) => {
    if (!selectedType) return
    onSelectTrigger(selectedType, { ...params, ...patch })
  }

  if (isLoading) {
    return (
      <div className="grid place-items-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">When should this automation run?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick what kicks off this flow. You can only have one trigger.
        </p>
      </div>

      <div className="space-y-5">
        {TRIGGER_GROUPS.map((group) => {
          // Resolve the actual node definitions present in this group; tolerate
          // backend additions that haven't been categorised yet by falling
          // through to a generic 'Other' section.
          const groupTriggers = triggers.filter((t) => group.types.includes(t.type))
          if (!groupTriggers.length) return null
          return (
            <div key={group.id}>
              <div className="mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h4>
                <p className="text-xs text-muted-foreground">{group.description}</p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {groupTriggers.map((trigger) => {
                  const visual = TRIGGER_VISUALS[trigger.type] ?? {
                    icon: MessageSquare,
                    tone: 'from-slate-50 to-slate-100 text-slate-700',
                  }
                  const Icon = visual.icon
                  const isSelected = selectedType === trigger.type
                  return (
                    <button
                      key={trigger.type}
                      onClick={() => onSelectTrigger(trigger.type, isSelected ? params : defaultParamsForTrigger(trigger.type))}
                      className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm'
                      }`}
                    >
                      <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br ${visual.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-sm font-semibold">{trigger.label}</h5>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{trigger.description}</p>
                      </div>
                      {isSelected && <span className="text-xs font-semibold text-primary">Selected</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {/* Anything not categorised — defensive fallback when backend adds a new trigger type */}
        <UncategorizedTriggers
          triggers={triggers.filter((t) => !TRIGGER_GROUPS.flatMap((g) => g.types).includes(t.type))}
          selectedType={selectedType}
          onSelectTrigger={onSelectTrigger}
        />
      </div>

      {/* Inline trigger-specific config: intent picker */}
      {selectedType === 'trigger.whatsapp.intent' && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <Label className="text-sm font-medium">Which intent?</Label>
          <p className="text-xs text-muted-foreground">
            The automation only runs when the AI classifies the customer&rsquo;s message as this intent.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTENT_OPTIONS.map((opt) => {
              const isPicked = params.intent === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => patchParams({ intent: opt.value })}
                  className={`rounded-md border p-3 text-left text-xs transition ${
                    isPicked ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="font-semibold text-foreground">{opt.label}</div>
                  <div className="mt-0.5 text-muted-foreground">{opt.description}</div>
                </button>
              )
            })}
          </div>
          <div className="pt-2">
            <Label className="text-xs font-medium text-muted-foreground">Or enter a custom intent</Label>
            <Input
              value={
                INTENT_OPTIONS.some((o) => o.value === params.intent) ? '' : (params.intent ?? '')
              }
              onChange={(e) => patchParams({ intent: e.target.value })}
              placeholder="e.g. complaint, custom_intent_name"
              className="mt-1.5"
            />
          </div>
        </div>
      )}

      {/* Schedule trigger config */}
      {selectedType === 'trigger.schedule' && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <ScheduleConfig params={params} onChange={patchParams} />
        </div>
      )}

      {/* Event trigger config — only renders for event types that need extra fields */}
      {selectedType?.startsWith('trigger.event.') && (
        <EventConfig triggerType={selectedType} params={params} onChange={patchParams} />
      )}

      {/* Advanced gating sections — only show once a trigger is picked */}
      {selectedType && (
        <div className="space-y-3">
          <CollapsibleSection
            icon={<Filter className="h-4 w-4" />}
            title="Filter conditions"
            summary={
              Array.isArray(params.conditions) && params.conditions.length > 0
                ? `${params.conditions.length} condition${params.conditions.length === 1 ? '' : 's'}`
                : 'Optional — only run if conditions match'
            }
            defaultOpen={Array.isArray(params.conditions) && params.conditions.length > 0}
          >
            <ConditionsEditor
              conditions={Array.isArray(params.conditions) ? params.conditions : []}
              onChange={(next) => patchParams({ conditions: next })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            icon={<Clock className="h-4 w-4" />}
            title="Business hours"
            summary={
              normalizeHours(params.business_hours)?.enabled
                ? 'Only fires inside configured hours'
                : 'Optional — fires any time of day by default'
            }
            defaultOpen={!!normalizeHours(params.business_hours)?.enabled}
          >
            <BusinessHoursEditor
              hours={normalizeHours(params.business_hours)}
              onChange={(next) => patchParams({ business_hours: next ? [next] : [] })}
            />
          </CollapsibleSection>

          <CollapsibleSection
            icon={<Braces className="h-4 w-4" />}
            title="Constants"
            summary={
              Array.isArray(params.vars) && params.vars.length > 0
                ? `${params.vars.length} value${params.vars.length === 1 ? '' : 's'} for downstream steps`
                : 'Optional — define values you can reference in steps as ${trigger.var.NAME}'
            }
            defaultOpen={Array.isArray(params.vars) && params.vars.length > 0}
          >
            <VarsEditor
              vars={Array.isArray(params.vars) ? params.vars : []}
              onChange={(next) => patchParams({ vars: next })}
            />
          </CollapsibleSection>
        </div>
      )}
    </div>
  )
}

// ─── Collapsible section ─────────────────────────────────────────────────────

function CollapsibleSection({
  icon,
  title,
  summary,
  defaultOpen,
  children,
}: {
  icon: React.ReactNode
  title: string
  summary: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 bg-card px-3 py-2.5 text-left hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {summary}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
        </span>
      </button>
      {open && <div className="border-t border-border bg-muted/20 p-3">{children}</div>}
    </div>
  )
}

// ─── Conditions editor ──────────────────────────────────────────────────────

function ConditionsEditor({
  conditions,
  onChange,
}: {
  conditions: any[]
  onChange: (next: any[]) => void
}) {
  const add = () => onChange([...conditions, { field: 'lead.status', operator: 'equals', value: '' }])
  const remove = (idx: number) => onChange(conditions.filter((_, i) => i !== idx))
  const update = (idx: number, patch: any) =>
    onChange(conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)))

  if (conditions.length === 0) {
    return (
      <button
        onClick={add}
        className="w-full rounded-md border border-dashed border-border bg-card px-3 py-4 text-center text-xs text-muted-foreground hover:bg-muted"
      >
        + Add the first condition
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {conditions.map((cond, idx) => {
        const operators = OPERATOR_OPTIONS_BY_FIELD[cond.field] ?? OPERATOR_OPTIONS_BY_FIELD['lead.status']
        return (
          <div key={idx} className="flex flex-wrap items-center gap-2 rounded-md bg-card p-2 ring-1 ring-border">
            <Select value={cond.field} onValueChange={(v) => update(idx, { field: v, operator: OPERATOR_OPTIONS_BY_FIELD[v]?.[0]?.value ?? 'equals' })}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cond.operator} onValueChange={(v) => update(idx, { operator: v })}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {cond.field === 'lead.status' ? (
              <Select value={cond.value || ''} onValueChange={(v) => update(idx, { value: v })}>
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="Pick a status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={cond.value ?? ''}
                onChange={(e) => update(idx, { value: e.target.value })}
                placeholder={
                  cond.field === 'lead.tags' ? 'tag name' :
                  cond.field === 'lead.source' ? 'website, public_booking_link, …' :
                  cond.field === 'message.text' ? 'keyword' : ''
                }
                className="h-8 flex-1 text-xs"
              />
            )}

            <button
              onClick={() => remove(idx)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
      <Button size="sm" variant="outline" onClick={add} className="h-7 text-xs">
        <Plus className="mr-1 h-3 w-3" />
        Add condition
      </Button>
      <p className="text-[11px] text-muted-foreground">All conditions must match (AND).</p>
    </div>
  )
}

// ─── Business hours editor ──────────────────────────────────────────────────

interface BusinessHoursValue {
  enabled: boolean
  timezone?: string
  ranges: Array<{ day: number; start: string; end: string }>
}

function normalizeHours(raw: any): BusinessHoursValue | null {
  // Stored as a one-element array on the wire; unwrap.
  const obj = Array.isArray(raw) ? raw[0] : raw
  if (!obj) return null
  return {
    enabled: !!obj.enabled,
    timezone: typeof obj.timezone === 'string' ? obj.timezone : undefined,
    ranges: Array.isArray(obj.ranges) ? obj.ranges : [],
  }
}

function BusinessHoursEditor({
  hours,
  onChange,
}: {
  hours: BusinessHoursValue | null
  onChange: (next: BusinessHoursValue | null) => void
}) {
  const enabled = !!hours?.enabled
  const ranges = hours?.ranges ?? []

  const setEnabled = (on: boolean) => {
    if (on) {
      // Default: weekdays 09:00–18:00
      onChange({
        enabled: true,
        timezone: hours?.timezone,
        ranges: ranges.length
          ? ranges
          : [1, 2, 3, 4, 5].map((day) => ({ day, start: '09:00', end: '18:00' })),
      })
    } else {
      onChange({ enabled: false, timezone: hours?.timezone, ranges })
    }
  }

  const addRange = () =>
    onChange({
      enabled: true,
      timezone: hours?.timezone,
      ranges: [...ranges, { day: 1, start: '09:00', end: '18:00' }],
    })

  const updateRange = (idx: number, patch: Partial<{ day: number; start: string; end: string }>) =>
    onChange({
      enabled: true,
      timezone: hours?.timezone,
      ranges: ranges.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    })

  const removeRange = (idx: number) =>
    onChange({
      enabled: ranges.length > 1,
      timezone: hours?.timezone,
      ranges: ranges.filter((_, i) => i !== idx),
    })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md bg-card p-2 ring-1 ring-border">
        <div>
          <Label className="text-sm font-medium">Only run during business hours</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Inbound messages outside these hours won&rsquo;t trigger this automation.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            {ranges.map((range, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-2 rounded-md bg-card p-2 ring-1 ring-border"
              >
                <Select
                  value={String(range.day)}
                  onValueChange={(v) => updateRange(idx, { day: Number(v) })}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((label, i) => (
                      <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={range.start}
                  onChange={(e) => updateRange(idx, { start: e.target.value })}
                  className="h-8 w-28 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={range.end}
                  onChange={(e) => updateRange(idx, { end: e.target.value })}
                  className="h-8 w-28 text-xs"
                />
                <button
                  onClick={() => removeRange(idx)}
                  className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={addRange} className="h-7 text-xs">
            <Plus className="mr-1 h-3 w-3" />
            Add time range
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Times use your business&rsquo;s timezone from settings.
          </p>
        </>
      )}
    </div>
  )
}

// ─── Vars editor ─────────────────────────────────────────────────────────────

function VarsEditor({
  vars,
  onChange,
}: {
  vars: any[]
  onChange: (next: any[]) => void
}) {
  const add = () => onChange([...vars, { name: '', value: '' }])
  const update = (idx: number, patch: any) =>
    onChange(vars.map((v, i) => (i === idx ? { ...v, ...patch } : v)))
  const remove = (idx: number) => onChange(vars.filter((_, i) => i !== idx))

  if (vars.length === 0) {
    return (
      <button
        onClick={add}
        className="w-full rounded-md border border-dashed border-border bg-card px-3 py-4 text-center text-xs text-muted-foreground hover:bg-muted"
      >
        + Add the first constant
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {vars.map((v, idx) => (
        <div key={idx} className="flex items-center gap-2 rounded-md bg-card p-2 ring-1 ring-border">
          <Input
            value={v.name ?? ''}
            onChange={(e) => update(idx, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })}
            placeholder="name (e.g. promo_code)"
            className="h-8 flex-1 text-xs font-mono"
          />
          <span className="text-xs text-muted-foreground">=</span>
          <Input
            value={v.value ?? ''}
            onChange={(e) => update(idx, { value: e.target.value })}
            placeholder="value"
            className="h-8 flex-1 text-xs"
          />
          <button
            onClick={() => remove(idx)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={add} className="h-7 text-xs">
        <Plus className="mr-1 h-3 w-3" />
        Add constant
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Reference these in steps as <code className="rounded bg-muted px-1 py-0.5 font-mono">${'{'}trigger.var.NAME{'}'}</code>.
      </p>
    </div>
  )
}
