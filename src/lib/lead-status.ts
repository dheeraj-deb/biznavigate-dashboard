/**
 * Single source of truth for status/stage presentation.
 *
 * Backend canonical slugs (matches backend src/.../lead-status.ts):
 *   new | contacted | active | qualified | quoted | booked | won | lost
 *
 * Some legacy dashboard code used different slugs ('interested', 'converted').
 * We map those to canonical so older API payloads still render correctly.
 */

export type LeadStatusSlug =
  | 'new'
  | 'contacted'
  | 'active'
  | 'qualified'
  | 'quoted'
  | 'booked'
  | 'won'
  | 'lost'

export interface StatusMeta {
  label: string
  /** Tailwind classes for badge */
  badgeClass: string
  /** Hex color for accents (left border, dots) */
  color: string
}

const LEGACY_ALIAS: Record<string, LeadStatusSlug> = {
  interested: 'qualified',
  converted: 'won',
}

const DEFAULT_META: Record<LeadStatusSlug, StatusMeta> = {
  new:       { label: 'New',       badgeClass: 'bg-gray-100 text-gray-700 border border-gray-300',     color: '#94a3b8' },
  contacted: { label: 'Contacted', badgeClass: 'bg-blue-100 text-blue-700 border border-blue-300',     color: '#60a5fa' },
  active:    { label: 'Active',    badgeClass: 'bg-sky-100 text-sky-700 border border-sky-300',         color: '#0ea5e9' },
  qualified: { label: 'Qualified', badgeClass: 'bg-purple-100 text-purple-700 border border-purple-300', color: '#a78bfa' },
  quoted:    { label: 'Quoted',    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-300',   color: '#f59e0b' },
  booked:    { label: 'Booked',    badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-300', color: '#10b981' },
  won:       { label: 'Won',       badgeClass: 'bg-green-100 text-green-700 border border-green-300',   color: '#059669' },
  lost:      { label: 'Lost',      badgeClass: 'bg-red-100 text-red-700 border border-red-300',         color: '#ef4444' },
}

function canonical(slug: string): LeadStatusSlug | null {
  const s = (slug || '').toLowerCase()
  if (s in DEFAULT_META) return s as LeadStatusSlug
  if (s in LEGACY_ALIAS) return LEGACY_ALIAS[s]
  return null
}

/** Resolve presentation for a slug, falling back to a sensible default. */
export function getStatusMeta(slug: string): StatusMeta {
  const c = canonical(slug)
  if (c) return DEFAULT_META[c]
  return { label: slug || 'Unknown', badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300', color: '#94a3b8' }
}

export const getStatusLabel = (slug: string) => getStatusMeta(slug).label
export const getStatusStyle = (slug: string) => getStatusMeta(slug).badgeClass
export const getStatusColor = (slug: string) => getStatusMeta(slug).color

/** Default status flow shown in dropdowns. */
export const STATUS_FLOW: LeadStatusSlug[] = ['new', 'contacted', 'qualified', 'quoted', 'booked', 'won', 'lost']

/**
 * Pipeline-aware variants. Once we have a pipeline loaded, the caller can
 * pass its stages so the UI renders the business's actual stage names/colors
 * instead of the canonical defaults.
 */
export interface PipelineStageLite {
  stage_id: string
  name: string
  slug: string
  color: string | null
  is_won: boolean
  is_lost: boolean
}

export function makeStatusMetaFromPipeline(stages: PipelineStageLite[]) {
  const map = new Map<string, StatusMeta>()
  for (const s of stages) {
    const fallback = getStatusMeta(s.slug)
    map.set(s.slug, {
      label: s.name || fallback.label,
      color: s.color || fallback.color,
      badgeClass: fallback.badgeClass,
    })
  }
  return (slug: string): StatusMeta => map.get(slug) ?? getStatusMeta(slug)
}
