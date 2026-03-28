'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  CalendarDays, Users, IndianRupee, Search, Loader2,
  BookOpen, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Phone, Mail, BedDouble, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  booking_id: string
  booking_reference?: string
  service_id: string
  business_id?: string
  lead_id?: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  check_in_date: string
  check_out_date?: string
  slots_booked?: number
  total_price: string | number
  status: string
  payment_status?: string
  special_requests?: string
  created_at: string
  updated_at?: string
  services?: {
    name: string
    type?: string
    base_price?: string
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  confirmed:  { label: 'Confirmed',  bg: 'bg-green-50 border border-green-200',  text: 'text-green-700',  icon: CheckCircle2 },
  pending:    { label: 'Pending',    bg: 'bg-yellow-50 border border-yellow-200', text: 'text-yellow-700', icon: Clock },
  cancelled:  { label: 'Cancelled', bg: 'bg-red-50 border border-red-200',       text: 'text-red-600',    icon: XCircle },
  completed:  { label: 'Completed', bg: 'bg-blue-50 border border-blue-200',     text: 'text-blue-700',   icon: CheckCircle2 },
  no_show:    { label: 'No Show',   bg: 'bg-slate-100 border border-slate-200',  text: 'text-slate-600',  icon: AlertCircle },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

const PAYMENT_CONFIG: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Paid',    cls: 'bg-green-50 text-green-700 border border-green-200' },
  unpaid:  { label: 'Unpaid',  cls: 'bg-red-50 text-red-600 border border-red-200' },
  pending: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  partial: { label: 'Partial', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
  refunded:{ label: 'Refunded',cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="animate-pulse grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 border-b border-slate-100 last:border-0">
      <div className="space-y-1.5">
        <div className="h-3.5 w-28 rounded bg-slate-200" />
        <div className="h-3 w-20 rounded bg-slate-100" />
      </div>
      <div className="h-3.5 w-24 rounded bg-slate-100" />
      <div className="h-3.5 w-20 rounded bg-slate-100" />
      <div className="h-6 w-20 rounded-full bg-slate-200" />
      <div className="h-6 w-16 rounded-full bg-slate-100" />
    </div>
  )
}

// ── Booking Row ───────────────────────────────────────────────────────────────

function BookingRow({ booking }: { booking: Booking }) {
  const [expanded, setExpanded] = useState(false)
  const paymentCfg = PAYMENT_CONFIG[booking.payment_status ?? 'pending']
  const amount = typeof booking.total_price === 'string' ? parseFloat(booking.total_price) || 0 : booking.total_price
  const serviceName = booking.services?.name ?? 'Service'

  const nights = booking.check_out_date
    ? Math.max(1, Math.round((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / 86400000))
    : null

  return (
    <>
      <div
        className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 items-center px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Guest */}
        <div className="min-w-0">
          <p className="font-bold text-[13px] text-[#4B4B4B] truncate">{booking.customer_name}</p>
          <p className="text-[11px] text-[#6E6E6E] mt-0.5 truncate">{booking.customer_email ?? booking.customer_phone ?? '—'}</p>
        </div>

        {/* Service + dates */}
        <div className="min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <BedDouble className="h-3 w-3 text-[#0066FF] flex-shrink-0" />
            <p className="text-[12px] font-semibold text-[#4B4B4B] truncate">{serviceName}</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#6E6E6E]">
            <CalendarDays className="h-3 w-3 flex-shrink-0" />
            {fmtDate(booking.check_in_date)}
            {booking.check_out_date && <> — {fmtDate(booking.check_out_date)}</>}
            {nights && <span className="ml-1 text-[10px] text-[#989898]">({nights}n)</span>}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <p className="font-bold text-[13px] text-[#4B4B4B] flex items-center gap-0.5">
            <IndianRupee className="h-3 w-3 text-[#0066FF]" />{fmt(amount).replace('₹', '')}
          </p>
          {booking.payment_status && (
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentCfg?.cls ?? ''}`}>
              {paymentCfg?.label ?? booking.payment_status}
            </span>
          )}
        </div>

        {/* Status */}
        <StatusBadge status={booking.status} />

        {/* Expand toggle */}
        <button className="text-[#6E6E6E] hover:text-[#0066FF] transition-colors p-1">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
          <div>
            <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider mb-1">Booking Ref</p>
            <p className="font-mono text-[#4B4B4B] text-[11px] break-all">{booking.booking_reference ?? booking.booking_id}</p>
          </div>
          {booking.customer_phone && (
            <div>
              <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider mb-1">Phone</p>
              <p className="flex items-center gap-1 text-[#4B4B4B]"><Phone className="h-3 w-3" />{booking.customer_phone}</p>
            </div>
          )}
          {booking.customer_email && (
            <div>
              <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider mb-1">Email</p>
              <p className="flex items-center gap-1 text-[#4B4B4B]"><Mail className="h-3 w-3" />{booking.customer_email}</p>
            </div>
          )}
          {booking.slots_booked && (
            <div>
              <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider mb-1">Slots Booked</p>
              <p className="flex items-center gap-1 text-[#4B4B4B]"><Users className="h-3 w-3" />{booking.slots_booked}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider mb-1">Booked</p>
            <p className="text-[#4B4B4B]">{fmtRelative(booking.created_at)}</p>
          </div>
          {booking.special_requests && (
            <div className="col-span-2">
              <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider mb-1">Special Requests</p>
              <p className="text-[#6E6E6E]">{booking.special_requests}</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ACCENT = '#0066FF'
const STATUS_FILTERS = ['all', 'confirmed', 'pending', 'completed', 'cancelled']

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await apiClient.get('/inventory/bookings')
      const body = res.data as unknown
      const list: Booking[] = Array.isArray(body)
        ? body
        : Array.isArray((body as { data?: unknown }).data)
        ? (body as { data: Booking[] }).data
        : []
      setBookings(list)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = bookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      b.customer_name.toLowerCase().includes(q) ||
      b.customer_email?.toLowerCase().includes(q) ||
      b.customer_phone?.includes(q) ||
      b.services?.name?.toLowerCase().includes(q) ||
      b.booking_reference?.toLowerCase().includes(q) ||
      b.booking_id.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  // Stats
  const parsePrice = (p: string | number) => typeof p === 'string' ? parseFloat(p) || 0 : p
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    revenue: bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + parsePrice(b.total_price), 0),
  }

  return (
    <DashboardLayout>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.012)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-70" />

      <div className="relative pb-12 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                <BookOpen className="h-3 w-3" />
                Inventory
              </span>
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#4B4B4B]">Bookings</h1>
            <p className="text-[13px] text-[#6E6E6E] mt-0.5">All guest bookings across your services</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-4 py-2.5 text-[13px] font-bold text-[#4B4B4B] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Stats strip ── */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: stats.total, color: '#4B4B4B', icon: BookOpen },
              { label: 'Confirmed', value: stats.confirmed, color: '#16A34A', icon: CheckCircle2 },
              { label: 'Pending', value: stats.pending, color: '#D97706', icon: Clock },
              { label: 'Total Revenue', value: fmt(stats.revenue), color: ACCENT, icon: IndianRupee },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                    <p className="text-[12px] text-[#6E6E6E] font-medium">{s.label}</p>
                  </div>
                  <p className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#989898]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by guest name, email, phone, or service…"
              className="h-10 w-full rounded-full border border-[#E5E5E5] bg-white pl-9 pr-4 text-[13px] text-[#4B4B4B] placeholder:text-[#989898] focus:outline-none focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors"
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold transition-all capitalize ${
                  statusFilter === f
                    ? 'text-white shadow-sm'
                    : 'border border-[#E5E5E5] text-[#6E6E6E] bg-white hover:border-[#0066FF] hover:text-[#0066FF]'
                }`}
                style={statusFilter === f ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` } : {}}
              >
                {f === 'all' ? `All (${bookings.length})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">

          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 px-5 py-3 bg-[#F9F9F9] border-b border-slate-100">
            <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider">Guest</p>
            <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider">Service & Dates</p>
            <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider">Amount</p>
            <p className="text-[11px] font-bold text-[#989898] uppercase tracking-wider">Status</p>
            <div />
          </div>

          {loading ? (
            <div>
              {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${ACCENT}10` }}>
                <BookOpen className="h-7 w-7" style={{ color: ACCENT }} />
              </div>
              <p className="font-bold text-[#4B4B4B]">
                {search || statusFilter !== 'all' ? 'No bookings match your filter' : 'No bookings yet'}
              </p>
              <p className="text-[13px] text-[#6E6E6E]">
                {search || statusFilter !== 'all' ? 'Try a different search or status filter' : 'Bookings will appear here once guests start booking your services'}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map(b => <BookingRow key={b.booking_id} booking={b} />)}
            </div>
          )}
        </div>

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="text-[12px] text-[#989898] text-center">
            Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </p>
        )}

      </div>
    </DashboardLayout>
  )
}
