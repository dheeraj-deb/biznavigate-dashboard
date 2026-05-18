'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LEAD_STATUS_OPTIONS = ['new', 'active', 'qualified', 'booked', 'lost']

interface EventConfigProps {
  triggerType: string
  params: Record<string, any>
  onChange: (patch: Record<string, any>) => void
}

/**
 * Renders extra config for event triggers that need user-supplied filters.
 *   - trigger.event.lead_status_changed: optional from_status / to_status allowlists
 *   - trigger.event.lead_inactive: threshold in days (required)
 *
 * Booking/payment triggers have no extra config, so this returns null for them.
 */
export function EventConfig({ triggerType, params, onChange }: EventConfigProps) {
  if (triggerType === 'trigger.event.lead_status_changed') {
    const event = params.event ?? 'lead.status_changed'
    const fromStatus: string[] = Array.isArray(params.from_status) ? params.from_status : []
    const toStatus: string[] = Array.isArray(params.to_status) ? params.to_status : []
    return (
      <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
        <div>
          <Label className="text-sm font-medium">Only fire when status changes…</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Leave both empty to fire on any status change.
          </p>
        </div>
        <StatusChips
          label="From any of"
          value={fromStatus}
          onChange={(v) => onChange({ event, from_status: v.length ? v : undefined })}
        />
        <StatusChips
          label="To any of"
          value={toStatus}
          onChange={(v) => onChange({ event, to_status: v.length ? v : undefined })}
        />
      </div>
    )
  }

  if (triggerType === 'trigger.event.lead_inactive') {
    const days = Number(params.days ?? 7)
    return (
      <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
        <Label className="text-sm font-medium">Inactive for how long?</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => onChange({ event: 'lead.inactive', days: Number(e.target.value) || 1 })}
            className="h-9 w-24 text-sm"
          />
          <span className="text-sm text-muted-foreground">days since last activity</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The inactive scanner runs hourly. A lead only fires this trigger once per inactive period
          — they have to come back and go quiet again to fire it a second time.
        </p>
      </div>
    )
  }

  // booking_created / booking_cancelled / payment_captured — no extra config
  return null
}

function StatusChips({
  label,
  value,
  onChange,
}: {
  label: string
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
        {LEAD_STATUS_OPTIONS.map((opt) => {
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
