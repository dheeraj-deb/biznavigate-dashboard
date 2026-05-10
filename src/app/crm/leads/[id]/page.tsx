'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth-store'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Camera,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  CalendarDays,
  Tent,
  ShoppingBag,
  Hotel,
  UserCheck,
  ShoppingCart,
  RefreshCw,
  Bot,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeadDetail {
  id: string
  first_name: string
  last_name: string
  name: string
  phone: string
  source: string
  status: string
  lead_quality: string | null
  intent_type: 'resort' | 'camping' | 'product' | null
  extracted_entities: Record<string, unknown>
  is_converted: boolean
  staff_notes: string
  assigned_to: string
  follow_up_date: string
  conversation_id: string | undefined
  created_at: string
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'agent'
  content: string
  timestamp: string
}

interface CatalogItem {
  id: string
  item_id?: string
  name: string
  price: number
  base_price?: number | string
  item_type?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLead(raw: any): LeadDetail {
  const first = raw.first_name ?? ''
  const last = raw.last_name ?? ''
  return {
    id: raw.lead_id ?? raw.id ?? '',
    first_name: first,
    last_name: last,
    name: [first, last].filter(Boolean).join(' ') || (raw.customer_name ?? raw.name ?? 'Unknown'),
    phone: raw.phone ?? raw.customer_phone ?? '',
    source: raw.source ?? 'whatsapp',
    status: raw.status ?? 'new',
    lead_quality: raw.lead_quality ?? raw.category ?? null,
    intent_type: raw.intent_type ?? null,
    extracted_entities: raw.extracted_entities ?? {},
    is_converted: raw.is_converted ?? false,
    staff_notes: raw.staff_notes ?? '',
    assigned_to: raw.assigned_to ?? '',
    follow_up_date: raw.follow_up_date ?? '',
    conversation_id: raw.conversation_id ?? undefined,
    created_at: raw.created_at ?? new Date().toISOString(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCatalogItem(raw: any): CatalogItem {
  const id = raw.item_id ?? raw.id ?? raw.product_id ?? ''
  const rawPrice = raw.base_price ?? raw.price ?? 0
  return {
    id,
    item_id: id,
    name: raw.name ?? 'Unnamed item',
    price: typeof rawPrice === 'string' ? parseFloat(rawPrice) || 0 : rawPrice,
    item_type: raw.item_type,
  }
}

const STATUS_FLOW = ['new', 'contacted', 'interested', 'converted', 'lost'] as const

function getStatusLabel(s: string, intentType?: string | null) {
  return s === 'new' ? 'New'
    : s === 'contacted' ? 'Contacted'
    : s === 'interested' ? 'Interested'
    : s === 'converted' ? (intentType === 'product' ? 'Sold ✓' : 'Converted ✓')
    : s === 'lost' ? 'Lost' : s
}

function getStatusStyle(s: string) {
  return s === 'new' ? 'bg-gray-100 text-gray-600 border border-gray-300'
    : s === 'contacted' ? 'bg-blue-100 text-blue-700 border border-blue-300'
    : s === 'interested' ? 'bg-orange-100 text-orange-700 border border-orange-300'
    : s === 'converted' ? 'bg-green-100 text-green-700 border border-green-300'
    : 'bg-red-100 text-red-500 border border-red-300'
}

function getQualityStyle(q: string) {
  return q === 'hot' ? 'bg-red-100 text-red-700' : q === 'warm' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
}

function getIntentIcon(intent: string | null) {
  if (intent === 'resort') return <Hotel className="h-4 w-4" />
  if (intent === 'camping') return <Tent className="h-4 w-4" />
  if (intent === 'product') return <ShoppingBag className="h-4 w-4" />
  return null
}

function getIntentLabel(intent: string | null) {
  return intent === 'resort' ? 'Resort' : intent === 'camping' ? 'Camping' : intent === 'product' ? 'Product' : '—'
}

function getSourceIcon(source: string) {
  if (source === 'instagram' || source === 'instagram_dm') return <Camera className="h-4 w-4" />
  if (source === 'whatsapp') return <MessageCircle className="h-4 w-4" />
  return <Globe className="h-4 w-4" />
}

// ── Detail Row Helper ─────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-gray-400 text-sm w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{children}</span>
    </div>
  )
}

// ── Enquiry Details (dynamic) ─────────────────────────────────────────────────

function EnquiryDetails({ lead }: { lead: LeadDetail }) {
  const raw = lead.extracted_entities
  const e = raw as Record<string, string | number | null | undefined>

  if (!raw || Object.keys(raw).length === 0) {
    return <p className="text-sm text-gray-400 italic">No enquiry details captured yet.</p>
  }

  if (lead.intent_type === 'resort' || lead.intent_type === 'camping') {
    return (
      <div>
        {e.check_in && <Row label="Check-in">{formatDate(String(e.check_in))}</Row>}
        {e.check_out && <Row label="Check-out">{formatDate(String(e.check_out))}</Row>}
        {e.guest_count && <Row label="Guests">{String(e.guest_count)} people</Row>}
        {e.room_preference && (
          <Row label={lead.intent_type === 'camping' ? 'Tent type' : 'Room type'}>{String(e.room_preference)}</Row>
        )}
        {e.special_requests && (
          <Row label="Requests">
            <span className="italic text-gray-600 dark:text-gray-400">&quot;{String(e.special_requests)}&quot;</span>
          </Row>
        )}
        {e.budget && <Row label="Budget"><span className="text-green-600 font-bold">₹{String(e.budget)}</span></Row>}
      </div>
    )
  }

  if (lead.intent_type === 'product') {
    return (
      <div>
        {e.product_name && <Row label="Product">{String(e.product_name)}</Row>}
        {e.quantity && <Row label="Quantity">{String(e.quantity)}</Row>}
        {e.delivery_city && <Row label="Delivery city">{String(e.delivery_city)}</Row>}
        {e.budget && <Row label="Budget"><span className="text-green-600 font-bold">₹{String(e.budget)}</span></Row>}
        {e.timeline && <Row label="Timeline">{String(e.timeline)}</Row>}
      </div>
    )
  }

  // Generic fallback — show all keys
  return (
    <div>
      {Object.entries(e).filter(([, v]) => v != null).map(([k, v]) => (
        <Row key={k} label={k.replace(/_/g, ' ')}>{String(v)}</Row>
      ))}
    </div>
  )
}

// ── WhatsApp Conversation Thread ──────────────────────────────────────────────

function ConversationThread({ lead }: { lead: LeadDetail }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [convId, setConvId] = useState<string | null>(lead.conversation_id ?? null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (cid: string) => {
    try {
      const res = await apiClient.get(`/inbox/conversations/${cid}/messages`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = (res as any).data
      const raw: any[] = Array.isArray(d) ? d : (d?.data ?? d?.messages ?? [])
      setMessages(raw as ConversationMessage[])
    } catch {
      // silently fail — fallback UI shown
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      try {
        let cid = lead.conversation_id ?? null

        if (!cid) {
          // Look up conversation by lead_id
          const res = await apiClient.get('/inbox/conversations', { params: { lead_id: lead.id } })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = (res as any).data
          const list: any[] = Array.isArray(d) ? d : (d?.data ?? d?.conversations ?? [])
          cid = list[0]?.id ?? list[0]?.conversation_id ?? null
          if (cid) setConvId(cid)
        }

        if (cid && !cancelled) await loadMessages(cid)
      } catch {
        // no conversation found
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [lead.id, lead.conversation_id, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function formatMsgTime(ts: string) {
    try {
      return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch { return '' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 min-h-[240px] flex flex-col items-center justify-center gap-2 text-center">
        <MessageSquare className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-400">No conversation history found.</p>
        {lead.phone && (
          <button
            onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
            className="text-xs text-[#25D366] hover:underline mt-1"
          >
            Start conversation on WhatsApp →
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="bg-[#e5ddd5] dark:bg-gray-900 rounded-xl overflow-hidden">
        {/* WA-style header */}
        <div className="bg-[#075e54] text-white px-3 py-2 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[#128c7e] flex items-center justify-center text-xs font-bold">
            {lead.first_name?.[0]?.toUpperCase() ?? 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{lead.name}</p>
            <p className="text-[10px] text-green-200 truncate">{lead.phone}</p>
          </div>
          {convId && (
            <button
              onClick={() => loadMessages(convId)}
              className="text-green-200 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-1.5 p-3 max-h-72 overflow-y-auto">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            const isAgent = msg.role === 'agent'
            return (
              <div key={msg.id} className={`flex items-end gap-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isUser && (
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-0.5 ${isAgent ? 'bg-blue-500' : 'bg-[#25D366]'}`}>
                    {isAgent ? 'A' : <Bot className="h-3 w-3" />}
                  </div>
                )}
                <div className={`max-w-[75%] rounded-xl px-3 py-2 shadow-sm ${
                  isUser
                    ? 'bg-[#dcf8c6] dark:bg-green-900/40 rounded-br-none'
                    : 'bg-white dark:bg-gray-800 rounded-bl-none'
                }`}>
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 text-right">{formatMsgTime(msg.timestamp)}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

// ── Create Booking Modal ──────────────────────────────────────────────────────

function CreateBookingModal({
  open,
  onClose,
  lead,
  businessId,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  lead: LeadDetail
  businessId: string
  onSuccess: () => void
}) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [qty, setQty] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingItems(true)
    apiClient.get('/catalog', { params: { businessId, limit: 100 } })
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = (res as any).data
        const raw: any[] = Array.isArray(d) ? d : (d?.data ?? d?.items ?? [])
        setItems(raw.map(normalizeCatalogItem))
      })
      .catch(() => toast.error('Failed to load catalog'))
      .finally(() => setLoadingItems(false))
  }, [open, businessId])

  function handleItemChange(id: string) {
    setSelectedId(id)
    const item = items.find((i) => i.id === id)
    if (item) setUnitPrice(item.price)
  }

  async function handleSubmit() {
    if (!selectedId) { toast.error('Select an item'); return }
    if (qty < 1) { toast.error('Quantity must be at least 1'); return }
    if (unitPrice <= 0) { toast.error('Enter a valid price'); return }

    setSubmitting(true)
    try {
      const total = qty * unitPrice
      await apiClient.post('/orders', {
        business_id: businessId,
        lead_id: lead.id,
        items: [{ item_id: selectedId, quantity: qty, unit_price: unitPrice }],
        total_amount: total,
        currency: 'INR',
      })
      toast.success('Booking created!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedItem = items.find((i) => i.id === selectedId)
  const total = qty * unitPrice

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Booking — {lead.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Item selector */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Select item</label>
            {loadingItems ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />Loading catalog...
              </div>
            ) : (
              <Select value={selectedId} onValueChange={handleItemChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Choose a product or service..." />
                </SelectTrigger>
                <SelectContent>
                  {items.length === 0 && (
                    <SelectItem value="__empty" disabled>No items found</SelectItem>
                  )}
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} — ₹{item.price.toLocaleString('en-IN')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Quantity</label>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Unit price (₹)</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Summary */}
          {selectedItem && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{selectedItem.name} × {qty}</span>
                <span>₹{(unitPrice * qty).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t pt-1 mt-1">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-gray-400">Lead: {lead.name} · {lead.phone}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedId}
            className="bg-[#0066FF] hover:bg-[#0052CC] text-white"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : 'Create Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { user } = useAuthStore()
  const businessId = user?.business_id ?? ''

  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editFollowUpDate, setEditFollowUpDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [markingConverted, setMarkingConverted] = useState(false)
  const [markingLost, setMarkingLost] = useState(false)
  const [showAssignInput, setShowAssignInput] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiClient.get(`/leads/${id}`)
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = res.data as any
        const raw = d?.data ?? d
        const normalized = normalizeLead(raw)
        setLead(normalized)
        setEditStatus(normalized.status)
        setEditNotes(normalized.staff_notes)
        setEditAssignedTo(normalized.assigned_to)
        setEditFollowUpDate(normalized.follow_up_date)
      })
      .catch(() => toast.error('Failed to load lead'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    setEditStatus(newStatus)
    setLead((prev) => prev ? { ...prev, status: newStatus } : prev)
    try {
      await apiClient.patch(`/leads/${id}`, { status: newStatus })
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleMarkConverted = async () => {
    setMarkingConverted(true)
    try {
      await apiClient.patch(`/leads/${id}`, { status: 'converted' })
      setLead((prev) => prev ? { ...prev, status: 'converted' } : prev)
      setEditStatus('converted')
      toast.success(lead?.intent_type === 'product' ? 'Marked as Sold ✓' : 'Lead converted ✓')
    } catch {
      toast.error('Failed to update')
    } finally {
      setMarkingConverted(false)
    }
  }

  const handleMarkLost = async () => {
    setMarkingLost(true)
    try {
      await apiClient.patch(`/leads/${id}`, { status: 'lost' })
      setLead((prev) => prev ? { ...prev, status: 'lost' } : prev)
      setEditStatus('lost')
      toast.success('Lead marked as Lost')
    } catch {
      toast.error('Failed to update')
    } finally {
      setMarkingLost(false)
    }
  }

  const handleAssignAgent = async () => {
    if (!agentName.trim()) return
    setAssigning(true)
    try {
      await apiClient.patch(`/leads/${id}`, { assigned_to: agentName })
      setEditAssignedTo(agentName)
      setLead((prev) => prev ? { ...prev, assigned_to: agentName } : prev)
      toast.success(`Assigned to ${agentName}`)
      setShowAssignInput(false)
      setAgentName('')
    } catch {
      toast.error('Failed to assign')
    } finally {
      setAssigning(false)
    }
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      const calls: Promise<unknown>[] = []
      if (editNotes) {
        calls.push(apiClient.post(`/leads/${id}/events`, { type: 'note', description: editNotes }))
      }
      if (editAssignedTo) {
        calls.push(apiClient.patch(`/leads/${id}`, { assigned_to: editAssignedTo }))
      }
      if (editFollowUpDate) {
        calls.push(apiClient.post(`/leads/${id}/followups`, { scheduled_at: editFollowUpDate }))
      }
      await Promise.all(calls)
      setLead((prev) => prev ? { ...prev, staff_notes: editNotes, assigned_to: editAssignedTo, follow_up_date: editFollowUpDate } : prev)
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-24">
          <p className="text-gray-400">Lead not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lead.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(lead.status)}`}>{getStatusLabel(lead.status, lead.intent_type)}</span>
              {lead.intent_type && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  {getIntentIcon(lead.intent_type)}{getIntentLabel(lead.intent_type)}
                </span>
              )}
              {lead.lead_quality && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getQualityStyle(lead.lead_quality)}`}>
                  {lead.lead_quality === 'hot' ? '🔥' : lead.lead_quality === 'warm' ? '🌤️' : '❄️'} {lead.lead_quality}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              <Clock className="h-3.5 w-3.5 inline mr-1" />{timeAgo(lead.created_at)} via {lead.source}
            </p>
          </div>
          {/* Create Booking CTA in header */}
          <Button
            className="bg-[#0066FF] hover:bg-[#0052CC] text-white gap-2 flex-shrink-0"
            onClick={() => setShowBookingModal(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Create Booking
          </Button>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* LEFT — Enquiry Details + Staff Notes */}
          <div className="lg:col-span-3 space-y-4">

            {/* Contact Info */}
            <Card className="p-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</div>
              <Row label="Phone">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {lead.phone}
                </span>
              </Row>
              <Row label="Source">
                <span className="flex items-center gap-1.5 capitalize">
                  {getSourceIcon(lead.source)} {lead.source}
                </span>
              </Row>
              <Row label="Enquiry type">
                {lead.intent_type ? (
                  <span className="flex items-center gap-1.5">{getIntentIcon(lead.intent_type)}{getIntentLabel(lead.intent_type)}</span>
                ) : '—'}
              </Row>
              <Row label="Contacted">
                <span>{new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </Row>
              {lead.assigned_to && (
                <Row label="Assigned to"><span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-gray-400" />{lead.assigned_to}</span></Row>
              )}
              {lead.follow_up_date && (
                <Row label="Follow-up"><span className="flex items-center gap-1.5 text-amber-600"><CalendarDays className="h-3.5 w-3.5" />{formatDate(lead.follow_up_date)}</span></Row>
              )}
            </Card>

            {/* Enquiry Details */}
            <Card className="p-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {lead.intent_type === 'resort' ? '🏨 Resort Enquiry' : lead.intent_type === 'camping' ? '⛺ Camping Enquiry' : lead.intent_type === 'product' ? '📦 Product Enquiry' : 'Enquiry Details'}
              </div>
              <EnquiryDetails lead={lead} />
            </Card>

            {/* Staff Notes */}
            <Card className="p-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Staff Notes</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Status</label>
                  <Select value={editStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FLOW.map((s) => (
                        <SelectItem key={s} value={s}>{getStatusLabel(s, lead.intent_type)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Assigned to</label>
                  <Input value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} placeholder="Staff member..." className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Follow-up date</label>
                  <Input type="date" value={editFollowUpDate} onChange={(e) => setEditFollowUpDate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Notes (internal)</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Notes about this lead..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={saving} className="w-full">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : 'Save Notes'}
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT — WhatsApp Conversation + Quick Actions */}
          <div className="lg:col-span-2 space-y-4">

            {/* Inline WhatsApp Thread */}
            <Card className="p-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                💬 WhatsApp Conversation
              </div>
              <ConversationThread lead={lead} />
              <Button
                variant="outline"
                className="w-full mt-3 gap-2 text-sm"
                onClick={() => router.push(
                  lead.conversation_id
                    ? `/crm/inbox?conversation=${lead.conversation_id}`
                    : `/crm/inbox?phone=${encodeURIComponent(lead.phone ?? '')}`
                )}
              >
                <MessageSquare className="h-4 w-4" />Open Full Conversation
              </Button>
            </Card>

            {/* Quick Actions */}
            <Card className="p-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</div>
              <div className="space-y-2">
                <Button
                  className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white gap-2"
                  onClick={() => setShowBookingModal(true)}
                >
                  <ShoppingCart className="h-4 w-4" />Create Booking
                </Button>
                <Button
                  className="w-full bg-[#25D366] hover:bg-[#1dbd5a] text-white gap-2"
                  onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageCircle className="h-4 w-4" />Open WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.location.href = `tel:${lead.phone}`}
                >
                  <Phone className="h-4 w-4" />Call Guest
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <Card className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500 font-medium">Move lead to:</span>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={handleMarkConverted}
              disabled={markingConverted || lead.status === 'converted'}
            >
              {markingConverted ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {lead.intent_type === 'product' ? 'Mark as Sold' : 'Mark as Converted'}
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
              onClick={handleMarkLost}
              disabled={markingLost || lead.status === 'lost'}
            >
              {markingLost ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Mark as Lost
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {showAssignInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Agent name or ID..."
                    className="h-8 text-sm w-44"
                    onKeyDown={(e) => e.key === 'Enter' && handleAssignAgent()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAssignAgent} disabled={assigning || !agentName.trim()} className="h-8 bg-[#0066FF] hover:bg-[#0052CC]">
                    {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Assign'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowAssignInput(false)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" className="gap-2" onClick={() => setShowAssignInput(true)}>
                  <UserCheck className="h-4 w-4" />Assign to Agent
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Create Booking Modal */}
      {lead && (
        <CreateBookingModal
          open={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          lead={lead}
          businessId={businessId}
          onSuccess={() => handleMarkConverted()}
        />
      )}
    </DashboardLayout>
  )
}
