'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useBusinessType } from '@/hooks/use-business-type'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { useDailyOverview, useLeads, useNeedsAttention, useResortReminderReadiness, useResortWorklist } from '@/hooks/use-leads'
import { useBusinessSettings } from '@/hooks/use-settings'
import { useConversations } from '@/hooks/use-inbox'
import { useAiManagerToday, type AiEmployee, type AiEmployeeMetric, type AiManagerSuggestion } from '@/hooks/use-ai-manager'
import { useAppointmentSalesOverview } from '@/hooks/use-appointment-sales'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Car,
  IndianRupee,
  Loader2,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Megaphone,
  Truck,
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

function isSalesBusinessType(businessType: string) {
  return ['products', 'retail', 'used_cars', 'real_estate'].includes(businessType)
}

function useRecentWork(businessType: string) {
  return useQuery({
    queryKey: ['dashboard-simple-recent-work', businessType],
    queryFn: async () => {
      const endpoint = '/orders'
      const params = isSalesBusinessType(businessType)
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
  if (type === 'product_inquiry') return Package
  if (type === 'payment_pending') return IndianRupee
  if (type === 'pack_orders') return ShoppingCart
  if (type === 'abandoned_cart') return ShoppingCart
  if (type === 'low_stock') return AlertTriangle
  if (type === 'out_of_stock') return AlertTriangle
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

function employeeIcon(key: string) {
  if (key === 'sales') return Users
  if (key === 'orders') return Truck
  if (key === 'inventory') return Package
  if (key === 'marketing') return Megaphone
  if (key === 'growth') return BarChart3
  return Bot
}

function employeeStatusTone(status: string) {
  if (status === 'needs_attention') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'needs_setup') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'working') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-green-200 bg-green-50 text-green-700'
}

function metricTone(tone?: AiEmployeeMetric['tone']) {
  if (tone === 'danger') return 'bg-rose-50 text-rose-700'
  if (tone === 'warning') return 'bg-amber-50 text-amber-700'
  if (tone === 'good') return 'bg-green-50 text-green-700'
  return 'bg-slate-100 text-slate-700'
}

function formatEmployeeMetric(metric: AiEmployeeMetric) {
  if (metric.format === 'money') return money(metric.value)
  return metric.value
}

function ProductAiEmployees({ employees }: { employees: AiEmployee[] }) {
  if (!employees.length) return null

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">AI employees</h2>
          <p className="mt-1 text-sm text-slate-500">Separate workers for sales, orders, inventory, marketing and growth.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit gap-2 bg-white">
          <Link href="/campaigns/live">
            <Bot className="h-4 w-4" />
            Activity
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        {employees.map((employee) => {
          const Icon = employeeIcon(employee.key)
          const statusTone = employeeStatusTone(employee.status)
          const primaryAction = employee.next_actions?.[0]

          return (
            <Card key={employee.key} className="flex min-h-[320px] flex-col border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${statusTone}`}>
                  {employee.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-3 min-w-0">
                <h3 className="text-base font-bold leading-5 text-slate-950">{employee.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs font-semibold uppercase text-slate-500">{employee.role}</p>
                <p className="mt-3 min-h-[60px] text-sm leading-5 text-slate-600">{employee.summary}</p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {employee.metrics.slice(0, 3).map((metric) => (
                  <div key={metric.label} className={`rounded-md px-2 py-2 ${metricTone(metric.tone)}`}>
                    <p className="truncate text-[11px] font-semibold">{metric.label}</p>
                    <p className="mt-1 truncate text-sm font-bold">{formatEmployeeMetric(metric)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex-1 space-y-2">
                {employee.completed_work.slice(0, 2).map((item) => (
                  <Link
                    key={`${employee.key}-${item.title}`}
                    href={item.href ?? '/dashboard'}
                    className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                  >
                    <p className="truncate text-xs font-bold text-slate-950">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">{item.detail}</p>
                  </Link>
                ))}
              </div>

              {primaryAction ? (
                <Button asChild variant="outline" size="sm" className="mt-4 justify-between bg-white">
                  <Link href={primaryAction.action_href}>
                    {primaryAction.action_label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <div className="mt-4 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
                  No owner action needed
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function uniqueLeads(primary: SimpleLead[], secondary: SimpleLead[]) {
  return [...primary, ...secondary]
    .filter((lead, index, list) => lead.id && list.findIndex((item) => item.id === lead.id) === index)
}

function firstMetric(employee: AiEmployee | undefined, label: string) {
  return employee?.metrics.find((metric) => metric.label.toLowerCase() === label.toLowerCase())
}

function ProductSellerDashboard({
  businessName,
  location,
  todayLeads,
  needsReplyCount,
  revenue,
  aiSuggestions,
  aiEmployees,
  aiManagerLoading,
  attentionLeads,
  recentLeads,
  recentWork,
  leadsLoading,
  workLoading,
}: {
  businessName: string
  location: string
  todayLeads: number
  needsReplyCount: number
  revenue: number
  aiSuggestions: AiManagerSuggestion[]
  aiEmployees: AiEmployee[]
  aiManagerLoading: boolean
  attentionLeads: SimpleLead[]
  recentLeads: SimpleLead[]
  recentWork: SimpleBooking[]
  leadsLoading: boolean
  workLoading: boolean
}) {
  const visibleSuggestions = aiSuggestions.filter((item) => item.type !== 'all_clear').slice(0, 3)
  const primarySuggestion = visibleSuggestions[0]
  const customerEnquiries = uniqueLeads(attentionLeads, recentLeads).slice(0, 4)
  const inventoryEmployee = aiEmployees.find((employee) => employee.key === 'inventory')
  const salesEmployee = aiEmployees.find((employee) => employee.key === 'sales')
  const orderEmployee = aiEmployees.find((employee) => employee.key === 'orders')
  const lowStock = Number(firstMetric(inventoryEmployee, 'Stock issues')?.value ?? 0)
  const unpaidOrders = Number(firstMetric(orderEmployee, 'Unpaid')?.value ?? 0)
  const waitingEnquiries = Number(firstMetric(salesEmployee, 'Waiting buyers')?.value ?? needsReplyCount)
  const activeEmployees = aiEmployees.filter((employee) => employee.status !== 'watching').length

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-[#0066FF]">Today&apos;s store desk</p>
                    <h1 className="truncate text-2xl font-bold text-slate-950">{businessName}</h1>
                    {location ? <p className="mt-1 truncate text-sm text-slate-500">{location}</p> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                  <Link href="/seller-os">
                    <ShoppingBag className="h-4 w-4" />
                    Store Desk
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 bg-white">
                  <Link href="/crm/inbox">
                    <MessageCircle className="h-4 w-4" />
                    Reply
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 bg-white">
                  <Link href="/orders">
                    <Truck className="h-4 w-4" />
                    Orders
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 bg-white">
                  <Link href="/inventory/products">
                    <Package className="h-4 w-4" />
                    Stock
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase text-slate-500">Enquiries today</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{todayLeads}</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-bold uppercase text-amber-700">Need reply</p>
                <p className="mt-2 text-2xl font-bold text-amber-950">{waitingEnquiries}</p>
              </div>
              <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-xs font-bold uppercase text-rose-700">Stock risk</p>
                <p className="mt-2 text-2xl font-bold text-rose-950">{lowStock}</p>
              </div>
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-xs font-bold uppercase text-green-700">Sales recorded</p>
                <p className="mt-2 truncate text-2xl font-bold text-green-950">{money(revenue)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-950 p-4 text-white sm:p-5 xl:border-l xl:border-t-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-300">Owner focus</p>
                <h2 className="mt-2 text-xl font-bold">
                  {primarySuggestion ? primarySuggestion.title : 'Everything is calm'}
                </h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                {visibleSuggestions.length ? `${visibleSuggestions.length} task${visibleSuggestions.length === 1 ? '' : 's'}` : 'Clear'}
              </span>
            </div>

            <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-300">
              {primarySuggestion
                ? primarySuggestion.reason
                : 'No waiting enquiries, unpaid order alerts or stock blockers are in the priority queue.'}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-white/10 px-2 py-3">
                <p className="text-lg font-bold">{unpaidOrders}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase text-slate-300">Unpaid</p>
              </div>
              <div className="rounded-md bg-white/10 px-2 py-3">
                <p className="text-lg font-bold">{activeEmployees}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase text-slate-300">AI active</p>
              </div>
              <div className="rounded-md bg-white/10 px-2 py-3">
                <p className="text-lg font-bold">{lowStock}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase text-slate-300">Stock</p>
              </div>
            </div>

            {primarySuggestion ? (
              <Button asChild className="mt-5 w-full justify-between bg-white text-slate-950 hover:bg-slate-100">
                <Link href={primarySuggestion.action_href}>
                  {primarySuggestion.action_label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="mt-5 w-full justify-between bg-white text-slate-950 hover:bg-slate-100">
                <Link href="/ai-employees">
                  See AI employees
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Do these first</h2>
              <p className="mt-1 text-sm text-slate-500">Only the work that needs the owner today.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
              <Link href="/crm/inbox">Inbox</Link>
            </Button>
          </div>

          {aiManagerLoading ? (
            <div className="mt-4 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
            </div>
          ) : visibleSuggestions.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
              {visibleSuggestions.map((suggestion, index) => {
                const Icon = suggestionIcon(suggestion.type)
                return (
                  <Link key={`${suggestion.type}-${suggestion.title}`} href={suggestion.action_href} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-950">{index + 1}. {suggestion.title}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${suggestionTone(suggestion.priority, suggestion.status)}`}>
                          {suggestion.priority}
                        </span>
                      </span>
                      <span className="mt-1 block line-clamp-2 text-sm leading-5 text-slate-500">{suggestion.reason}</span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-green-100 bg-green-50 p-4">
              <p className="font-semibold text-green-900">No urgent work right now.</p>
              <p className="mt-1 text-sm text-green-800">The store desk will light up when an enquiry, order or stock item needs attention.</p>
            </div>
          )}
        </Card>

        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">AI team</h2>
              <p className="mt-1 text-sm text-slate-500">Small status, clear ownership.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
              <Link href="/ai-employees">Open</Link>
            </Button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
            {aiEmployees.slice(0, 5).map((employee) => {
              const Icon = employeeIcon(employee.key)
              return (
                <Link key={employee.key} href="/ai-employees" className="flex items-center gap-3 p-3 hover:bg-slate-50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-950">{employee.name.replace(/^AI\s/, '')}</span>
                    <span className="block truncate text-xs text-slate-500">{employee.summary}</span>
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${employeeStatusTone(employee.status)}`}>
                    {employee.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              )
            })}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">Enquiries</h2>
            <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
              <Link href="/crm/leads">All</Link>
            </Button>
          </div>

          {leadsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#0066FF]" />
            </div>
          ) : customerEnquiries.length > 0 ? (
            <div className="mt-3 divide-y divide-slate-100">
              {customerEnquiries.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/crm/leads/${lead.id}`} className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{lead.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{lead.need ? `${lead.need} - ` : ''}{shortTime(lead.created_at)}</p>
                  </Link>
                  {lead.phone ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2 bg-white"
                      onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No product enquiries yet.</p>
          )}
        </Card>

        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">Orders</h2>
            <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
              <Link href="/orders">All</Link>
            </Button>
          </div>

          {workLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#0066FF]" />
            </div>
          ) : recentWork.length > 0 ? (
            <div className="mt-3 divide-y divide-slate-100">
              {recentWork.slice(0, 4).map((item) => (
                <Link key={item.id} href="/orders" className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-950">{item.guest}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{item.item}</span>
                  </span>
                  <strong className="shrink-0 text-sm text-slate-950">{money(item.amount)}</strong>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No orders yet.</p>
          )}
        </Card>

        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">Stock guard</h2>
            <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
              <Link href="/inventory/products">Open</Link>
            </Button>
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-md ${lowStock > 0 ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-950">{lowStock > 0 ? 'Needs stock update' : 'Stock looks fine'}</span>
                  <span className="mt-1 block text-xs text-slate-500">{inventoryEmployee?.summary ?? 'Inventory employee is watching product stock.'}</span>
                </span>
              </span>
              <strong className="text-2xl font-bold text-slate-950">{lowStock}</strong>
            </div>
          </div>

          <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
            {(inventoryEmployee?.completed_work ?? []).slice(0, 2).map((item) => (
              <Link key={item.title} href={item.href ?? '/inventory/products'} className="block p-3 hover:bg-slate-50">
                <p className="truncate text-sm font-bold text-slate-950">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.detail}</p>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}

function visitStatusTone(status: string) {
  if (status === 'completed' || status === 'converted') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'cancelled' || status === 'no_show') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'confirmed' || status === 'arrived') return 'border-blue-200 bg-blue-50 text-[#0066FF]'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function visitTime(value?: string) {
  if (!value) return 'Not scheduled'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function AppointmentSalesDashboard({
  businessName,
  location,
  businessType,
}: {
  businessName: string
  location: string
  businessType: string
}) {
  const overviewQuery = useAppointmentSalesOverview()
  const overview = overviewQuery.data
  const isProperty = businessType === 'real_estate'
  const Icon = isProperty ? Building2 : Car
  const copy = {
    title: isProperty ? 'Property Sales Desk' : 'Vehicle Sales Desk',
    noun: isProperty ? 'property' : 'vehicle',
    plural: isProperty ? 'properties' : 'vehicles',
    visit: isProperty ? 'site visit' : 'showroom visit',
  }
  const summary = overview?.summary
  const setupNeeded = !summary || summary.active_listings === 0 || summary.active_staff === 0

  if (overviewQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-[#0066FF]">{copy.title}</p>
                  <h1 className="truncate text-2xl font-bold text-slate-950">{businessName}</h1>
                  {location ? <p className="mt-1 truncate text-sm text-slate-500">{location}</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                  <Link href="/appointment-sales">
                    <CalendarCheck className="h-4 w-4" />
                    Visit Desk
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 bg-white">
                  <Link href="/crm/inbox">
                    <MessageCircle className="h-4 w-4" />
                    Inbox
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 bg-white">
                  <Link href="/appointment-sales/listings">
                    <Icon className="h-4 w-4" />
                    Listings
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Icon}
                label={`Active ${copy.plural}`}
                value={summary?.active_listings ?? 0}
                note="ready to show"
                tone="bg-blue-50 text-[#0066FF]"
              />
              <MetricCard
                icon={Users}
                label="Sales staff"
                value={summary?.active_staff ?? 0}
                note="with timings"
                tone="bg-slate-100 text-slate-700"
              />
              <MetricCard
                icon={CalendarDays}
                label="Visits today"
                value={summary?.visits_today ?? 0}
                note="scheduled"
                tone="bg-amber-50 text-amber-700"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Upcoming"
                value={summary?.upcoming_visits ?? 0}
                note="to convert"
                tone="bg-green-50 text-green-700"
              />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Link href="/appointment-sales/listings" className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-950">Needs details</span>
                  <span className="text-lg font-bold text-slate-950">{summary?.listings_needing_update ?? 0}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">missing photo or description</p>
              </Link>
              <Link href="/appointment-sales/listings" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-amber-900">WhatsApp sync</span>
                  <span className="text-lg font-bold text-amber-900">{summary?.sync_attention ?? 0}</span>
                </div>
                <p className="mt-1 text-xs text-amber-700">pending or failed items</p>
              </Link>
              <Link href="/appointment-sales/listings" className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-blue-950">Sold</span>
                  <span className="text-lg font-bold text-blue-950">{summary?.sold_listings ?? 0}</span>
                </div>
                <p className="mt-1 text-xs text-blue-700">closed {copy.plural}</p>
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-950 p-4 text-white sm:p-5 xl:border-l xl:border-t-0">
            <p className="text-xs font-bold uppercase text-slate-300">Owner focus</p>
            <h2 className="mt-2 text-xl font-bold">
              {setupNeeded ? 'Finish listings and staff timings' : `Keep ${copy.visit}s moving`}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {setupNeeded
                ? `Add at least one ${copy.noun} and one salesperson so AI can guide customers toward visits.`
                : `AI can show saved ${copy.plural}, answer simple questions, and move interested customers to a visit.`}
            </p>
            <Button asChild className="mt-5 w-full justify-between bg-white text-slate-950 hover:bg-slate-100">
              <Link href={setupNeeded ? '/appointment-sales-setup' : '/appointment-sales/visits'}>
                {setupNeeded ? 'Complete setup' : 'Review visits'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Recent visits</h2>
              <p className="mt-1 text-sm text-slate-500">Today&apos;s practical work for the team.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
              <Link href="/appointment-sales/visits">All</Link>
            </Button>
          </div>
          <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
            {(overview?.recent_visits ?? []).slice(0, 5).map((visit) => (
              <Link key={visit.visit_id} href="/appointment-sales/visits" className="block p-4 hover:bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-slate-950">{visit.customer_name || visit.customer_phone || 'Customer'}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${visitStatusTone(visit.status)}`}>
                    {visit.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-2 truncate text-xs text-slate-500">
                  {visit.item_name || `General ${copy.visit}`} | {visitTime(visit.scheduled_start)} | {visit.sales_staff_name || 'Auto assign'}
                </p>
              </Link>
            ))}
            {!overview?.recent_visits?.length ? (
              <div className="p-4 text-sm text-slate-500">No visits booked yet.</div>
            ) : null}
          </div>
        </Card>

        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">AI employees</h2>
              <p className="mt-1 text-sm text-slate-500">What AI is responsible for.</p>
            </div>
            <Bot className="h-5 w-5 text-[#0066FF]" />
          </div>
          <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
            {(overview?.ai_employees ?? []).map((employee) => (
              <div key={employee.key} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-slate-950">{employee.name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${employeeStatusTone(employee.status)}`}>
                    {employee.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{employee.summary}</p>
                <p className="mt-2 text-xs font-semibold text-[#0066FF]">{employee.next}</p>
              </div>
            ))}
            {!overview?.ai_employees?.length ? (
              <div className="p-4 text-sm text-slate-500">AI visit employees will appear after setup.</div>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  )
}

export function DashboardRenderer() {
  const { businessType, isLoading: bizLoading } = useBusinessType()
  const isProductBusiness = businessType === 'products' || businessType === 'retail'
  const isAppointmentBusiness = businessType === 'used_cars' || businessType === 'real_estate'
  const isSalesBusiness = isSalesBusinessType(businessType) || isAppointmentBusiness
  const isUsedCars = businessType === 'used_cars'
  const { data: statsData, isLoading: statsLoading } = useDashboardStats()
  const { data: businessSettings } = useBusinessSettings()
  const dailyOverviewQuery = useDailyOverview()
  const needsAttentionQuery = useNeedsAttention()
  const recentLeadsQuery = useLeads({ limit: 5, sort: '-created_at' } as any)
  const recentWorkQuery = useRecentWork(businessType)
  const inboxQuery = useConversations({ channel: 'whatsapp', limit: 5 } as any)
  const resortWorklistQuery = useResortWorklist(14, !isSalesBusiness)
  const resortRemindersQuery = useResortReminderReadiness(14, !isSalesBusiness)
  const aiManagerQuery = useAiManagerToday()

  const bookingLabel = isUsedCars ? 'deals' : isSalesBusiness ? 'orders' : 'bookings'
  const enquiryLabel = isUsedCars ? 'Buyer enquiries' : isSalesBusiness ? 'Customer enquiries' : 'Guest enquiries'
  const enquiryTitle = isUsedCars ? 'Buyer enquiries' : isProductBusiness ? 'Product enquiries' : 'Guest enquiries'
  const inventoryHref = isSalesBusiness ? '/inventory/products' : '/inventory/rooms'
  const ordersHref = isSalesBusiness ? '/orders' : '/inventory/bookings'
  const aiTitle = aiManagerQuery.data?.title ?? (isUsedCars ? 'AI Vehicle Sales Manager' : isProductBusiness ? 'AI Store Manager' : 'AI Resort Manager')
  const aiSubtitle = aiManagerQuery.data?.subtitle
    ?? (isUsedCars
      ? 'What to do today to convert buyer enquiries into vehicle deals.'
      : isProductBusiness
      ? 'What to do today to convert product enquiries into orders.'
      : 'What to do today to get bookings and avoid mistakes.')
  const businessName = businessSettings?.business_name?.trim()
    || (isUsedCars
      ? 'Your Showroom'
      : businessType === 'real_estate'
        ? 'Your Property Business'
        : isProductBusiness
          ? 'Your Store'
          : businessType === 'events'
            ? 'Your Event Venue'
            : 'Your Resort')
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
  const nearCheckIns = isProductBusiness || isAppointmentBusiness
    ? []
    : upcomingStays
      .filter((booking) => [todayKey, tomorrowKey].includes(dateKey(booking.check_in)))
      .slice(0, 4)

  const todayLeads = dailyOverviewQuery.data?.total_leads ?? recentLeads.length
  const pendingToday = dailyOverviewQuery.data?.pending_count ?? attentionLeads.length
  const doneToday = dailyOverviewQuery.data?.won_count
    ?? dailyOverviewQuery.data?.converted_count
    ?? dailyOverviewQuery.data?.by_status?.find((item: any) => ['won', 'booked', 'converted'].includes(item.status))?.count
    ?? 0
  const revenue = (statsData as any)?.totalRevenue ?? (statsData as any)?.revenue ?? 0
  const missedDemand = isSalesBusiness ? 0 : Number(resortCounts.demand_missed ?? 0)
  const reminderCounts = resortRemindersQuery.data?.counts ?? {}
  const remindersReady = Number(reminderCounts.ready ?? 0)
  const needsAttentionTotal = pendingToday + needsReplyCount + missedDemand
  const aiSuggestions = aiManagerQuery.data?.suggestions ?? []
  const aiEmployees = aiManagerQuery.data?.employees ?? []

  if (bizLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    )
  }

  if (isProductBusiness) {
    return (
      <ProductSellerDashboard
        businessName={businessName}
        location={location}
        todayLeads={todayLeads}
        needsReplyCount={needsReplyCount}
        revenue={Number(revenue)}
        aiSuggestions={aiSuggestions}
        aiEmployees={aiEmployees}
        aiManagerLoading={aiManagerQuery.isLoading}
        attentionLeads={attentionLeads}
        recentLeads={recentLeads}
        recentWork={recentWork}
        leadsLoading={needsAttentionQuery.isLoading || recentLeadsQuery.isLoading}
        workLoading={recentWorkQuery.isLoading}
      />
    )
  }

  if (isAppointmentBusiness) {
    return (
      <AppointmentSalesDashboard
        businessName={businessName}
        location={location}
        businessType={businessType}
      />
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
                <p className="text-xs font-bold uppercase tracking-wide text-[#0066FF]">{aiTitle}</p>
                <h1 className="truncate text-2xl font-bold text-slate-950">{businessName}</h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {aiSubtitle}
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
                {enquiryTitle}
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 bg-white">
              <Link href={inventoryHref}>
                <Package className="h-4 w-4" />
                Inventory
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Users}
            label={isProductBusiness ? 'Product leads' : 'Enquiries'}
            value={todayLeads}
            note="today"
            tone="bg-blue-50 text-blue-700"
          />
          <MetricCard
            icon={Clock}
            label={isProductBusiness ? 'Need reply' : 'Follow-up'}
            value={pendingToday}
            note="waiting"
            tone="bg-amber-50 text-amber-700"
          />
          <MetricCard
            icon={CheckCircle2}
            label={isProductBusiness ? 'Orders today' : `Confirmed ${bookingLabel}`}
            value={doneToday}
            note={isProductBusiness ? 'new' : 'done'}
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

      {isProductBusiness ? <ProductAiEmployees employees={aiEmployees} /> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">What to do now</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isProductBusiness
                  ? 'AI suggestions are checked against product enquiries, orders, carts, stock and WhatsApp.'
                  : 'AI suggestions are checked against enquiries, WhatsApp and live availability.'}
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
              <p className="mt-1 text-sm text-green-800">
                New work appears here when {isProductBusiness ? 'customers enquire, orders need payment, or stock needs attention' : 'guests enquire or bookings need attention'}.
              </p>
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

            {isSalesBusiness ? (
              <>
                <Link href="/orders" className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-3">
                    <IndianRupee className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">{isUsedCars ? 'Pending deal payments' : 'Unpaid orders'}</span>
                      <span className="block truncate text-xs text-slate-500">Collect payment or confirm customer interest</span>
                    </span>
                  </span>
                  <strong className="shrink-0 text-sm text-slate-950">{aiManagerQuery.data?.counts?.payment_pending ?? 0}</strong>
                </Link>

                <Link href="/crm/leads" className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-3">
                    <ShoppingCart className="h-4 w-4 shrink-0 text-blue-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">{isUsedCars ? 'Warm buyers' : 'Active carts'}</span>
                      <span className="block truncate text-xs text-slate-500">{isUsedCars ? 'Buyers may need test-drive or availability help' : 'Customers selected products but may need help'}</span>
                    </span>
                  </span>
                  <strong className="shrink-0 text-sm text-slate-950">{aiManagerQuery.data?.counts?.active_carts ?? 0}</strong>
                </Link>

                <Link href="/inventory/products" className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">{isUsedCars ? 'Vehicle availability' : 'Stock issues'}</span>
                      <span className="block truncate text-xs text-slate-500">{isUsedCars ? 'Keep vehicle listings and status current' : 'Low or out-of-stock products'}</span>
                    </span>
                  </span>
                  <strong className="shrink-0 text-sm text-slate-950">{aiManagerQuery.data?.counts?.low_stock ?? 0}</strong>
                </Link>
              </>
            ) : (
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
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{enquiryTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isUsedCars
                  ? 'Buyers asking about vehicles, price, availability or visits.'
                  : isProductBusiness
                    ? 'Customers asking about products, price, delivery or payment.'
                    : 'New and warm leads, kept simple.'}
              </p>
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
                        {isProductBusiness ? 'WhatsApp' : 'Call'}
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
                {isSalesBusiness ? `Latest ${bookingLabel}` : 'Bookings and stays'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isUsedCars
                  ? 'Recent deals and buyer activity.'
                  : isProductBusiness
                    ? 'Recent customer orders and payment value.'
                    : 'Recent bookings with the next arrival checks.'}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-[#0066FF]">
              <Link href={ordersHref}>
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
