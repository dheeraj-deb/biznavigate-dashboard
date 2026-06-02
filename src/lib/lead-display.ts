export interface LeadInterestContext {
  item_name?: unknown
  item_names?: unknown
  property_name?: unknown
  property_names?: unknown
  room_preference?: unknown
  room_preferences?: unknown
  properties?: unknown
  selected_properties?: unknown
  interested_properties?: unknown
  items?: unknown
  requested_items?: unknown
  [key: string]: unknown
}

const COLLECTION_KEYS = [
  'properties',
  'selected_properties',
  'interested_properties',
  'property_names',
  'items',
  'requested_items',
  'item_names',
  'room_preferences',
] as const

const NAME_KEYS = [
  'property_name',
  'item_name',
  'room_preference',
  'name',
  'title',
] as const

function addText(values: string[], value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return
  const text = String(value).trim()
  if (text) values.push(text)
}

function addFromValue(values: string[], value: unknown) {
  if (Array.isArray(value)) {
    value.forEach((item) => addFromValue(values, item))
    return
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of NAME_KEYS) {
      if (record[key] != null) {
        addFromValue(values, record[key])
        return
      }
    }
    return
  }

  addText(values, value)
}

export function getLeadInterestItems(context?: LeadInterestContext | null) {
  if (!context) return []

  const values: string[] = []

  addFromValue(values, context.item_name)
  addFromValue(values, context.property_name)
  addFromValue(values, context.room_preference)

  for (const key of COLLECTION_KEYS) {
    addFromValue(values, context[key])
  }

  const seen = new Set<string>()
  return values.filter((value) => {
    const key = value.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function formatLeadInterestSummary(items: string[], maxVisible = 2) {
  if (items.length === 0) return ''
  const visible = items.slice(0, maxVisible).join(', ')
  const extra = items.length - maxVisible
  return extra > 0 ? `${visible} +${extra} more` : visible
}

export type LeadStage = 'new' | 'conversation' | 'booked' | 'followup' | 'lost'

const IN_CONVERSATION = new Set(['contacted', 'active', 'qualified', 'quoted', 'interested'])
const BOOKED = new Set(['booked', 'won', 'converted', 'confirmed'])
const LOST = new Set(['lost', 'cancelled', 'canceled', 'settled'])

export function getLeadStage(lead: {
  status?: string
  lead_quality?: string
  followup_at?: string
  follow_up_date?: string
}): LeadStage {
  const status = (lead.status ?? 'new').toLowerCase()
  const quality = (lead.lead_quality ?? '').toLowerCase()
  if (BOOKED.has(status)) return 'booked'
  if (LOST.has(status)) return 'lost'
  if (lead.followup_at || lead.follow_up_date || quality === 'warm') return 'followup'
  if (IN_CONVERSATION.has(status)) return 'conversation'
  return 'new'
}

export function getLeadStatusLabel(lead: {
  status?: string
  lead_quality?: string
  followup_at?: string
  follow_up_date?: string
}) {
  const stage = getLeadStage(lead)
  if (stage === 'booked') return 'Booked'
  if (stage === 'lost') return 'Closed'
  if (stage === 'followup') return 'Follow up'
  if (stage === 'conversation') return 'Talking'
  return 'New'
}
