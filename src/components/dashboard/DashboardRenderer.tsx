'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useBusinessType } from '@/hooks/use-business-type'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { useDailyOverview, useLeads, useNeedsAttention } from '@/hooks/use-leads'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Search,
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
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
      </div>
    </Card>
  )
}

function ActionButton({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}) {
  return (
    <Button asChild variant="outline" className="h-auto w-full justify-start gap-3 p-4 text-left">
      <Link href={href}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#0066FF]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900">{label}</span>
          <span className="mt-0.5 block text-xs font-normal text-slate-500">{description}</span>
        </span>
      </Link>
    </Button>
  )
}

export function DashboardRenderer() {
  const { businessType, isLoading: bizLoading } = useBusinessType()
  const { data: statsData, isLoading: statsLoading } = useDashboardStats()
  const dailyOverviewQuery = useDailyOverview()
  const needsAttentionQuery = useNeedsAttention()
  const recentLeadsQuery = useLeads({ limit: 5, sort: '-created_at' } as any)
  const recentWorkQuery = useRecentWork(businessType)

  const businessLabel = businessType === 'products'
    ? 'store'
    : businessType === 'events'
      ? 'event business'
      : 'property'

  const bookingLabel = businessType === 'products' ? 'orders' : 'bookings'
  const itemLabel = businessType === 'products' ? 'products' : 'rooms and services'

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

  const todayLeads = dailyOverviewQuery.data?.total_leads ?? recentLeads.length
  const pendingToday = dailyOverviewQuery.data?.pending_count ?? attentionLeads.length
  const doneToday = dailyOverviewQuery.data?.won_count
    ?? dailyOverviewQuery.data?.converted_count
    ?? dailyOverviewQuery.data?.by_status?.find((item: any) => ['won', 'booked', 'converted'].includes(item.status))?.count
    ?? 0
  const revenue = (statsData as any)?.totalRevenue ?? (statsData as any)?.revenue ?? 0

  if (bizLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0066FF]">Today</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">What needs attention?</h1>
          <p className="mt-1 text-sm text-slate-500">
            A simple daily view for your {businessLabel}. Start with follow-ups, then check new enquiries and {bookingLabel}.
          </p>
        </div>
        <Button asChild className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
          <Link href="/crm/inbox">
            <MessageCircle className="h-4 w-4" />
            Open inbox
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="New enquiries"
          value={todayLeads}
          note="People who contacted you today"
          tone="bg-blue-50 text-blue-700"
        />
        <MetricCard
          icon={Clock}
          label="Need follow-up"
          value={pendingToday}
          note="Reply to these first"
          tone="bg-amber-50 text-amber-700"
        />
        <MetricCard
          icon={CheckCircle2}
          label={`Confirmed ${bookingLabel}`}
          value={doneToday}
          note="Marked done or booked today"
          tone="bg-green-50 text-green-700"
        />
        <MetricCard
          icon={IndianRupee}
          label="Sales"
          value={money(revenue)}
          note="Total recorded sales"
          tone="bg-slate-100 text-slate-700"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Follow up first</h2>
                <p className="mt-1 text-sm text-slate-500">These guests or customers may be waiting for a reply.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-[#0066FF]">
                <Link href="/crm/leads">
                  All leads
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {needsAttentionQuery.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
              </div>
            ) : attentionLeads.length === 0 ? (
              <div className="mt-4 rounded-md border border-green-100 bg-green-50 p-4">
                <p className="font-semibold text-green-900">No urgent follow-ups right now.</p>
                <p className="mt-1 text-sm text-green-800">You can check recent enquiries or open the inbox.</p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {attentionLeads.map((lead) => (
                  <div key={lead.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/crm/leads/${lead.id}`} className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-950 hover:text-[#0066FF]">{lead.name}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {lead.need ? `${lead.need} - ` : ''}{statusLabel(lead.status)} - {shortTime(lead.created_at)}
                      </p>
                    </Link>
                    <div className="flex gap-2">
                      {lead.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                      )}
                      <Button asChild size="sm" className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                        <Link href={`/crm/leads/${lead.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent enquiries</h2>
                <p className="mt-1 text-sm text-slate-500">Latest people who contacted your business.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-[#0066FF]">
                <Link href="/crm/leads">
                  Open leads
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {recentLeadsQuery.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
              </div>
            ) : recentLeads.length === 0 ? (
              <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-500">No enquiries yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/crm/leads/${lead.id}`}
                    className="rounded-md border border-slate-200 p-3 transition-colors hover:border-[#0066FF]/40 hover:bg-blue-50/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{lead.name}</p>
                        <p className="mt-1 truncate text-sm text-slate-500">{lead.need ?? lead.phone ?? 'New enquiry'}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {statusLabel(lead.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Common tasks</h2>
            <div className="mt-4 space-y-3">
              <ActionButton href="/crm/inbox" icon={MessageCircle} label="Reply to messages" description="Open WhatsApp and web chats" />
              <ActionButton href="/crm/leads" icon={Search} label="Check enquiries" description="See new, follow-up, booked, and lost leads" />
              <ActionButton href="/inventory/bookings/new" icon={Plus} label={`Create ${bookingLabel.slice(0, -1)}`} description="Make a booking or order for a customer" />
              <ActionButton href={businessType === 'products' ? '/inventory/products' : '/inventory/rooms'} icon={Package} label={`Manage ${itemLabel}`} description="Update what customers can book or buy" />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Latest {bookingLabel}</h2>
                <p className="mt-1 text-sm text-slate-500">Recently created records.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
                <Link href={businessType === 'products' ? '/orders' : '/inventory/bookings'}>View</Link>
              </Button>
            </div>

            {recentWorkQuery.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
              </div>
            ) : recentWork.length === 0 ? (
              <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-500">No {bookingLabel} yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentWork.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{item.guest}</p>
                        <p className="mt-1 truncate text-sm text-slate-500">{item.item}</p>
                      </div>
                      <CalendarCheck className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-500">{item.status.replace(/_/g, ' ')}</span>
                      <strong className="text-slate-950">{money(item.amount)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
