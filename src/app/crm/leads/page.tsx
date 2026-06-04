'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCurrentBusiness } from '@/hooks/use-current-business'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Globe,
  Link2,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

type LeadTab = 'all' | 'new' | 'conversation' | 'booked' | 'followup' | 'lost'

interface LeadContext {
  check_in?: string
  check_out?: string
  requested_date?: string
  guest_count?: number | string
  guests?: number | string
  item_name?: string
  property_name?: string
  room_preference?: string
  booking_id?: string
  [key: string]: unknown
}

interface Lead {
  lead_id: string
  name?: string
  phone?: string
  channel?: string
  source?: string
  status?: string
  lead_type?: string
  qualification_score?: number
  lead_quality?: string
  quoted_amount?: number | string
  converted_value?: number | string
  tags?: string[]
  context?: LeadContext
  conversation_id?: string
  followup_at?: string
  follow_up_date?: string
  updated_at?: string
  created_at?: string
}

interface LeadStats {
  total_leads?: number
  converted_leads?: number
  by_status?: Array<{ status: string; count: number }>
}

interface ResortWorklist {
  booking_link_sent?: any[]
  demand_missed?: any[]
  upcoming_bookings?: any[]
  property_options?: Array<{ item_id: string; name: string }>
  counts?: {
    booking_link_sent?: number
    demand_missed?: number
    upcoming_bookings?: number
  }
}

interface ReminderReadiness {
  ready?: any[]
  stopped?: any[]
  missing_details?: any[]
  counts?: {
    ready?: number
    stopped?: number
    missing_details?: number
    total?: number
  }
  checked_at?: string
}

const TABS: Array<{ key: LeadTab; label: string; help: string }> = [
  { key: 'all', label: 'All', help: 'Every guest enquiry' },
  { key: 'new', label: 'New Enquiries', help: 'Fresh messages to check' },
  { key: 'conversation', label: 'In Conversation', help: 'Guests you are talking to' },
  { key: 'booked', label: 'Booked', help: 'Confirmed or won enquiries' },
  { key: 'followup', label: 'Follow Up', help: 'Warm leads or reminders' },
  { key: 'lost', label: 'Lost / Cancelled', help: 'Closed without booking' },
]

const IN_CONVERSATION = new Set(['contacted', 'active', 'qualified', 'quoted', 'interested'])
const BOOKED = new Set(['booked', 'won', 'converted'])
const LOST = new Set(['lost', 'cancelled', 'canceled'])

function unwrap(value: any) {
  return value?.data?.data ?? value?.data ?? value
}

function getLeadList(value: any): { leads: Lead[]; total: number } {
  const payload = unwrap(value)
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.leads)
        ? payload.leads
        : []

  return {
    leads: raw.map(normalizeLead).filter((lead: Lead) => lead.lead_id),
    total: payload?.meta?.total ?? payload?.total ?? raw.length,
  }
}

function normalizeLead(raw: any): Lead {
  const context = raw.context ?? raw.extracted_entities ?? {}
  const name = raw.name
    ?? [raw.first_name, raw.last_name].filter(Boolean).join(' ')
    ?? raw.customer_name

  return {
    lead_id: raw.lead_id ?? raw.id ?? '',
    name: name || undefined,
    phone: raw.phone ?? raw.customer_phone ?? '',
    channel: raw.channel ?? raw.source ?? 'whatsapp',
    source: raw.source ?? raw.channel ?? 'whatsapp',
    status: raw.status ?? 'new',
    lead_type: raw.lead_type ?? raw.intent_type ?? undefined,
    qualification_score: raw.qualification_score,
    lead_quality: raw.lead_quality ?? raw.category,
    quoted_amount: raw.quoted_amount,
    converted_value: raw.converted_value,
    tags: raw.tags ?? [],
    context,
    conversation_id: raw.conversation_id ?? context.conversation_id,
    followup_at: raw.followup_at ?? raw.follow_up_date,
    follow_up_date: raw.follow_up_date,
    updated_at: raw.updated_at ?? raw.last_message_at ?? raw.created_at,
    created_at: raw.created_at,
  }
}

function getDisplayName(lead: Lead) {
  return lead.name?.trim() || lead.phone || 'New guest'
}

function getGuestCount(context?: LeadContext) {
  return context?.guest_count ?? context?.guests
}

function getItemName(context?: LeadContext) {
  return context?.item_name ?? context?.property_name ?? context?.room_preference
}

function hasBookingLinkContext(context?: LeadContext) {
  return Boolean((context?.check_in || context?.requested_date) && context?.check_out && getItemName(context))
}

function leadMatchesProperty(lead: Lead, propertyName: string) {
  if (!propertyName) return true
  const expected = propertyName.toLowerCase()
  const context = lead.context ?? {}
  return [context.item_name, context.property_name, context.room_preference]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(expected))
}

function leadMatchesDate(lead: Lead, date: string) {
  if (!date) return true
  const context = lead.context ?? {}
  return [context.check_in, context.requested_date].some((value) => String(value ?? '') === date)
}

function formatDate(date?: string) {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function timeAgo(date?: string) {
  if (!date) return 'Recently'
  const diff = Date.now() - new Date(date).getTime()
  if (Number.isNaN(diff)) return 'Recently'
  const mins = Math.max(0, Math.floor(diff / 60000))
  if (mins < 60) return `${mins || 1}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function simpleStatus(lead: Lead) {
  const status = (lead.status ?? 'new').toLowerCase()
  if (BOOKED.has(status)) return 'Booked'
  if (LOST.has(status)) return 'Lost'
  if (lead.followup_at || lead.follow_up_date) return 'Follow up'
  if (IN_CONVERSATION.has(status)) return 'Talking'
  return 'New'
}

function tabForLead(lead: Lead): LeadTab {
  const status = (lead.status ?? 'new').toLowerCase()
  const quality = (lead.lead_quality ?? '').toLowerCase()
  if (BOOKED.has(status)) return 'booked'
  if (LOST.has(status)) return 'lost'
  if (IN_CONVERSATION.has(status)) return 'conversation'
  if (lead.followup_at || lead.follow_up_date || quality === 'warm') return 'followup'
  return 'new'
}

function sourceLabel(lead: Lead) {
  const raw = (lead.channel ?? lead.source ?? '').replace(/_/g, ' ').trim()
  if (!raw) return 'Website'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function sourceClass(lead: Lead) {
  const source = (lead.channel ?? lead.source ?? '').toLowerCase()
  if (source.includes('whatsapp')) return 'bg-green-50 text-green-700 border-green-200'
  if (source.includes('instagram')) return 'bg-pink-50 text-pink-700 border-pink-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

function dedupeLeads(leads: Lead[]) {
  const seen = new Set<string>()
  return leads.filter((lead) => {
    const phone = (lead.phone ?? '').replace(/\D/g, '')
    const booking = String(lead.context?.booking_id ?? '')
    const key = phone && booking ? `${phone}:${booking}` : lead.lead_id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter()
  const context = lead.context ?? {}
  const guestCount = getGuestCount(context)
  const itemName = getItemName(context)
  const checkIn = context.check_in ?? context.requested_date
  const checkOut = context.check_out
  const isBooked = tabForLead(lead) === 'booked'

  return (
    <Card
      className="p-4 sm:p-5 border-slate-200 hover:border-[#0066FF]/40 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => router.push(`/crm/leads/${lead.lead_id}`)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-950 truncate">{getDisplayName(lead)}</h3>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sourceClass(lead)}`}>
              {sourceLabel(lead)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {simpleStatus(lead)}
            </span>
            {!isBooked && hasBookingLinkContext(context) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                <Link2 className="h-3 w-3" />
                Link sent
              </span>
            )}
          </div>

          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <span className="flex items-center gap-2 min-w-0">
              <Phone className="h-4 w-4 text-slate-400" />
              <span className="truncate">{lead.phone || 'No phone yet'}</span>
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              {timeAgo(lead.updated_at ?? lead.created_at)}
            </span>
            {(checkIn || checkOut) && (
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {formatDate(String(checkIn))}
                {checkOut ? ` to ${formatDate(String(checkOut))}` : ''}
              </span>
            )}
            {guestCount && (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                {String(guestCount)} guest{String(guestCount) === '1' ? '' : 's'}
              </span>
            )}
          </div>

          {itemName && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-blue-100 bg-[#F7FAFF] px-3 py-2">
              <Building2 className="h-4 w-4 shrink-0 text-[#0066FF]" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Interested in</p>
                <p className="truncate text-sm font-bold text-slate-950">{String(itemName)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2 sm:flex-col">
          {(lead.conversation_id || lead.phone) && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={(event) => {
                event.stopPropagation()
                router.push(
                  lead.conversation_id
                    ? `/crm/inbox?conversation=${lead.conversation_id}`
                    : `/crm/inbox?phone=${encodeURIComponent(lead.phone ?? '')}`,
                )
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Open chat
            </Button>
          )}
          {isBooked && (
            <Button
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={(event) => {
                event.stopPropagation()
                router.push(`/crm/leads/${lead.lead_id}`)
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              View booking
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function LeadsPage() {
  const router = useRouter()
  const { businessType } = useCurrentBusiness()
  const [activeTab, setActiveTab] = useState<LeadTab>('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [worklist, setWorklist] = useState<ResortWorklist | null>(null)
  const [reminderReadiness, setReminderReadiness] = useState<ReminderReadiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (businessType === 'products' || businessType === 'retail') {
      router.replace('/seller-os/leads')
    }
  }, [businessType, router])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  useEffect(() => {
    apiClient.get('/leads/stats/overview')
      .then((res) => setStats(unwrap(res) as LeadStats))
      .catch(() => {})
  }, [])

  useEffect(() => {
    apiClient.get('/leads/dashboard/resort-worklist', { params: { days: 14 } })
      .then((res) => {
        const raw = unwrap(res)
        setWorklist((raw?.data ?? raw) as ResortWorklist)
      })
      .catch(() => {})

    apiClient.get('/leads/dashboard/resort-reminders', { params: { days: 14 } })
      .then((res) => {
        const raw = unwrap(res)
        setReminderReadiness((raw?.data ?? raw) as ReminderReadiness)
      })
      .catch(() => {})
  }, [])

  const fetchLeads = useCallback(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page: 1, limit: 100 }
    if (debouncedSearch.trim()) params.q = debouncedSearch.trim()

    apiClient.get('/leads', { params })
      .then((res) => {
        const next = getLeadList(res)
        setLeads(dedupeLeads(next.leads))
        setTotal(next.total)
      })
      .catch(() => toast.error('Could not load enquiries'))
      .finally(() => setLoading(false))
  }, [debouncedSearch])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const counts = useMemo(() => {
    const result: Record<LeadTab, number> = {
      all: leads.length,
      new: 0,
      conversation: 0,
      booked: 0,
      followup: 0,
      lost: 0,
    }
    leads.forEach((lead) => {
      result[tabForLead(lead)] += 1
    })
    return result
  }, [leads])

  const visibleLeads = useMemo(
    () => {
      const tabbed = activeTab === 'all' ? leads : leads.filter((lead) => tabForLead(lead) === activeTab)
      return tabbed.filter((lead) => leadMatchesProperty(lead, propertyFilter) && leadMatchesDate(lead, dateFilter))
    },
    [activeTab, dateFilter, leads, propertyFilter],
  )

  const resortCounts = worklist?.counts ?? {}
  const reminderCounts = reminderReadiness?.counts ?? {}
  const propertyOptions = worklist?.property_options ?? []
  const hasFilters = Boolean(propertyFilter || dateFilter)

  if (businessType === 'products' || businessType === 'retail') {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-5 pb-12">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[#F7FAFF] px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#0066FF] text-white shadow-sm">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#0066FF]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Guest pipeline
                  </div>
                  <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Guest Enquiries</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    WhatsApp, website, and booking enquiries grouped into simple work stages.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm sm:flex">
                <div className="min-w-[112px] rounded-md border border-blue-100 bg-white px-4 py-3 shadow-sm">
                  <span className="block text-xs font-medium text-slate-500">Total enquiries</span>
                  <strong className="mt-1 block text-xl text-slate-950">{stats?.total_leads ?? total}</strong>
                </div>
                <div className="min-w-[112px] rounded-md border border-green-100 bg-white px-4 py-3 shadow-sm">
                  <span className="block text-xs font-medium text-slate-500">Booked</span>
                  <strong className="mt-1 block text-xl text-green-700">{stats?.converted_leads ?? counts.booked}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guest name or phone"
                className="h-11 border-slate-200 bg-slate-50 pl-10 focus-visible:bg-white"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left shadow-sm transition-colors hover:bg-amber-100"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-amber-700">
                <Link2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Booking links sent</p>
                <p className="mt-1 text-2xl font-bold text-amber-950">{resortCounts.booking_link_sent ?? 0}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-amber-800">Guests who checked dates but have not booked yet.</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left shadow-sm transition-colors hover:bg-blue-100"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-blue-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-blue-900">Safe reminders</p>
                <p className="mt-1 text-2xl font-bold text-blue-950">{reminderCounts.ready ?? 0}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-blue-800">
              Checked with live occupancy before sending.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-left shadow-sm transition-colors hover:bg-rose-100"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-rose-700">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-rose-900">No rooms available</p>
                <p className="mt-1 text-2xl font-bold text-rose-950">{resortCounts.demand_missed ?? 0}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-rose-800">Guests asked for dates that were already full.</p>
            {(reminderCounts.stopped ?? 0) > 0 && (
              <p className="mt-2 rounded-md bg-white/70 px-2 py-1 text-xs font-semibold text-rose-900">
                {reminderCounts.stopped} reminder{reminderCounts.stopped === 1 ? '' : 's'} stopped after occupancy check
              </p>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('booked')}
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-left shadow-sm transition-colors hover:bg-green-100"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-green-700">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-green-900">Upcoming stays</p>
                <p className="mt-1 text-2xl font-bold text-green-950">{resortCounts.upcoming_bookings ?? 0}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-green-800">Bookings with check-in coming soon.</p>
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Property</span>
              <select
                value={propertyFilter}
                onChange={(event) => setPropertyFilter(event.target.value)}
                className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-[#0066FF] focus:bg-white"
              >
                <option value="">All properties</option>
                {propertyOptions.map((property) => (
                  <option key={property.item_id} value={property.name}>{property.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Check-in date</span>
              <Input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-11 border-slate-200 bg-slate-50 focus-visible:bg-white"
              />
            </label>
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                className="self-end gap-2"
                onClick={() => {
                  setPropertyFilter('')
                  setDateFilter('')
                }}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </section>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md border px-3 py-3 text-left shadow-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-[#0066FF] bg-[#F7FAFF] text-[#0052CC] shadow'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{tab.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">{counts[tab.key]}</span>
              </div>
              <p className="mt-1 text-xs opacity-70">{tab.help}</p>
            </button>
          ))}
        </div>

        {loading ? (
          <Card className="p-10 text-center text-slate-500">
            <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#0066FF]" />
            Loading enquiries...
          </Card>
        ) : visibleLeads.length === 0 ? (
          <Card className="p-10 text-center">
            <Globe className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-800">No enquiries here</p>
            <p className="mt-1 text-sm text-slate-500">New guest messages will appear in the right tab automatically.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleLeads.map((lead) => (
              <LeadCard key={lead.lead_id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
