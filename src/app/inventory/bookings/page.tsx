'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  IndianRupee,
  Loader2,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react'

type BookingStatus = 'confirmed' | 'pending' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'no_show'
type PaymentStatus = 'pending' | 'paid' | 'partial' | 'unpaid' | 'refunded'

interface RoomOption {
  service_id: string
  name: string
  base_price: number
}

interface Booking {
  booking_id: string
  booking_number?: string
  guest_name: string
  phone?: string
  room_name: string
  room_id?: string
  check_in: string
  check_out: string
  guests: number
  nights: number
  total_amount: number
  amount_paid?: number
  status: BookingStatus
  payment_status: PaymentStatus
  notes?: string
  source?: string
  created_at: string
  updated_at?: string
}

interface BookingFormState {
  service_id: string
  guest_name: string
  phone: string
  check_in: string
  check_out: string
  guests: string
  payment_status: PaymentStatus
  status: BookingStatus
  notes: string
  amount_paid: string
}

const ACCENT = '#0066FF'
const STATUS_OPTIONS: BookingStatus[] = ['confirmed', 'pending', 'checked_in', 'checked_out', 'completed', 'no_show', 'cancelled']
const PAYMENT_OPTIONS: PaymentStatus[] = ['pending', 'unpaid', 'partial', 'paid', 'refunded']

const EMPTY_FORM: BookingFormState = {
  service_id: '',
  guest_name: '',
  phone: '',
  check_in: '',
  check_out: '',
  guests: '1',
  payment_status: 'pending',
  status: 'confirmed',
  notes: '',
  amount_paid: '',
}

function unwrapList(payload: any): any[] {
  const body = payload?.data ?? payload
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  return []
}

function unwrapOne(payload: any): any {
  return payload?.data?.data ?? payload?.data ?? payload
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDateInput(value?: string) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return localDateKey(new Date(value))
}

function daysBetween(start?: string, end?: string) {
  if (!start || !end) return 1
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000))
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function normalizeBooking(row: any): Booking {
  const firstRoom = row.rooms?.[0] ?? {}
  const firstGuest = row.guests_list?.[0] ?? {}
  const metadata = row.metadata ?? {}
  const checkIn = row.check_in ?? metadata.check_in
  const checkOut = row.check_out ?? metadata.check_out

  return {
    booking_id: row.hospitality_booking_id ?? row.booking_id ?? row.order_id,
    booking_number: row.booking_number ?? row.legacy_order?.order_number,
    guest_name: firstGuest.name ?? metadata.guest_name ?? row.customer?.name ?? row.lead?.name ?? 'Guest',
    phone: firstGuest.phone ?? metadata.phone ?? row.customer?.phone ?? row.lead?.phone,
    room_name: firstRoom.item_name ?? metadata.item_name ?? 'Accommodation',
    room_id: firstRoom.item_id,
    check_in: checkIn,
    check_out: checkOut,
    guests: Number(row.guests ?? metadata.num_guests ?? 1),
    nights: Number(firstRoom.nights ?? metadata.nights ?? daysBetween(checkIn, checkOut)),
    total_amount: Number(row.total_amount ?? firstRoom.total_price ?? 0),
    amount_paid: metadata.amount_paid !== undefined ? Number(metadata.amount_paid) : undefined,
    status: (row.status ?? 'confirmed') as BookingStatus,
    payment_status: (row.payment_status ?? 'pending') as PaymentStatus,
    notes: row.notes ?? metadata.notes,
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const Icon = status === 'cancelled' ? XCircle : status === 'pending' ? Clock : status === 'no_show' ? AlertCircle : CheckCircle2
  const styles: Record<string, string> = {
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    checked_in: 'bg-blue-50 text-blue-700 border-blue-200',
    checked_out: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    completed: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    no_show: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status] ?? styles.pending}`}>
      <Icon className="h-3 w-3" />
      {titleCase(status)}
    </span>
  )
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<string, string> = {
    paid: 'bg-green-50 text-green-700 border-green-200',
    partial: 'bg-orange-50 text-orange-700 border-orange-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    unpaid: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-slate-100 text-slate-700 border-slate-200',
  }
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status] ?? styles.pending}`}>{titleCase(status)}</span>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#777]">{label}</span>
      {children}
    </label>
  )
}

function inputClass() {
  return 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-[#333] outline-none transition focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]'
}

function BookingModal({
  mode,
  booking,
  rooms,
  busy,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  booking?: Booking
  rooms: RoomOption[]
  busy: boolean
  onClose: () => void
  onSubmit: (form: BookingFormState) => Promise<void>
}) {
  const [form, setForm] = useState<BookingFormState>(() => booking ? {
    service_id: booking.room_id ?? '',
    guest_name: booking.guest_name,
    phone: booking.phone ?? '',
    check_in: toDateInput(booking.check_in),
    check_out: toDateInput(booking.check_out),
    guests: String(booking.guests || 1),
    payment_status: booking.payment_status,
    status: booking.status,
    notes: booking.notes ?? '',
    amount_paid: booking.amount_paid !== undefined ? String(booking.amount_paid) : '',
  } : EMPTY_FORM)

  const update = (key: keyof BookingFormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#333]">{mode === 'create' ? 'Create Booking' : 'Update Booking'}</h2>
            <p className="text-[12px] text-[#777]">{mode === 'create' ? 'Manual booking from dashboard' : booking?.booking_number ?? booking?.booking_id}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#777] hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(form)
          }}
          className="space-y-5 p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Guest Name">
              <input className={inputClass()} value={form.guest_name} onChange={(e) => update('guest_name', e.target.value)} required />
            </Field>
            <Field label="Phone">
              <input className={inputClass()} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9195..." />
            </Field>
          </div>

          {mode === 'create' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Room">
                <select className={inputClass()} value={form.service_id} onChange={(e) => update('service_id', e.target.value)} required>
                  <option value="">Select room</option>
                  {rooms.map((room) => (
                    <option key={room.service_id} value={room.service_id}>
                      {room.name} {room.base_price ? `- ${formatCurrency(room.base_price)}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Guests">
                <input className={inputClass()} type="number" min="1" value={form.guests} onChange={(e) => update('guests', e.target.value)} />
              </Field>
            </div>
          )}

          {mode === 'create' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Check-in">
                <input className={inputClass()} type="date" value={form.check_in} onChange={(e) => update('check_in', e.target.value)} required />
              </Field>
              <Field label="Check-out">
                <input className={inputClass()} type="date" min={form.check_in} value={form.check_out} onChange={(e) => update('check_out', e.target.value)} required />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Guests">
                <input className={inputClass()} type="number" min="1" value={form.guests} onChange={(e) => update('guests', e.target.value)} />
              </Field>
              <Field label="Booking Status">
                <select className={inputClass()} value={form.status} onChange={(e) => update('status', e.target.value)}>
                  {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </Field>
              <Field label="Payment Status">
                <select className={inputClass()} value={form.payment_status} onChange={(e) => update('payment_status', e.target.value)}>
                  {PAYMENT_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </Field>
            </div>
          )}

          {mode === 'create' && (
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Booking Status">
                <select className={inputClass()} value={form.status} onChange={(e) => update('status', e.target.value)}>
                  {STATUS_OPTIONS.filter((s) => s !== 'cancelled').map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </Field>
              <Field label="Payment Status">
                <select className={inputClass()} value={form.payment_status} onChange={(e) => update('payment_status', e.target.value)}>
                  {PAYMENT_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </Field>
              <Field label="Amount Paid">
                <input className={inputClass()} type="number" min="0" value={form.amount_paid} onChange={(e) => update('amount_paid', e.target.value)} />
              </Field>
            </div>
          )}

          <Field label="Notes">
            <textarea
              className="min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-[#333] outline-none transition focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Payment note, special request, arrival time..."
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-bold text-[#555] hover:bg-slate-50">
              Close
            </button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Booking' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BookingRow({
  booking,
  saving,
  onEdit,
  onQuickUpdate,
  onCancel,
}: {
  booking: Booking
  saving: boolean
  onEdit: () => void
  onQuickUpdate: (patch: Partial<BookingFormState>) => void
  onCancel: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1.4fr_1fr_1fr_auto] md:items-center">
        <button className="min-w-0 text-left" onClick={() => setOpen((value) => !value)}>
          <p className="truncate text-[13px] font-bold text-[#333]">{booking.guest_name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[#777]">
            <Phone className="h-3 w-3" />
            {booking.phone ?? 'No phone'}
          </p>
        </button>

        <button className="min-w-0 text-left" onClick={() => setOpen((value) => !value)}>
          <p className="flex items-center gap-1 truncate text-[13px] font-semibold text-[#444]">
            <BedDouble className="h-3.5 w-3.5 text-[#0066FF]" />
            {booking.room_name}
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[#777]">
            <CalendarDays className="h-3 w-3" />
            {formatDate(booking.check_in)} to {formatDate(booking.check_out)} ({booking.nights}n)
          </p>
        </button>

        <div>
          <p className="text-[13px] font-bold text-[#333]">{formatCurrency(booking.total_amount)}</p>
          {booking.amount_paid !== undefined && <p className="text-[11px] text-[#777]">Paid {formatCurrency(booking.amount_paid)}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          <PaymentBadge status={booking.payment_status} />
        </div>

        <div className="flex items-center justify-end gap-1">
          <button onClick={onEdit} className="rounded-lg p-2 text-[#666] hover:bg-blue-50 hover:text-[#0066FF]" title="Edit booking">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setOpen((value) => !value)} className="rounded-lg p-2 text-[#666] hover:bg-slate-100" title="View details">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="bg-slate-50 px-4 py-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#888]">Booking</p>
              <p className="mt-1 break-all font-mono text-[12px] text-[#444]">{booking.booking_number ?? booking.booking_id}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#888]">Guests</p>
              <p className="mt-1 flex items-center gap-1 text-[13px] text-[#444]"><Users className="h-3.5 w-3.5" />{booking.guests}</p>
            </div>
            <Field label="Status">
              <select className={inputClass()} value={booking.status} disabled={saving || booking.status === 'cancelled'} onChange={(e) => onQuickUpdate({ status: e.target.value as BookingStatus })}>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
            </Field>
            <Field label="Payment">
              <select className={inputClass()} value={booking.payment_status} disabled={saving} onChange={(e) => onQuickUpdate({ payment_status: e.target.value as PaymentStatus })}>
                {PAYMENT_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
            </Field>
          </div>

          {booking.notes && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#888]">Notes</p>
              <p className="mt-1 text-[13px] text-[#555]">{booking.notes}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-[#888]">Created {formatDate(booking.created_at)} via {booking.source ?? 'dashboard'}</p>
            <div className="flex gap-2">
              <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-[#444] hover:border-[#0066FF] hover:text-[#0066FF]">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              {booking.status !== 'cancelled' && (
                <button onClick={onCancel} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" /> Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<RoomOption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all')
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; booking?: Booking } | null>(null)

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const [bookingRes, roomRes] = await Promise.all([
        apiClient.get('/hospitality-bookings', { params: { limit: 100 } }),
        apiClient.get('/catalog', { params: { item_type: 'accommodation', limit: 100 } }),
      ])

      setBookings(unwrapList(bookingRes).map(normalizeBooking))
      setRooms(unwrapList(roomRes).map((item: any) => ({
        service_id: item.item_id ?? item.service_id,
        name: item.name,
        base_price: Number(item.base_price ?? 0),
      })).filter((item: RoomOption) => item.service_id))
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to load bookings')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
      const matchesSearch = !q ||
        booking.guest_name.toLowerCase().includes(q) ||
        booking.phone?.includes(q) ||
        booking.room_name.toLowerCase().includes(q) ||
        booking.booking_number?.toLowerCase().includes(q) ||
        booking.booking_id.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [bookings, search, statusFilter])

  const stats = useMemo(() => {
    const active = bookings.filter((booking) => booking.status !== 'cancelled')
    const today = localDateKey(new Date())
    return {
      total: bookings.length,
      active: active.length,
      arriving: active.filter((booking) => toDateInput(booking.check_in) === today).length,
      pendingPayment: active.filter((booking) => booking.payment_status !== 'paid' && booking.payment_status !== 'refunded').length,
      revenue: active.reduce((sum, booking) => sum + booking.total_amount, 0),
    }
  }, [bookings])

  const createBooking = async (form: BookingFormState) => {
    if (!form.service_id) {
      toast.error('Select a room')
      return
    }
    if (!form.check_in || !form.check_out) {
      toast.error('Select check-in and check-out')
      return
    }
    if (new Date(form.check_out) <= new Date(form.check_in)) {
      toast.error('Check-out must be after check-in')
      return
    }

    setSavingId('create')
    try {
      await apiClient.post('/hospitality-bookings', {
        service_id: form.service_id,
        check_in: form.check_in,
        check_out: form.check_out,
        guest_name: form.guest_name,
        phone: form.phone,
        num_guests: Number(form.guests) || 1,
        payment_status: form.payment_status,
        status: form.status,
        notes: form.notes,
        amount_paid: form.amount_paid ? Number(form.amount_paid) : undefined,
      })
      toast.success('Booking created')
      setModal(null)
      await load(true)
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to create booking')
    } finally {
      setSavingId(null)
    }
  }

  const updateBooking = async (bookingId: string, patch: Partial<BookingFormState>) => {
    setSavingId(bookingId)
    try {
      const payload: any = {}
      if (patch.status !== undefined) payload.status = patch.status
      if (patch.payment_status !== undefined) payload.payment_status = patch.payment_status
      if (patch.guest_name !== undefined) payload.guest_name = patch.guest_name
      if (patch.phone !== undefined) payload.phone = patch.phone
      if (patch.guests !== undefined) payload.guests = Number(patch.guests) || 1
      if (patch.notes !== undefined) payload.notes = patch.notes
      if (patch.amount_paid !== undefined) payload.amount_paid = patch.amount_paid ? Number(patch.amount_paid) : 0

      const res = await apiClient.patch(`/hospitality-bookings/${bookingId}`, payload)
      const updated = normalizeBooking(unwrapOne(res))
      setBookings((current) => current.map((booking) => booking.booking_id === bookingId ? updated : booking))
      toast.success('Booking updated')
      setModal(null)
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to update booking')
    } finally {
      setSavingId(null)
    }
  }

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Cancel booking for ${booking.guest_name}? This will release booked room slots.`)) return
    setSavingId(booking.booking_id)
    try {
      const res = await apiClient.patch(`/hospitality-bookings/${booking.booking_id}/cancel`)
      const updated = normalizeBooking(unwrapOne(res))
      setBookings((current) => current.map((item) => item.booking_id === booking.booking_id ? updated : item))
      toast.success('Booking cancelled')
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to cancel booking')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${ACCENT}12`, color: ACCENT }}>
              <CalendarDays className="h-3 w-3" />
              Booking Operations
            </span>
            <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#333]">Bookings</h1>
            <p className="text-[13px] text-[#777]">Create, update, collect payments, and cancel guest bookings from one place.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-[#444] hover:border-[#0066FF] hover:text-[#0066FF] disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setModal({ mode: 'create' })} className="inline-flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm">
              <Plus className="h-4 w-4" />
              New Booking
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {[
            { label: 'Total', value: stats.total, icon: CalendarDays, color: '#333' },
            { label: 'Active', value: stats.active, icon: CheckCircle2, color: '#16A34A' },
            { label: 'Arriving Today', value: stats.arriving, icon: BedDouble, color: '#0066FF' },
            { label: 'Payment Due', value: stats.pendingPayment, icon: AlertCircle, color: '#D97706' },
            { label: 'Revenue', value: formatCurrency(stats.revenue), icon: IndianRupee, color: '#111827' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[#777]">
                  <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                  {item.label}
                </div>
                <p className="mt-1 text-[21px] font-bold" style={{ color: item.color }}>{item.value}</p>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
              placeholder="Search guest, phone, room, booking id..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'confirmed', 'pending', 'checked_in', 'completed', 'cancelled'] as Array<'all' | BookingStatus>).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-bold capitalize transition ${
                  statusFilter === status ? 'bg-[#0066FF] text-white' : 'border border-slate-200 bg-white text-[#666] hover:border-[#0066FF] hover:text-[#0066FF]'
                }`}
              >
                {status === 'all' ? `All (${bookings.length})` : titleCase(status)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.2fr_1.4fr_1fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#888] md:grid">
            <span>Guest</span>
            <span>Room & Dates</span>
            <span>Amount</span>
            <span>Status</span>
            <span />
          </div>

          {loading ? (
            <div className="space-y-1 p-4">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-[14px] font-bold text-[#444]">No bookings found</p>
              <p className="mt-1 text-[13px] text-[#777]">Create a booking or adjust your filters.</p>
            </div>
          ) : (
            filtered.map((booking) => (
              <BookingRow
                key={booking.booking_id}
                booking={booking}
                saving={savingId === booking.booking_id}
                onEdit={() => setModal({ mode: 'edit', booking })}
                onQuickUpdate={(patch) => updateBooking(booking.booking_id, patch)}
                onCancel={() => cancelBooking(booking)}
              />
            ))
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-center text-[12px] text-[#888]">Showing {filtered.length} of {bookings.length} bookings</p>
        )}
      </div>

      {modal && (
        <BookingModal
          mode={modal.mode}
          booking={modal.booking}
          rooms={rooms}
          busy={savingId === 'create' || savingId === modal.booking?.booking_id}
          onClose={() => setModal(null)}
          onSubmit={(form) => modal.mode === 'create'
            ? createBooking(form)
            : updateBooking(modal.booking!.booking_id, form)
          }
        />
      )}
    </DashboardLayout>
  )
}
