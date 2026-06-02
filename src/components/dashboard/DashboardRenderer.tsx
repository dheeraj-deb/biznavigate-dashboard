'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useBusinessType } from '@/hooks/use-business-type'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { useDailyOverview, useLeads, useNeedsAttention, useResortReminderReadiness, useResortWorklist } from '@/hooks/use-leads'
import { useBusinessSettings } from '@/hooks/use-settings'
import { useConversations } from '@/hooks/use-inbox'
import { useAiManagerToday, type AiManagerSuggestion } from '@/hooks/use-ai-manager'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react'

interface SimpleLead {
  id: string
  name: string
  phone?: string
  status: string
  source: string
  need?: string
  created_at?: string
}

interface SimpleBooking {
  id: string
  guest: string
  item: string
  status: string
  amount?: number
  created_at?: string
}

interface InboxPreview {
  conversation_id: string
  sender_name?: string
  message_text?: string
  updated_at?: string
  unreadCount?: number
  needs_attention?: boolean
  is_resolved?: boolean
  status?: string
}

interface ResortBookingPreview {
  hospitality_booking_id?: string
  booking_number?: string
  guest_name?: string
  phone?: string
  item_name?: string
  check_in?: string
  check_out?: string
  guests?: number
  status?: string
  payment_status?: string
}

function unwrap(value: any) {
  return value?.data?.data ?? value?.data ?? value
}

function listFrom(value: any) {
  const payload = unwrap(value)
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.orders)) return payload.orders
  if (Array.isArray(payload?.bookings)) return payload.bookings
  return []
}

function money(value?: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 'Rs 0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

function shortTime(date?: string) {
  if (!date) return 'recently'
  const diff = Date.now() - new Date(date).getTime()
  if (Number.isNaN(diff)) return 'recently'
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function normalizeLead(raw: any): SimpleLead {
  const context = raw.context ?? raw.extracted_entities ?? {}
  const name = raw.name
    ?? [raw.first_name, raw.last_name].filter(Boolean).join(' ')
    ?? raw.customer_name
    ?? raw.phone
    ?? 'Guest'

  const need = context.item_name
    ?? context.property_name
    ?? context.room_preference
    ?? context.product_name
    ?? raw.lead_type
    ?? raw.intent_type

  return {
    id: raw.lead_id ?? raw.id ?? '',
    name,
    phone: raw.phone ?? raw.customer_phone,
    status: raw.status ?? 'new',
    source: raw.channel ?? raw.source ?? 'WhatsApp',
    need: need ? String(need) : undefined,
    created_at: raw.updated_at ?? raw.last_message_at ?? raw.created_at,
  }
}

function normalizeBooking(raw: any): SimpleBooking {
  return {
    id: raw.order_id ?? raw.booking_id ?? raw.id ?? '',
    guest: raw.items?.[0]?.guest_name ?? raw.customer_name ?? raw.name ?? 'Guest',
    item: raw.items?.[0]?.item_name ?? raw.service_name ?? raw.product_name ?? 'Booking',
    status: raw.delivery_status ?? raw.status ?? 'pending',
    amount: Number(raw.total_amount ?? raw.total_price ?? raw.amount ?? 0),
    created_at: raw.created_at,
  }
}

function statusLabel(status?: string) {
  const normalized = (status ?? '').toLowerCase()
  if (['won', 'booked', 'converted', 'confirmed'].includes(normalized)) return 'Done'
  if (['lost', 'cancelled', 'canceled'].includes(normalized)) return 'Closed'
  if (['contacted', 'active', 'qualified', 'quoted', 'interested'].includes(normalized)) return 'Talking'
  return 'New'
}

function needsReply(conversation: InboxPreview) {
  return Boolean(
    conversation.needs_attention
      || (conversation.unreadCount ?? 0) > 0
      || (conversation.status === 'waiting' && !conversation.is_resolved),
  )
}

function dateKey(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

function offsetDateKey(days: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function shortDate(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function useRecentWork(businessType: string) {
  return useQuery({
    queryKey: ['dashboard-simple-recent-work', businessType],
    queryFn: async () => {
      const endpoint = businessType === 'products' ? '/orders' : '/orders'
      const params = businessType === 'products'
        ? { limit: 4, sort: '-created_at' }
        : { order_type: 'accommodation', limit: 4, sort: '-created_at' }
      const response = await apiClient.get(endpoint, { params })
      return listFrom(response).map(normalizeBooking).filter((item: SimpleBooking) => item.id)
    },
    retry: 1,
  })
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  note: string
  tone: string
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
            <p className="text-xl font-bold text-slate-950 dark:text-white">{value}</p>
            <p className="pb-0.5 text-xs text-slate-500">{note}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function suggestionTone(priority: AiManagerSuggestion['priority'], status: AiManagerSuggestion['status']) {
  if (status === 'blocked') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (priority === 'high') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (priority === 'medium') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-green-200 bg-green-50 text-green-700'
}

function suggestionIcon(type: string) {
  if (type === 'booking_reminder') return MessageCircle
  if (type === 'stop_reminder') return ShieldCheck
  if (type === 'reply_waiting') return MessageCircle
  if (type === 'prepare_checkins') return CalendarCheck
  if (type === 'alternate_dates') return CalendarCheck
  if (type === 'open_inventory') return Package
  if (type === 'price_review') return IndianRupee
  return Bot
}

function AiSuggestionCard({ suggestion }: { suggestion: AiManagerSuggestion }) {
  const Icon = suggestionIcon(suggestion.type)
  const tone = suggestionTone(suggestion.priority, suggestion.status)

  return (
    <Link
      href={suggestion.action_href}
      className={`block rounded-md border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${tone}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/80">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-950">{suggestion.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-700">{suggestion.reason}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-600">
              {suggestion.status.replace(/_/g, ' ')}
            </span>
            {suggestion.safety ? (
              <span className="text-xs font-semibold text-slate-600">{suggestion.safety}</span>
            ) : null}
          </div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0" />
      </div>
    </Link>
  )
}

export function DashboardRenderer() {
  const { businessType, isLoading: bizLoading } = useBusinessType()
  const { data: statsData, isLoading: statsLoading } = useDashboardStats()
  const { data: businessSettings } = useBusinessSettings()
  const dailyOverviewQuery = useDailyOverview()
  const needsAttentionQuery = useNeedsAttention()
  const recentLeadsQuery = useLeads({ limit: 5, sort: '-created_at' } as any)
  const recentWorkQuery = useRecentWork(businessType)
  const inboxQuery = useConversations({ channel: 'whatsapp', limit: 5 } as any)
  const resortWorklistQuery = useResortWorklist(14)
  const resortRemindersQuery = useResortReminderReadiness(14)
  const aiManagerQuery = useAiManagerToday()

  const bookingLabel = businessType === 'products' ? 'orders' : 'bookings'
  const businessName = businessSettings?.business_name?.trim()
    || (businessType === 'products' ? 'Your Store' : businessType === 'events' ? 'Your Event Venue' : 'Your Resort')
  const location = [businessSettings?.city, businessSettings?.state].filter(Boolean).join(', ')

  const attentionLeads: SimpleLead[] = (needsAttentionQuery.data ?? [])
    .map(normalizeLead)
    .filter((lead: SimpleLead) => lead.id)
    .slice(0, 4)
  const recentLeadPayload = unwrap(recentLeadsQuery.data)
  const recentLeadRaw = Array.isArray(recentLeadPayload)
    ? recentLeadPayload
    : Array.isArray(recentLeadPayload?.data)
      ? recentLeadPayload.data
      : []
  const recentLeads: SimpleLead[] = recentLeadRaw
    .map(normalizeLead)
    .filter((lead: SimpleLead) => lead.id)
    .slice(0, 4)
  const recentWork: SimpleBooking[] = (recentWorkQuery.data ?? []).slice(0, 4)
  const inboxConversations: InboxPreview[] = (inboxQuery.data?.data ?? []).slice(0, 5)
  const latestInbox = inboxConversations[0]
  const needsReplyCount = inboxConversations.filter(needsReply).length
  const resortCounts = resortWorklistQuery.data?.counts ?? {}
  const todayKey = offsetDateKey(0)
  const tomorrowKey = offsetDateKey(1)
  const upcomingStays: ResortBookingPreview[] = resortWorklistQuery.data?.upcoming_bookings ?? []
  const nearCheckIns = upcomingStays
    .filter((booking) => [todayKey, tomorrowKey].includes(dateKey(booking.check_in)))
    .slice(0, 4)

  const todayLeads = dailyOverviewQuery.data?.total_leads ?? recentLeads.length
  const pendingToday = dailyOverviewQuery.data?.pending_count ?? attentionLeads.length
  const doneToday = dailyOverviewQuery.data?.won_count
    ?? dailyOverviewQuery.data?.converted_count
    ?? dailyOverviewQuery.data?.by_status?.find((item: any) => ['won', 'booked', 'converted'].includes(item.status))?.count
    ?? 0
  const revenue = (statsData as any)?.totalRevenue ?? (statsData as any)?.revenue ?? 0
  const missedDemand = Number(resortCounts.demand_missed ?? 0)
  const reminderCounts = resortRemindersQuery.data?.counts ?? {}
  const remindersReady = Number(reminderCounts.ready ?? 0)
  const needsAttentionTotal = pendingToday + needsReplyCount + missedDemand
  const aiSuggestions = aiManagerQuery.data?.suggestions ?? []

  if (bizLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#0066FF] text-white">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[#0066FF]">AI Resort Manager</p>
                <h1 className="truncate text-2xl font-bold text-slate-950">{businessName}</h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Today&apos;s owner view. See what needs action first, then check bookings, enquiries and WhatsApp in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
              <Link href="/crm/inbox">
                <MessageCircle className="h-4 w-4" />
                Open inbox
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 bg-white">
              <Link href="/crm/leads">
                <Users className="h-4 w-4" />
                Guest enquiries
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 bg-white">
              <Link href={businessType === 'products' ? '/inventory/products' : '/inventory/rooms'}>
                <Package className="h-4 w-4" />
                Inventory
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Enquiries"
            value={todayLeads}
            note="today"
            tone="bg-blue-50 text-blue-700"
          />
          <MetricCard
            icon={Clock}
            label="Follow-up"
            value={pendingToday}
            note="waiting"
            tone="bg-amber-50 text-amber-700"
          />
          <MetricCard
            icon={CheckCircle2}
            label={`Confirmed ${bookingLabel}`}
            value={doneToday}
            note="done"
            tone="bg-green-50 text-green-700"
          />
          <MetricCard
            icon={IndianRupee}
            label="Sales"
            value={money(revenue)}
            note="recorded"
            tone="bg-slate-100 text-slate-700"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">What to do now</h2>
              <p className="mt-1 text-sm text-slate-500">
                AI suggestions are checked against enquiries, WhatsApp and live availability.
              </p>
            </div>
            <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              {aiManagerQuery.data?.counts?.high
                ? `${aiManagerQuery.data.counts.high} high priority`
                : needsAttentionTotal > 0
                  ? `${needsAttentionTotal} to check`
                  : 'All clear'}
            </span>
          </div>

          {aiManagerQuery.isLoading ? (
            <div className="mt-4 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
            </div>
          ) : aiSuggestions.length > 0 ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {aiSuggestions.slice(0, 4).map((suggestion) => (
                <AiSuggestionCard key={`${suggestion.type}-${suggestion.title}`} suggestion={suggestion} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-green-100 bg-green-50 p-4">
              <p className="font-semibold text-green-900">No urgent action right now.</p>
              <p className="mt-1 text-sm text-green-800">New work appears here when guests enquire or bookings need attention.</p>
            </div>
          )}
        </Card>

        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Today&apos;s work</h2>
              <p className="mt-1 text-sm text-slate-500">A short checklist for the owner.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
              <Link href="/crm/leads">View all</Link>
            </Button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
            <Link href="/crm/inbox" className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
              <span className="flex min-w-0 items-center gap-3">
                <MessageCircle className="h-4 w-4 shrink-0 text-green-600" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-950">WhatsApp replies</span>
                  <span className="block truncate text-xs text-slate-500">
                    {latestInbox?.message_text || 'Open latest customer messages'}
                  </span>
                </span>
              </span>
              <strong className="shrink-0 text-sm text-slate-950">{needsReplyCount}</strong>
            </Link>

            {businessType !== 'products' ? (
              <>
                <Link href="/crm/leads" className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-3">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">Safe reminders</span>
                      <span className="block truncate text-xs text-slate-500">Availability checked before sending</span>
                    </span>
                  </span>
                  <strong className="shrink-0 text-sm text-slate-950">{remindersReady}</strong>
                </Link>

                <Link href="/crm/leads" className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-3">
                    <CalendarCheck className="h-4 w-4 shrink-0 text-rose-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">No-room requests</span>
                      <span className="block truncate text-xs text-slate-500">Offer other dates or property</span>
                    </span>
                  </span>
                  <strong className="shrink-0 text-sm text-slate-950">{missedDemand}</strong>
                </Link>

                <Link href="/inventory/bookings" className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-3">
                    <Building2 className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">Upcoming stays</span>
                      <span className="block truncate text-xs text-slate-500">Prepare today or tomorrow</span>
                    </span>
                  </span>
                  <strong className="shrink-0 text-sm text-slate-950">{nearCheckIns.length}</strong>
                </Link>
              </>
            ) : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Guest enquiries</h2>
              <p className="mt-1 text-sm text-slate-500">New and warm leads, kept simple.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-[#0066FF]">
              <Link href="/crm/leads">
                Open leads
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {needsAttentionQuery.isLoading || recentLeadsQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
            </div>
          ) : attentionLeads.length === 0 && recentLeads.length === 0 ? (
            <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No enquiries yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {[...attentionLeads, ...recentLeads]
                .filter((lead, index, list) => list.findIndex((item) => item.id === lead.id) === index)
                .slice(0, 5)
                .map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between gap-3 py-3">
                    <Link href={`/crm/leads/${lead.id}`} className="min-w-0">
                      <p className="truncate font-semibold text-slate-950 hover:text-[#0066FF]">{lead.name}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {lead.need ? `${lead.need} - ` : ''}{statusLabel(lead.status)} - {shortTime(lead.created_at)}
                      </p>
                    </Link>
                    {lead.phone ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-2"
                        onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank')}
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                    ) : null}
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {businessType === 'products' ? `Latest ${bookingLabel}` : 'Bookings and stays'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Recent bookings with the next arrival checks.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-[#0066FF]">
              <Link href={businessType === 'products' ? '/orders' : '/inventory/bookings'}>
                View
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentWorkQuery.isLoading || resortWorklistQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
            </div>
          ) : recentWork.length === 0 && nearCheckIns.length === 0 ? (
            <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No {bookingLabel} yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {nearCheckIns.slice(0, 3).map((booking) => (
                <div key={booking.hospitality_booking_id ?? booking.booking_number} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-950">{booking.guest_name ?? 'Guest'}</p>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                        {dateKey(booking.check_in) === todayKey ? 'Today' : 'Tomorrow'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {(booking.item_name ?? 'Stay')} - {shortDate(booking.check_in)}
                      {booking.check_out ? ` to ${shortDate(booking.check_out)}` : ''}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link href="/inventory/bookings">View</Link>
                  </Button>
                </div>
              ))}

              {recentWork.slice(0, Math.max(2, 5 - nearCheckIns.length)).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{item.guest}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{item.item}</p>
                  </div>
                  <strong className="shrink-0 text-sm text-slate-950">{money(item.amount)}</strong>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
