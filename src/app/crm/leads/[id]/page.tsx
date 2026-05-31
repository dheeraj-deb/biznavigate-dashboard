'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  Phone,
  ReceiptText,
  User,
  Users,
} from 'lucide-react'

interface LeadContext {
  check_in?: string
  check_out?: string
  requested_date?: string
  guest_count?: number | string
  guests?: number | string
  item_name?: string
  property_name?: string
  room_preference?: string
  special_requests?: string
  [key: string]: unknown
}

interface LeadDetail {
  lead_id: string
  name?: string
  phone?: string
  channel?: string
  source?: string
  status?: string
  lead_type?: string
  lead_quality?: string
  context?: LeadContext
  conversation_id?: string
  followup_at?: string
  updated_at?: string
  created_at?: string
}

interface LeadEvent {
  id?: string
  type?: string
  title?: string
  description?: string
  message?: string
  created_at?: string
  timestamp?: string
}

interface ConversationMessage {
  id?: string
  sender_type?: string
  role?: string
  sender_name?: string
  message_text?: string
  content?: string
  timestamp?: string
  created_at?: string
}

interface Booking {
  order_id?: string
  booking_id?: string
  status?: string
  delivery_status?: string
  payment_status?: string
  total_amount?: string | number
  total_price?: string | number
  created_at?: string
  check_in_date?: string
  check_out_date?: string
  items?: Array<{
    item_name?: string
    guest_name?: string
    check_in?: string
    check_out?: string
    num_guests?: number
  }>
}

function unwrap(value: any) {
  return value?.data?.data ?? value?.data ?? value
}

function listFrom(value: any, keys: string[]) {
  const payload = unwrap(value)
  if (Array.isArray(payload)) return payload
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key]
  }
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function normalizeLead(raw: any): LeadDetail {
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
    lead_type: raw.lead_type ?? raw.intent_type,
    lead_quality: raw.lead_quality ?? raw.category,
    context,
    conversation_id: raw.conversation_id ?? context.conversation_id,
    followup_at: raw.followup_at ?? raw.follow_up_date,
    updated_at: raw.updated_at ?? raw.created_at,
    created_at: raw.created_at,
  }
}

function displayName(lead?: LeadDetail | null) {
  return lead?.name?.trim() || lead?.phone || 'Guest enquiry'
}

function sourceLabel(lead?: LeadDetail | null) {
  const raw = (lead?.channel ?? lead?.source ?? 'website').replace(/_/g, ' ')
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function simpleStatus(status?: string) {
  const normalized = (status ?? 'new').toLowerCase()
  if (['booked', 'won', 'converted'].includes(normalized)) return 'Booked'
  if (['lost', 'cancelled', 'canceled'].includes(normalized)) return 'Lost / Cancelled'
  if (['contacted', 'active', 'qualified', 'quoted', 'interested'].includes(normalized)) return 'In conversation'
  return 'New enquiry'
}

function formatDate(date?: string) {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(date?: string) {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMoney(value?: string | number) {
  if (value == null || value === '') return ''
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount)) return String(value)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function contextRows(context?: LeadContext) {
  if (!context) return []
  const rows = [
    {
      label: 'Dates',
      value: context.check_in || context.check_out
        ? `${formatDate(String(context.check_in ?? context.requested_date ?? ''))}${context.check_out ? ` to ${formatDate(String(context.check_out))}` : ''}`
        : '',
      icon: CalendarDays,
    },
    {
      label: 'Guests',
      value: context.guest_count ?? context.guests,
      icon: Users,
    },
    {
      label: 'Interested in',
      value: context.item_name ?? context.property_name ?? context.room_preference,
      icon: ReceiptText,
    },
    {
      label: 'Notes',
      value: context.special_requests,
      icon: MessageCircle,
    },
  ]

  return rows.filter((row) => row.value != null && row.value !== '')
}

function bookingTitle(booking: Booking) {
  return booking.items?.[0]?.item_name ?? 'Booking'
}

function bookingStatus(booking: Booking) {
  return booking.status ?? booking.delivery_status ?? 'pending'
}

function bookingDate(booking: Booking) {
  const item = booking.items?.[0]
  const checkIn = item?.check_in ?? booking.check_in_date
  const checkOut = item?.check_out ?? booking.check_out_date
  if (!checkIn && !checkOut) return ''
  return `${formatDate(checkIn)}${checkOut ? ` to ${formatDate(checkOut)}` : ''}`
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const leadId = params.id

  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [events, setEvents] = useState<LeadEvent[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const loadLead = useCallback(async () => {
    const res = await apiClient.get(`/leads/${leadId}`)
    return normalizeLead(unwrap(res))
  }, [leadId])

  const loadEvents = useCallback(async () => {
    const res = await apiClient.get(`/leads/${leadId}/events`)
    return listFrom(res, ['events']) as LeadEvent[]
  }, [leadId])

  const loadBookings = useCallback(async () => {
    try {
      const res = await apiClient.get('/bookings', { params: { leadId } })
      const found = listFrom(res, ['bookings', 'orders']) as Booking[]
      if (found.length > 0) return found
    } catch {}

    try {
      const res = await apiClient.get('/hospitality-bookings', { params: { lead_id: leadId } })
      return listFrom(res, ['bookings', 'orders']) as Booking[]
    } catch {
      return []
    }
  }, [leadId])

  const loadMessages = useCallback(async (currentLead: LeadDetail) => {
    let conversationId = currentLead.conversation_id

    if (!conversationId) {
      try {
        const res = await apiClient.get('/leads/inbox/conversations', { params: { leadId } })
        const conversations = listFrom(res, ['conversations'])
        conversationId = conversations[0]?.conversation_id ?? conversations[0]?.id
      } catch {}
    }

    if (!conversationId) return []

    const res = await apiClient.get(`/leads/inbox/conversations/${conversationId}/messages`)
    return listFrom(res, ['messages']) as ConversationMessage[]
  }, [leadId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const currentLead = await loadLead()
        if (cancelled) return
        setLead(currentLead)

        const [nextEvents, nextBookings, nextMessages] = await Promise.all([
          loadEvents().catch(() => []),
          loadBookings().catch(() => []),
          loadMessages(currentLead).catch(() => []),
        ])

        if (cancelled) return
        setEvents(nextEvents)
        setBookings(nextBookings)
        setMessages(nextMessages)
      } catch {
        toast.error('Could not load enquiry')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [loadBookings, loadEvents, loadLead, loadMessages])

  const rows = useMemo(() => contextRows(lead?.context), [lead?.context])
  const isBooked = bookings.length > 0 || ['booked', 'won', 'converted'].includes((lead?.status ?? '').toLowerCase())

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-slate-500">Enquiry not found.</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push('/crm/leads')}>
            Back to enquiries
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-5 pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/crm/leads')} className="mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{displayName(lead)}</h1>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {simpleStatus(lead.status)}
                </span>
                {isBooked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Booking found
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {sourceLabel(lead)} enquiry {lead.updated_at ? `updated ${formatDateTime(lead.updated_at)}` : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {lead.phone && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank')}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            )}
            <Button
              className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]"
              onClick={() => router.push(
                lead.conversation_id
                  ? `/crm/inbox?conversation=${lead.conversation_id}`
                  : `/crm/inbox?phone=${encodeURIComponent(lead.phone ?? '')}`,
              )}
            >
              <MessageCircle className="h-4 w-4" />
              Open chat
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="text-base font-bold text-slate-950">Customer info</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="font-semibold text-slate-900">{displayName(lead)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-semibold text-slate-900">{lead.phone || 'Not shared yet'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-base font-bold text-slate-950">Enquiry details</h2>
              {rows.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No stay details yet. This may just be an initial message.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {rows.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3 rounded-md bg-slate-50 p-3">
                      <Icon className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="font-semibold text-slate-900">{String(value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-base font-bold text-slate-950">Conversation</h2>
              {messages.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No messages found yet.</p>
              ) : (
                <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-md bg-slate-50 p-3">
                  {messages.map((message, index) => {
                    const fromGuest = ['lead', 'user', 'customer'].includes((message.sender_type ?? message.role ?? '').toLowerCase())
                    const text = message.message_text ?? message.content ?? ''
                    return (
                      <div key={message.id ?? index} className={`flex ${fromGuest ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                          fromGuest ? 'bg-white text-slate-900' : 'bg-[#0066FF] text-white'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{text || 'Message'}</p>
                          <p className={`mt-1 text-[11px] ${fromGuest ? 'text-slate-400' : 'text-blue-100'}`}>
                            {formatDateTime(message.timestamp ?? message.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="text-base font-bold text-slate-950">Related bookings</h2>
              {bookings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No booking is linked to this enquiry yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {bookings.map((booking, index) => (
                    <div key={booking.order_id ?? booking.booking_id ?? index} className="rounded-md border border-green-100 bg-green-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-green-950">{bookingTitle(booking)}</p>
                          {bookingDate(booking) && (
                            <p className="mt-1 text-sm text-green-800">{bookingDate(booking)}</p>
                          )}
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold capitalize text-green-700">
                          {bookingStatus(booking)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-green-800">{booking.payment_status ?? 'Payment status pending'}</span>
                        <strong className="text-green-950">{formatMoney(booking.total_amount ?? booking.total_price)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-base font-bold text-slate-950">Timeline</h2>
              {events.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No timeline activity yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id ?? index} className="flex gap-3">
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0066FF]">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {event.title ?? event.type ?? 'Activity'}
                        </p>
                        {(event.description || event.message) && (
                          <p className="mt-0.5 text-sm text-slate-600">{event.description ?? event.message}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(event.created_at ?? event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
