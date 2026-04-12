'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
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
  Users,
  Tent,
  ShoppingBag,
  Hotel,
  UserCheck,
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

const STATUS_FLOW = ['new', 'contacted', 'qualified', 'won', 'lost'] as const

function getStatusLabel(s: string, intentType?: string | null) {
  return s === 'new' ? 'New' : s === 'contacted' ? 'Contacted' : s === 'qualified' ? 'Qualified'
    : s === 'won' ? (intentType === 'product' ? 'Sold ✓' : 'Booked ✓')
    : s === 'lost' ? 'Lost' : s
}

function getStatusStyle(s: string) {
  return s === 'new' ? 'bg-blue-100 text-blue-700 border border-blue-300'
    : s === 'contacted' ? 'bg-amber-100 text-amber-700 border border-amber-300'
    : s === 'qualified' ? 'bg-orange-100 text-orange-700 border border-orange-300'
    : s === 'won' ? 'bg-green-100 text-green-700 border border-green-300'
    : 'bg-gray-100 text-gray-500 border border-gray-300'
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editFollowUpDate, setEditFollowUpDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [markingWon, setMarkingWon] = useState(false)
  const [markingLost, setMarkingLost] = useState(false)
  const [showAssignInput, setShowAssignInput] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [assigning, setAssigning] = useState(false)

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
      await apiClient.patch(`/leads/${id}/status`, { status: newStatus })
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleMarkWon = async () => {
    setMarkingWon(true)
    try {
      await apiClient.patch(`/leads/${id}/status`, { status: 'won' })
      setLead((prev) => prev ? { ...prev, status: 'won' } : prev)
      setEditStatus('won')
      toast.success('Lead marked as Booked ✓')
    } catch {
      toast.error('Failed to update')
    } finally {
      setMarkingWon(false)
    }
  }

  const handleMarkLost = async () => {
    setMarkingLost(true)
    try {
      await apiClient.patch(`/leads/${id}/status`, { status: 'lost' })
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
      await apiClient.patch(`/leads/${id}/assign`, { assigned_to: agentName })
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
        calls.push(apiClient.post(`/leads/${id}/notes`, { note: editNotes }))
      }
      if (editAssignedTo) {
        calls.push(apiClient.patch(`/leads/${id}/assign`, { assigned_to: editAssignedTo }))
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

  const handleViewConversation = () => {
    if (lead?.conversation_id) {
      router.push(`/crm/inbox?conversation=${lead.conversation_id}`)
    } else {
      router.push(`/crm/inbox?phone=${encodeURIComponent(lead?.phone ?? '')}`)
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

          {/* RIGHT — Conversation */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                💬 WhatsApp Conversation
              </div>

              {/* Conversation preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 min-h-[280px] flex flex-col gap-3">
                {/* Bot greeting */}
                <div className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">B</div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none px-3 py-2 text-sm shadow-sm max-w-[80%]">
                    <p>Hi! Welcome to {lead.intent_type === 'resort' ? 'our resort' : lead.intent_type === 'camping' ? 'our camping site' : 'our store'}. How can I help you?</p>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">Bot</p>
                  </div>
                </div>

                {/* Guest enquiry message — built from extracted_entities */}
                <div className="flex items-start gap-2 flex-row-reverse">
                  <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {lead.first_name?.[0]?.toUpperCase() ?? 'G'}
                  </div>
                  <div className="bg-[#dcf8c6] dark:bg-green-900/30 rounded-xl rounded-tr-none px-3 py-2 text-sm shadow-sm max-w-[80%]">
                    {(() => {
                      const e = lead.extracted_entities as Record<string, string | number | null | undefined>
                      if (lead.intent_type === 'resort' || lead.intent_type === 'camping') {
                        const parts: string[] = []
                        if (e.room_preference) parts.push(`I'm looking for a ${String(e.room_preference)}`)
                        if (e.check_in) parts.push(`from ${formatDate(String(e.check_in))}`)
                        if (e.check_out) parts.push(`to ${formatDate(String(e.check_out))}`)
                        if (e.guest_count) parts.push(`for ${String(e.guest_count)} guests`)
                        if (e.budget) parts.push(`budget around ₹${String(e.budget)}`)
                        return <p>{parts.length > 0 ? parts.join(', ') + '.' : "I'd like to make an enquiry."}</p>
                      }
                      if (lead.intent_type === 'product') {
                        const parts: string[] = []
                        if (e.product_name) parts.push(`I need ${String(e.product_name)}`)
                        if (e.quantity) parts.push(`qty ${String(e.quantity)}`)
                        if (e.delivery_city) parts.push(`deliver to ${String(e.delivery_city)}`)
                        if (e.budget) parts.push(`budget ₹${String(e.budget)}`)
                        return <p>{parts.length > 0 ? parts.join(', ') + '.' : "I'd like to place an order."}</p>
                      }
                      return <p>{"I have an enquiry I'd like help with."}</p>
                    })()}
                    <p className="text-[10px] text-gray-400 mt-1 text-right">{lead.first_name || 'Guest'}</p>
                  </div>
                </div>

                <div className="flex-1 flex items-end justify-center pb-2">
                  <button onClick={handleViewConversation} className="text-xs text-[#0066FF] hover:underline">
                    View full conversation in inbox →
                  </button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-3 gap-2"
                onClick={handleViewConversation}
              >
                <MessageSquare className="h-4 w-4" />Open Full Conversation
              </Button>
            </Card>

            {/* Quick Actions */}
            <Card className="p-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</div>
              <div className="space-y-2">
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
              onClick={handleMarkWon}
              disabled={markingWon || lead.status === 'won'}
            >
              {markingWon ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {lead.intent_type === 'product' ? 'Mark as Sold' : 'Mark as Booked'}
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
              <Button variant="outline" className="gap-2" onClick={handleViewConversation}>
                <MessageSquare className="h-4 w-4" />View in Inbox
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
