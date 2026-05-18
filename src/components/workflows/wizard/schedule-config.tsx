'use client'

import { Calendar, Clock, RotateCw, CalendarClock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const LEAD_STATUS_OPTIONS = ['new', 'active', 'qualified', 'booked', 'lost']

const MODE_OPTIONS: Array<{ value: ScheduleMode; label: string; icon: any; description: string }> = [
  { value: 'daily', label: 'Daily', icon: Clock, description: 'Same time every day' },
  { value: 'weekly', label: 'Weekly', icon: Calendar, description: 'Pick days of the week' },
  { value: 'interval', label: 'Every N minutes', icon: RotateCw, description: 'Repeat on a short interval' },
  { value: 'one_time', label: 'Just once', icon: CalendarClock, description: 'Fire at a specific date/time' },
]

type ScheduleMode = 'daily' | 'weekly' | 'interval' | 'one_time'

interface ScheduleConfigProps {
  params: Record<string, any>
  /** Patch the trigger params (merged on top of existing). */
  onChange: (patch: Record<string, any>) => void
}

/**
 * Renders inside Step 2 when the user picks the 'trigger.schedule' card.
 * Owns the schedule mode picker, target picker (each lead vs business-only),
 * and the audience filter for per-lead fan-out.
 *
 * Wire shape it produces:
 *   schedule: { mode, time?, days?, every_minutes?, run_at? }
 *   target: 'each_lead' | 'business_only'
 *   audience?: { status?, has_tags?, source?, max_leads? }
 */
export function ScheduleConfig({ params, onChange }: ScheduleConfigProps) {
  const schedule = (params.schedule ?? {}) as { mode?: ScheduleMode; time?: string; days?: number[]; every_minutes?: number; run_at?: string }
  const target: 'each_lead' | 'business_only' = params.target ?? 'each_lead'
  const audience = (params.audience ?? {}) as { status?: string[]; has_tags?: string[]; source?: string[]; max_leads?: number }

  const setMode = (mode: ScheduleMode) => {
    const defaults: Record<ScheduleMode, any> = {
      daily: { mode: 'daily', time: schedule.time ?? '09:00' },
      weekly: { mode: 'weekly', time: schedule.time ?? '09:00', days: schedule.days?.length ? schedule.days : [1] },
      interval: { mode: 'interval', every_minutes: schedule.every_minutes ?? 60 },
      one_time: { mode: 'one_time', run_at: schedule.run_at ?? defaultRunAt() },
    }
    onChange({ schedule: defaults[mode] })
  }

  const patchSchedule = (patch: Record<string, any>) => onChange({ schedule: { ...schedule, ...patch } })
  const patchAudience = (patch: Record<string, any>) => onChange({ audience: { ...audience, ...patch } })

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium">When should it run?</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {MODE_OPTIONS.map((m) => {
            const Icon = m.icon
            const isSelected = schedule.mode === m.value
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex items-start gap-2.5 rounded-md border p-3 text-left transition ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mode-specific config */}
      {schedule.mode === 'daily' && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">At</Label>
          <Input
            type="time"
            value={schedule.time ?? '09:00'}
            onChange={(e) => patchSchedule({ time: e.target.value })}
            className="h-9 w-32 text-sm"
          />
          <span className="text-xs text-muted-foreground">in your business timezone</span>
        </div>
      )}

      {schedule.mode === 'weekly' && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">On these days</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((label, i) => {
                const picked = (schedule.days ?? []).includes(i)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const next = picked
                        ? (schedule.days ?? []).filter((d) => d !== i)
                        : [...(schedule.days ?? []), i].sort()
                      patchSchedule({ days: next })
                    }}
                    className={`h-8 w-10 rounded-md text-xs font-semibold transition ${
                      picked
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">At</Label>
            <Input
              type="time"
              value={schedule.time ?? '09:00'}
              onChange={(e) => patchSchedule({ time: e.target.value })}
              className="h-9 w-32 text-sm"
            />
          </div>
        </div>
      )}

      {schedule.mode === 'interval' && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Every</Label>
          <Input
            type="number"
            min={5}
            value={schedule.every_minutes ?? 60}
            onChange={(e) => patchSchedule({ every_minutes: Number(e.target.value) })}
            className="h-9 w-24 text-sm"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
          <span className="text-xs text-muted-foreground">(minimum 5)</span>
        </div>
      )}

      {schedule.mode === 'one_time' && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">At</Label>
          <Input
            type="datetime-local"
            value={schedule.run_at ?? defaultRunAt()}
            onChange={(e) => patchSchedule({ run_at: e.target.value })}
            className="h-9 text-sm"
          />
          <span className="text-xs text-muted-foreground">deactivates itself after firing</span>
        </div>
      )}

      {/* Target picker */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium">Who does it run for?</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => onChange({ target: 'each_lead' })}
            className={`rounded-md border p-3 text-left transition ${
              target === 'each_lead'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <div className="text-sm font-semibold">Each matching lead</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Fan out — one workflow run per lead that matches the filter below.
            </div>
          </button>
          <button
            onClick={() => onChange({ target: 'business_only' })}
            className={`rounded-md border p-3 text-left transition ${
              target === 'business_only'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <div className="text-sm font-semibold">Just the business</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Single run, no lead context. Use for admin-style flows.
            </div>
          </button>
        </div>
      </div>

      {/* Audience filter (only when fanning out) */}
      {target === 'each_lead' && (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Audience</Label>
            <span className="text-xs text-muted-foreground">Leave blank to include all leads</span>
          </div>
          <MultiSelectChips
            label="Lead status"
            options={LEAD_STATUS_OPTIONS}
            value={audience.status ?? []}
            onChange={(v) => patchAudience({ status: v.length ? v : undefined })}
          />
          <TagListInput
            label="Has all of these tags"
            value={audience.has_tags ?? []}
            onChange={(v) => patchAudience({ has_tags: v.length ? v : undefined })}
            placeholder="Enter tag, press Enter"
          />
          <TagListInput
            label="Lead source"
            value={audience.source ?? []}
            onChange={(v) => patchAudience({ source: v.length ? v : undefined })}
            placeholder="e.g. website, public_booking_link"
          />
          <div className="flex items-center gap-3">
            <Label className="text-sm">Max leads per fire</Label>
            <Input
              type="number"
              min={1}
              max={5000}
              value={audience.max_leads ?? ''}
              onChange={(e) =>
                patchAudience({ max_leads: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="500"
              className="h-9 w-28 text-sm"
            />
            <span className="text-xs text-muted-foreground">defaults to 500</span>
          </div>
        </div>
      )}

      <SafetyNote target={target} schedule={schedule} />
    </div>
  )
}

function SafetyNote({
  target,
  schedule,
}: {
  target: 'each_lead' | 'business_only'
  schedule: { mode?: string; every_minutes?: number }
}) {
  if (target !== 'each_lead' || schedule.mode !== 'interval') return null
  const minutes = schedule.every_minutes ?? 60
  if (minutes >= 60) return null
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <strong>Heads up:</strong> running per-lead every {minutes} minutes can hit your WhatsApp rate limits quickly. Consider widening the interval or narrowing the audience.
    </div>
  )
}

// ─── Small primitives ───────────────────────────────────────────────────────

function MultiSelectChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const picked = value.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`h-7 rounded-full px-3 text-xs font-medium transition ${
                picked
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TagListInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-card p-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="text-muted-foreground hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-32 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              const raw = (e.currentTarget.value ?? '').trim().replace(/,/g, '')
              if (raw && !value.includes(raw)) onChange([...value, raw])
              e.currentTarget.value = ''
            }
          }}
          onBlur={(e) => {
            const raw = (e.currentTarget.value ?? '').trim()
            if (raw && !value.includes(raw)) {
              onChange([...value, raw])
              e.currentTarget.value = ''
            }
          }}
        />
      </div>
    </div>
  )
}

function defaultRunAt(): string {
  // Default to tomorrow 09:00 in the browser's locale. ISO-ish without seconds —
  // matches the `datetime-local` input format.
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  d.setHours(9, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
