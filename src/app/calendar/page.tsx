'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import {
  AlertCircle,
  BedDouble,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  IndianRupee,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'

type CalendarView = 'month' | 'week' | 'day'
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
}

interface BookingForm {
  service_id: string
  guest_name: string
  phone: string
  check_in: string
  check_out: string
  guests: string
  status: BookingStatus
  payment_status: PaymentStatus
  notes: string
  amount_paid: string
}

const STATUS_OPTIONS: BookingStatus[] = ['confirmed', 'pending', 'checked_in', 'checked_out', 'completed', 'no_show', 'cancelled']
const PAYMENT_OPTIONS: PaymentStatus[] = ['pending', 'unpaid', 'partial', 'paid', 'refunded']
const ACCENT = '#0066FF'
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value?: string) {
  if (!value) return new Date()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`)
  return new Date(value)
}

function dateInput(value?: string) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return localDateKey(new Date(value))
}

function nextDateInput(value: string) {
  return localDateKey(addDays(parseDate(value), 1))
}

function daysBetween(start?: string, end?: string) {
  if (!start || !end) return 1
  return Math.max(1, Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86_400_000))
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0)
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

function normalizeBooking(row: any): Booking {
  const room = row.rooms?.[0] ?? {}
  const guest = row.guests_list?.[0] ?? {}
  const metadata = row.metadata ?? {}
  const checkIn = row.check_in ?? metadata.check_in
  const checkOut = row.check_out ?? metadata.check_out

  return {
    booking_id: row.hospitality_booking_id ?? row.booking_id,
    booking_number: row.booking_number ?? row.legacy_order?.order_number,
    guest_name: guest.name ?? metadata.guest_name ?? row.customer?.name ?? row.lead?.name ?? 'Guest',
    phone: guest.phone ?? metadata.phone ?? row.customer?.phone ?? row.lead?.phone,
    room_name: room.item_name ?? metadata.item_name ?? 'Accommodation',
    room_id: room.item_id,
    check_in: checkIn,
    check_out: checkOut,
    guests: Number(row.guests ?? metadata.num_guests ?? 1),
    nights: Number(room.nights ?? metadata.nights ?? daysBetween(checkIn, checkOut)),
    total_amount: Number(row.total_amount ?? room.total_price ?? 0),
    amount_paid: metadata.amount_paid !== undefined ? Number(metadata.amount_paid) : undefined,
    status: (row.status ?? 'confirmed') as BookingStatus,
    payment_status: (row.payment_status ?? 'pending') as PaymentStatus,
    notes: row.notes ?? metadata.notes,
    source: row.source,
    created_at: row.created_at,
  }
}

function bookingTouchesDate(booking: Booking, day: Date) {
  const key = localDateKey(day)
  const checkIn = dateInput(booking.check_in)
  const checkOut = dateInput(booking.check_out)
  return key >= checkIn && key < checkOut
}

function bookingStartsOn(booking: Booking, day: Date) {
  return dateInput(booking.check_in) === localDateKey(day)
}

function statusColor(status: BookingStatus) {
  const map: Record<BookingStatus, string> = {
    confirmed: 'bg-green-600',
    pending: 'bg-amber-500',
    checked_in: 'bg-blue-600',
    checked_out: 'bg-indigo-600',
    completed: 'bg-slate-600',
    cancelled: 'bg-red-500',
    no_show: 'bg-zinc-500',
  }
  return map[status] ?? 'bg-slate-500'
}

function statusSoft(status: BookingStatus) {
  const map: Record<BookingStatus, string> = {
    confirmed: 'border-green-200 bg-green-50 text-green-800',
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    checked_in: 'border-blue-200 bg-blue-50 text-blue-800',
    checked_out: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    completed: 'border-slate-200 bg-slate-50 text-slate-800',
    cancelled: 'border-red-200 bg-red-50 text-red-800',
    no_show: 'border-zinc-200 bg-zinc-50 text-zinc-800',
  }
  return map[status] ?? map.confirmed
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
  initialDate,
  busy,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  booking?: Booking
  rooms: RoomOption[]
  initialDate?: string
  busy: boolean
  onClose: () => void
  onSubmit: (form: BookingForm) => Promise<void>
}) {
  const [form, setForm] = useState<BookingForm>(() => {
    if (booking) {
      return {
        service_id: booking.room_id ?? '',
        guest_name: booking.guest_name,
        phone: booking.phone ?? '',
        check_in: dateInput(booking.check_in),
        check_out: dateInput(booking.check_out),
        guests: String(booking.guests || 1),
        status: booking.status,
        payment_status: booking.payment_status,
        notes: booking.notes ?? '',
        amount_paid: booking.amount_paid !== undefined ? String(booking.amount_paid) : '',
      }
    }
    const start = initialDate ?? localDateKey(new Date())
    return {
      service_id: '',
      guest_name: '',
      phone: '',
      check_in: start,
      check_out: nextDateInput(start),
      guests: '1',
      status: 'confirmed',
      payment_status: 'pending',
      notes: '',
      amount_paid: '',
    }
  })

  const update = (key: keyof BookingForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#333]">{mode === 'create' ? 'Create Booking' : 'Update Booking'}</h2>
            <p className="text-[12px] text-[#777]">{mode === 'create' ? 'Calendar booking' : booking?.booking_number ?? booking?.booking_id}</p>
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
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Room">
                <select className={inputClass()} value={form.service_id} onChange={(e) => update('service_id', e.target.value)} required>
                  <option value="">Select room</option>
                  {rooms.map((room) => (
                    <option key={room.service_id} value={room.service_id}>
                      {room.name} {room.base_price ? `- ${money(room.base_price)}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Check-in">
                <input className={inputClass()} type="date" value={form.check_in} onChange={(e) => update('check_in', e.target.value)} required />
              </Field>
              <Field label="Check-out">
                <input className={inputClass()} type="date" min={form.check_in} value={form.check_out} onChange={(e) => update('check_out', e.target.value)} required />
              </Field>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Guests">
              <input className={inputClass()} type="number" min="1" value={form.guests} onChange={(e) => update('guests', e.target.value)} />
            </Field>
            <Field label="Booking Status">
              <select className={inputClass()} value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
            </Field>
            <Field label="Payment">
              <select className={inputClass()} value={form.payment_status} onChange={(e) => update('payment_status', e.target.value)}>
                {PAYMENT_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
            </Field>
            <Field label="Amount Paid">
              <input className={inputClass()} type="number" min="0" value={form.amount_paid} onChange={(e) => update('amount_paid', e.target.value)} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              className="min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-[#333] outline-none transition focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Arrival time, payment note, request..."
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

function BookingChip({ booking, compact, onClick }: { booking: Booking; compact?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`w-full rounded-md px-2 py-1 text-left text-white shadow-sm ${statusColor(booking.status)} ${compact ? 'text-[10px]' : 'text-[11px]'}`}
      title={`${booking.guest_name} - ${booking.room_name}`}
    >
      <span className="block truncate font-bold">{booking.guest_name}</span>
      {!compact && <span className="block truncate opacity-90">{booking.room_name}</span>}
    </button>
  )
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<RoomOption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [view, setView] = useState<CalendarView>('month')
  const [cursor, setCursor] = useState(new Date())
  const [roomFilter, setRoomFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; booking?: Booking; initialDate?: string } | null>(null)

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
      })).filter((room: RoomOption) => room.service_id))
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to load calendar')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visibleBookings = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter((booking) => {
      const roomMatch = roomFilter === 'all' || booking.room_id === roomFilter
      const statusMatch = statusFilter === 'all' || booking.status === statusFilter
      const searchMatch = !q ||
        booking.guest_name.toLowerCase().includes(q) ||
        booking.room_name.toLowerCase().includes(q) ||
        booking.phone?.includes(q) ||
        booking.booking_number?.toLowerCase().includes(q) ||
        booking.booking_id.toLowerCase().includes(q)
      return roomMatch && statusMatch && searchMatch
    })
  }, [bookings, roomFilter, search, statusFilter])

  const days = useMemo(() => {
    if (view === 'month') {
      return eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      })
    }
    if (view === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(cursor, { weekStartsOn: 1 }),
        end: endOfWeek(cursor, { weekStartsOn: 1 }),
      })
    }
    return [cursor]
  }, [cursor, view])

  const stats = useMemo(() => {
    const active = visibleBookings.filter((booking) => booking.status !== 'cancelled')
    const today = new Date()
    return {
      active: active.length,
      today: active.filter((booking) => bookingTouchesDate(booking, today)).length,
      arrivals: active.filter((booking) => bookingStartsOn(booking, today)).length,
      revenue: active.reduce((sum, booking) => sum + booking.total_amount, 0),
    }
  }, [visibleBookings])

  const periodLabel = view === 'month'
    ? format(cursor, 'MMMM yyyy')
    : view === 'week'
      ? `${format(days[0], 'd MMM')} - ${format(days[days.length - 1], 'd MMM yyyy')}`
      : format(cursor, 'EEEE, d MMM yyyy')

  const move = (direction: 'prev' | 'next') => {
    if (view === 'month') setCursor((date) => direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1))
    if (view === 'week') setCursor((date) => direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1))
    if (view === 'day') setCursor((date) => addDays(date, direction === 'prev' ? -1 : 1))
  }

  const createBooking = async (form: BookingForm) => {
    if (!form.service_id) {
      toast.error('Select a room')
      return
    }
    if (new Date(form.check_out) <= new Date(form.check_in)) {
      toast.error('Check-out must be after check-in')
      return
    }

    setBusyId('create')
    try {
      await apiClient.post('/hospitality-bookings', {
        service_id: form.service_id,
        check_in: form.check_in,
        check_out: form.check_out,
        guest_name: form.guest_name,
        phone: form.phone,
        num_guests: Number(form.guests) || 1,
        status: form.status,
        payment_status: form.payment_status,
        notes: form.notes,
        amount_paid: form.amount_paid ? Number(form.amount_paid) : undefined,
      })
      toast.success('Booking created')
      setModal(null)
      await load(true)
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to create booking')
    } finally {
      setBusyId(null)
    }
  }

  const updateBooking = async (bookingId: string, form: BookingForm) => {
    setBusyId(bookingId)
    try {
      const res = await apiClient.patch(`/hospitality-bookings/${bookingId}`, {
        guest_name: form.guest_name,
        phone: form.phone,
        guests: Number(form.guests) || 1,
        status: form.status,
        payment_status: form.payment_status,
        notes: form.notes,
        amount_paid: form.amount_paid ? Number(form.amount_paid) : 0,
      })
      const updated = normalizeBooking(unwrapOne(res))
      setBookings((current) => current.map((booking) => booking.booking_id === bookingId ? updated : booking))
      toast.success('Booking updated')
      setModal(null)
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to update booking')
    } finally {
      setBusyId(null)
    }
  }

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Cancel booking for ${booking.guest_name}? This releases the room slots.`)) return
    setBusyId(booking.booking_id)
    try {
      const res = await apiClient.patch(`/hospitality-bookings/${booking.booking_id}/cancel`)
      const updated = normalizeBooking(unwrapOne(res))
      setBookings((current) => current.map((item) => item.booking_id === booking.booking_id ? updated : item))
      toast.success('Booking cancelled')
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to cancel booking')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${ACCENT}12`, color: ACCENT }}>
              <Calendar className="h-3 w-3" />
              Calendar
            </span>
            <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#333]">Booking Calendar</h1>
            <p className="text-[13px] text-[#777]">Plan arrivals, stays, payments, and room occupancy by date.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-[#444] hover:border-[#0066FF] hover:text-[#0066FF] disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setModal({ mode: 'create', initialDate: localDateKey(cursor) })} className="inline-flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2.5 text-[13px] font-bold text-white">
              <Plus className="h-4 w-4" />
              New Booking
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: 'Active Bookings', value: stats.active, icon: CheckCircle2, color: '#16A34A' },
            { label: 'In House Today', value: stats.today, icon: BedDouble, color: '#0066FF' },
            { label: 'Arrivals Today', value: stats.arrivals, icon: Clock, color: '#D97706' },
            { label: 'Visible Revenue', value: money(stats.revenue), icon: IndianRupee, color: '#111827' },
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

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => move('prev')} className="rounded-lg border border-slate-200 p-2 text-[#555] hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCursor(new Date())} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-bold text-[#555] hover:bg-slate-50">
                Today
              </button>
              <button onClick={() => move('next')} className="rounded-lg border border-slate-200 p-2 text-[#555] hover:bg-slate-50">
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="ml-1">
                <h2 className="text-[20px] font-bold text-[#333]">{periodLabel}</h2>
                <p className="text-[12px] text-[#777]">
                  {view === 'month' ? 'Month overview' : view === 'week' ? 'Weekly planning' : 'Daily operations'}
                </p>
              </div>
            </div>

            <div className="flex overflow-hidden rounded-lg border border-slate-200 self-start xl:self-auto">
              {(['month', 'week', 'day'] as CalendarView[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={`px-4 py-2 text-[12px] font-bold capitalize ${view === item ? 'bg-[#0066FF] text-white' : 'bg-white text-[#555] hover:bg-slate-50'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <select className={inputClass()} value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
                <option value="all">All rooms</option>
                {rooms.map((room) => <option key={room.service_id} value={room.service_id}>{room.name}</option>)}
              </select>
              <select className={inputClass()} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | BookingStatus)}>
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
                <input className="h-10 w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest, room, phone..." />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] font-bold text-[#666]">
              {STATUS_OPTIONS.slice(0, 6).map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColor(status)}`} />
                  {titleCase(status)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="grid h-[560px] place-items-center text-[#777]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className={`grid border-b border-slate-100 bg-slate-50 ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                  {(view === 'month' ? WEEKDAYS : days.map((day) => format(day, view === 'day' ? 'EEEE, d MMM' : 'EEE d'))).map((label) => (
                    <div key={label} className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-[#777]">
                      {label}
                    </div>
                  ))}
                </div>
                <div className={`grid ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                  {days.map((day) => {
                    const dayBookings = visibleBookings.filter((booking) => bookingTouchesDate(booking, day))
                    const arrivals = visibleBookings.filter((booking) => bookingStartsOn(booking, day)).length
                    const isToday = isSameDay(day, new Date())
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => setModal({ mode: 'create', initialDate: localDateKey(day) })}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') setModal({ mode: 'create', initialDate: localDateKey(day) })
                        }}
                        role="button"
                        tabIndex={0}
                        className={`min-h-[128px] cursor-pointer border-b border-r border-slate-100 p-2 text-left transition hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0066FF] ${view === 'day' ? 'min-h-[560px]' : ''} ${!isSameMonth(day, cursor) && view === 'month' ? 'bg-slate-50/60 text-slate-400' : 'bg-white'}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className={`grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold ${isToday ? 'bg-[#0066FF] text-white' : 'text-[#444]'}`}>
                            {format(day, 'd')}
                          </span>
                          <span className="text-[10px] font-bold text-[#888]">{dayBookings.length} stay{dayBookings.length === 1 ? '' : 's'}</span>
                        </div>
                        {arrivals > 0 && <p className="mb-1 text-[10px] font-bold text-[#0066FF]">{arrivals} arrival{arrivals === 1 ? '' : 's'}</p>}
                        <div className="space-y-1">
                          {dayBookings.slice(0, view === 'month' ? 4 : 12).map((booking) => (
                            <BookingChip key={`${day.toISOString()}-${booking.booking_id}`} booking={booking} compact={view === 'month'} onClick={() => setModal({ mode: 'edit', booking })} />
                          ))}
                          {dayBookings.length > (view === 'month' ? 4 : 12) && (
                            <span className="block rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-[#666]">+{dayBookings.length - (view === 'month' ? 4 : 12)} more</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-[14px] font-bold text-[#333]">Selected Period</h3>
              <p className="mt-1 text-[12px] text-[#777]">{visibleBookings.length} visible bookings</p>
              <div className="mt-4 space-y-2">
                {STATUS_OPTIONS.map((status) => {
                  const count = visibleBookings.filter((booking) => booking.status === status).length
                  if (!count) return null
                  return (
                    <div key={status} className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-2 text-[#555]"><span className={`h-2.5 w-2.5 rounded-full ${statusColor(status)}`} />{titleCase(status)}</span>
                      <span className="font-bold text-[#333]">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-[14px] font-bold text-[#333]">Upcoming Arrivals</h3>
              <div className="mt-3 space-y-2">
                {visibleBookings
                  .filter((booking) => dateInput(booking.check_in) >= localDateKey(new Date()) && booking.status !== 'cancelled')
                  .sort((a, b) => dateInput(a.check_in).localeCompare(dateInput(b.check_in)))
                  .slice(0, 8)
                  .map((booking) => (
                    <button key={booking.booking_id} onClick={() => setModal({ mode: 'edit', booking })} className="w-full rounded-lg border border-slate-200 p-3 text-left hover:border-[#0066FF]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-[#333]">{booking.guest_name}</p>
                          <p className="truncate text-[11px] text-[#777]">{booking.room_name}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusSoft(booking.status)}`}>{titleCase(booking.status)}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-[#777]">{format(parseDate(booking.check_in), 'd MMM')} to {format(parseDate(booking.check_out), 'd MMM')} · {booking.guests} guest{booking.guests === 1 ? '' : 's'}</p>
                    </button>
                  ))}
                {visibleBookings.length === 0 && <p className="py-6 text-center text-[12px] text-[#888]">No bookings found</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {modal && (
        <BookingModal
          mode={modal.mode}
          booking={modal.booking}
          rooms={rooms}
          initialDate={modal.initialDate}
          busy={busyId === 'create' || busyId === modal.booking?.booking_id}
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
