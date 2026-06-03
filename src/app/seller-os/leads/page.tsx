'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MessageCircle,
  PackageCheck,
  Phone,
  Search,
  ShieldAlert,
  ShoppingBag,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  SellerLeadCard,
  SellerLeadStage,
  useSellerLeads,
  useUpdateSellerLeadStatus,
} from '@/hooks/use-seller-os'

const STAGE_ICONS: Record<string, any> = {
  all: UserPlus,
  new: UserPlus,
  ai_chatting: Bot,
  stock_held: PackageCheck,
  payment_waiting: CreditCard,
  needs_owner: ShieldAlert,
  won: CheckCircle2,
  lost: XCircle,
}

function money(value?: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num <= 0) return 'Rs 0'
  return `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num)}`
}

function sourceLabel(source?: string) {
  const value = (source || 'whatsapp').replace(/_/g, ' ')
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function timeAgo(date?: string) {
  if (!date) return 'Recently'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Recently'
  const mins = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000))
  if (mins < 60) return `${mins || 1}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function stageClass(stage: string) {
  if (stage === 'needs_owner') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (stage === 'payment_waiting') return 'border-blue-200 bg-blue-50 text-[#0066FF]'
  if (stage === 'stock_held') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (stage === 'won') return 'border-green-200 bg-green-50 text-green-700'
  if (stage === 'lost') return 'border-slate-200 bg-slate-100 text-slate-600'
  if (stage === 'ai_chatting') return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  return 'border-slate-200 bg-white text-slate-700'
}

function priorityDot(priority?: string) {
  if (priority === 'high') return 'bg-rose-500'
  if (priority === 'medium') return 'bg-amber-500'
  return 'bg-slate-300'
}

function openChatHref(lead: SellerLeadCard) {
  if (lead.conversation_id) return `/crm/inbox?conversation=${lead.conversation_id}`
  if (lead.phone) return `/crm/inbox?phone=${encodeURIComponent(lead.phone)}`
  return '/crm/inbox'
}

function LeadRow({
  lead,
  onFollowUp,
  onClose,
  busy,
}: {
  lead: SellerLeadCard
  onFollowUp: (lead: SellerLeadCard) => void
  onClose: (lead: SellerLeadCard) => void
  busy?: boolean
}) {
  const StageIcon = STAGE_ICONS[lead.stage] || UserPlus
  const products = lead.interested_products ?? []
  const showPaymentDesk = Boolean(lead.active_hold || lead.pending_payment)

  return (
    <Card className="border-slate-200 p-4 shadow-sm transition-colors hover:border-[#0066FF]/40">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-md border ${stageClass(lead.stage)}`}>
              <StageIcon className="h-4 w-4" />
            </span>
            <h3 className="min-w-0 truncate text-base font-bold text-slate-950">
              {lead.customer_name || lead.phone || 'Customer'}
            </h3>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${stageClass(lead.stage)}`}>
              {lead.stage_label}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {sourceLabel(lead.source)}
            </span>
          </div>

          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <span className="flex items-center gap-2 min-w-0">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{lead.phone || 'No phone'}</span>
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              {timeAgo(lead.updated_at ?? lead.created_at)}
            </span>
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${priorityDot(lead.priority)}`} />
              {lead.next_action}
            </span>
          </div>

          {products.length ? (
            <div className="flex flex-wrap gap-2">
              {products.map((product) => (
                <span
                  key={product.product_id ?? product.name}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {product.name}
                  {product.quantity ? ` x ${product.quantity}` : ''}
                </span>
              ))}
            </div>
          ) : null}

          {lead.last_ai_action?.text ? (
            <div className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-indigo-700" />
                <p className="text-xs font-bold uppercase text-indigo-700">
                  {lead.last_ai_action.employee || 'AI employee'}
                </p>
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-indigo-950">{lead.last_ai_action.text}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Value</p>
              <p className="mt-1 font-bold text-slate-950">{money(lead.value)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Orders</p>
              <p className="mt-1 font-bold text-slate-950">{lead.order_count}</p>
            </div>
          </div>

          {lead.active_hold ? (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <strong>{lead.active_hold.product_name}</strong> held, qty {lead.active_hold.quantity}
            </div>
          ) : null}

          {lead.pending_payment ? (
            <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <strong>{money(lead.pending_payment.amount)}</strong> payment waiting
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
              <Link href={openChatHref(lead)}>
                <MessageCircle className="h-4 w-4" />
                Chat
              </Link>
            </Button>
            {showPaymentDesk ? (
              <Button asChild size="sm" variant="outline" className="gap-2 bg-white">
                <Link href="/seller-os/payments">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </Link>
              </Button>
            ) : null}
            {!['won', 'lost'].includes(lead.stage) ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-white"
                  disabled={busy}
                  onClick={() => onFollowUp(lead)}
                >
                  Follow up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-slate-500 hover:text-rose-700"
                  disabled={busy}
                  onClick={() => onClose(lead)}
                >
                  Close
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function SellerLeadsPage() {
  const [activeStage, setActiveStage] = useState<SellerLeadStage>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const leadsQuery = useSellerLeads({
    stage: activeStage,
    search: debouncedSearch || undefined,
    limit: 100,
  })
  const updateStatus = useUpdateSellerLeadStatus()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])

  const data = leadsQuery.data
  const summary = data?.summary
  const stages = data?.stages ?? []
  const leads = data?.leads ?? []

  const topStats = useMemo(() => [
    { label: 'Open', value: summary?.open ?? 0, icon: UserPlus, tone: 'bg-slate-100 text-slate-700' },
    { label: 'Needs owner', value: summary?.needs_owner ?? 0, icon: ShieldAlert, tone: 'bg-rose-50 text-rose-700' },
    { label: 'Stock held', value: summary?.stock_held ?? 0, icon: PackageCheck, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Payment', value: summary?.payment_waiting ?? 0, icon: CreditCard, tone: 'bg-blue-50 text-[#0066FF]' },
  ], [summary])

  function followUp(lead: SellerLeadCard) {
    updateStatus.mutate({
      lead_id: lead.lead_id,
      status: 'contacted',
      note: 'Marked for follow-up from Customer Enquiries',
    })
  }

  function closeLead(lead: SellerLeadCard) {
    updateStatus.mutate({
      lead_id: lead.lead_id,
      status: 'lost',
      reason: 'Closed from Customer Enquiries',
    })
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-[#0066FF]">Product seller</p>
                <h1 className="text-2xl font-bold text-slate-950">Customer Enquiries</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/seller-os">
                  <ShoppingBag className="h-4 w-4" />
                  Store Desk
                </Link>
              </Button>
              <Button asChild className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                <Link href="/crm/inbox">
                  <MessageCircle className="h-4 w-4" />
                  Inbox
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {topStats.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-md ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </Card>
            )
          })}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,360px)_1fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or phone"
                className="h-11 border-slate-200 bg-slate-50 pl-10 focus-visible:bg-white"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 xl:grid-cols-8">
              {stages.map((stage) => {
                const Icon = STAGE_ICONS[stage.key] || UserPlus
                const active = activeStage === stage.key
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => setActiveStage(stage.key)}
                    className={`rounded-md border px-3 py-2 text-left transition-colors ${
                      active
                        ? 'border-[#0066FF] bg-[#F7FAFF] text-[#0052CC]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">{stage.count}</span>
                    </div>
                    <p className="mt-1 truncate text-xs font-bold">{stage.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {leadsQuery.isLoading ? (
          <Card className="border-slate-200 p-10 text-center text-slate-500">
            <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#0066FF]" />
            Loading enquiries...
          </Card>
        ) : leads.length === 0 ? (
          <Card className="border-slate-200 p-10 text-center">
            <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-slate-300" />
            <p className="font-semibold text-slate-800">No enquiries here</p>
          </Card>
        ) : (
          <section className="space-y-3">
            {leads.map((lead) => (
              <LeadRow
                key={lead.lead_id}
                lead={lead}
                busy={updateStatus.isPending}
                onFollowUp={followUp}
                onClose={closeLead}
              />
            ))}
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/seller-os/payments"
              className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-[#0066FF]"
            >
              Payment Desk
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/seller-os"
              className="flex items-center justify-between rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700"
            >
              Stock Holds
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/ai-employees"
              className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
            >
              AI Employees
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
