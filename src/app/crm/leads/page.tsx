'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useBusinessType } from '@/hooks/use-business-type'
import { useAuthStore } from '@/store/auth-store'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Phone,
  MessageCircle,
  Camera,
  Globe,
  Users,
  Clock,
  CheckCircle,
  LayoutGrid,
  Table,
  ChevronDown,
  CalendarDays,
  Send,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Eye,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  name: string
  phone: string
  source: string
  status: string
  lead_quality: string
  intent_type: string | null
  extracted_entities: Record<string, unknown>
  is_converted: boolean
  time: string
  created_at: string
}

interface LeadStats {
  total_leads: number
  converted_leads: number
  conversion_rate: string
  by_status: Array<{ status: string; count: number }>
}

type DateRange = 'today' | 'week' | 'month'
type QuickFilter = 'all' | 'pending' | 'won' | 'lost'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length < 7) return phone
  return d.slice(0, 3) + 'X'.repeat(Math.max(0, d.length - 6)) + d.slice(-3)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLead(raw: any): Lead {
  const first = raw.first_name ?? ''
  const last = raw.last_name ?? ''
  const name = [first, last].filter(Boolean).join(' ') || (raw.customer_name ?? raw.name ?? 'Unknown')
  return {
    id: raw.lead_id ?? raw.id ?? '',
    name,
    phone: raw.phone ?? raw.customer_phone ?? '',
    source: raw.source ?? 'whatsapp',
    status: raw.status ?? 'new',
    lead_quality: raw.lead_quality ?? raw.category ?? 'warm',
    intent_type: raw.intent_type ?? null,
    extracted_entities: raw.extracted_entities ?? {},
    is_converted: raw.is_converted ?? false,
    time: timeAgo(raw.created_at ?? new Date().toISOString()),
    created_at: raw.created_at ?? new Date().toISOString(),
  }
}

function isPendingLead(l: Lead) { return !['booked', 'won', 'lost'].includes(l.status) }

function getDateParams(range: DateRange): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString()
  if (range === 'today') {
    return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(), to }
  }
  if (range === 'week') {
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), to }
  }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to }
}

const STATUS_FLOW = ['new', 'active', 'quoted', 'booked', 'won', 'lost'] as const

function getStatusLabel(s: string) {
  return s === 'new' ? 'New'
    : s === 'active' ? 'In Conversation'
    : s === 'contacted' ? 'Contacted'
    : s === 'qualified' ? 'Qualified'
    : s === 'quoted' ? 'Quoted'
    : s === 'booked' ? 'Booked'
    : s === 'won' ? 'Won'
    : s === 'lost' ? 'Lost'
    : s
}

function getStatusStyle(s: string) {
  return s === 'new' ? 'bg-gray-100 text-gray-600 border border-gray-300'
    : s === 'active' ? 'bg-blue-100 text-blue-700 border border-blue-300'
    : s === 'contacted' ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
    : s === 'qualified' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
    : s === 'quoted' ? 'bg-orange-100 text-orange-700 border border-orange-300'
    : s === 'booked' ? 'bg-purple-100 text-purple-700 border border-purple-300'
    : s === 'won' ? 'bg-green-100 text-green-700 border border-green-300'
    : 'bg-red-100 text-red-500 border border-red-300'
}

function getStatusColor(s: string) {
  return s === 'new' ? '#9ca3af'
    : s === 'active' ? '#3b82f6'
    : s === 'contacted' ? '#06b6d4'
    : s === 'qualified' ? '#6366f1'
    : s === 'quoted' ? '#f97316'
    : s === 'booked' ? '#a855f7'
    : s === 'won' ? '#22c55e'
    : '#ef4444'
}

function getQualityStyle(q: string) {
  return q === 'hot' ? 'bg-red-100 text-red-700' : q === 'warm' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
}

function getIntentStyle(intent: string | null) {
  return intent === 'resort' ? 'bg-purple-100 text-purple-700'
    : intent === 'camping' ? 'bg-green-100 text-green-700'
    : intent === 'product' ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-600'
}

function getIntentLabel(intent: string | null) {
  return intent === 'resort' ? '🏨 Resort' : intent === 'camping' ? '⛺ Camping' : intent === 'product' ? '📦 Product' : '—'
}

function getSourceIcon(source: string) {
  if (source === 'instagram' || source === 'instagram_dm') return <Camera className="h-3.5 w-3.5" />
  if (source === 'whatsapp') return <MessageCircle className="h-3.5 w-3.5" />
  return <Globe className="h-3.5 w-3.5" />
}

// ── What They Want ────────────────────────────────────────────────────────────

function WhatTheyWant({ lead }: { lead: Lead }) {
  const e = lead.extracted_entities as Record<string, string | number | null | undefined>
  if (!e || Object.keys(e).length === 0) return <span className="text-gray-300 text-xs">—</span>

  if (lead.intent_type === 'resort' || lead.intent_type === 'camping') {
    return (
      <div className="text-xs space-y-0.5">
        {(e.check_in || e.check_out) && (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <CalendarDays className="h-3 w-3 flex-shrink-0 text-gray-400" />
            {e.check_in ? formatDate(String(e.check_in)) : '?'}
            {e.check_out ? ` – ${formatDate(String(e.check_out))}` : ''}
          </div>
        )}
        {e.guest_count && (
          <div className="flex items-center gap-1 text-gray-500">
            <Users className="h-3 w-3 flex-shrink-0" />{String(e.guest_count)} guests
          </div>
        )}
        {e.room_preference && <div className="text-gray-400 truncate max-w-[160px]">{String(e.room_preference)}</div>}
        {e.budget && <div className="text-green-600 font-medium">₹{String(e.budget)}</div>}
      </div>
    )
  }

  if (lead.intent_type === 'product') {
    return (
      <div className="text-xs space-y-0.5">
        {e.product_name && <div className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[160px]">{String(e.product_name)}</div>}
        {e.quantity && <div className="text-gray-500">Qty: {String(e.quantity)}</div>}
        {e.delivery_city && <div className="text-gray-400">{String(e.delivery_city)}</div>}
        {e.budget && <div className="text-green-600 font-medium">₹{String(e.budget)}</div>}
      </div>
    )
  }

  return (
    <div className="text-xs text-gray-500 space-y-0.5">
      {Object.entries(e).filter(([, v]) => v != null).slice(0, 3).map(([, v], i) => (
        <div key={i} className="truncate max-w-[160px]">{String(v)}</div>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

// Business-type display config
const BIZ_CONFIG = {
  hospitality: {
    title: 'Resort Enquiries',
    subtitle: 'WhatsApp enquiries for your resort / hotel',
    defaultIntent: 'resort',
    intentOptions: [{ value: 'resort', label: '🏨 Resort' }],
    campaignPlaceholder: `Hi {{name}}, we noticed you were interested in a stay. Rooms are still available — reply to book! 🏨`,
  },
  events: {
    title: 'Camping Enquiries',
    subtitle: 'WhatsApp enquiries for your camping / events',
    defaultIntent: 'camping',
    intentOptions: [{ value: 'camping', label: '⛺ Camping' }],
    campaignPlaceholder: `Hi {{name}}, your camping spot is still available for the dates you asked about. Reply to confirm! ⛺`,
  },
  products: {
    title: 'Product Enquiries',
    subtitle: 'WhatsApp enquiries for your products',
    defaultIntent: 'product',
    intentOptions: [{ value: 'product', label: '📦 Product' }],
    campaignPlaceholder: `Hi {{name}}, the product you asked about is still available. Reply to place your order! 📦`,
  },
} as const

export default function LeadsPage() {
  const router = useRouter()
  const { businessType } = useBusinessType()
  const { user } = useAuthStore()
  const businessId = user?.business_id
  const bizCfg = BIZ_CONFIG[businessType] ?? BIZ_CONFIG.hospitality

  // Stats
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('month')

  // List
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters — default 'all' so leads show regardless of intent_type
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [intentFilter, setIntentFilter] = useState<string>('all')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')

  // Campaign
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [campaignMessage, setCampaignMessage] = useState('')
  const [sendingCampaign, setSendingCampaign] = useState(false)

  // Debounce search
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(timer.current)
  }, [search])

  // Fetch stats
  useEffect(() => {
    setStatsLoading(true)
    const { from, to } = getDateParams(dateRange)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statsParams: any = { from, to }
    if (businessId) statsParams.businessId = businessId
    apiClient.get('/leads/stats/overview', { params: statsParams })
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = res.data as any
        setStats(d?.data ?? d)
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [dateRange, businessId])

  // Fetch leads
  const fetchLeads = useCallback(() => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = { page, limit: 20, sortBy: 'created_at', sortOrder: 'desc' }
    if (businessId) params.businessId = businessId
    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter !== 'all') params.status = statusFilter
    if (intentFilter !== 'all') params.intent_type = intentFilter

    apiClient.get('/leads', { params })
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = res.data as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any[] = d?.data ?? d?.leads ?? (Array.isArray(d) ? d : [])
        const meta = d?.meta ?? {}
        setLeads(raw.map(normalizeLead))
        setTotalPages(meta.totalPages ?? 1)
        setTotal(meta.total ?? raw.length)
      })
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, statusFilter, intentFilter, businessId])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // 'pending' filter is client-side only (no direct API equivalent)
  // 'booked', 'won', and 'lost' are API-filtered via statusFilter
  const filtered = leads.filter((l) => quickFilter === 'pending' ? isPendingLead(l) : true)

  // Counts from API stats
  const pendingCount = (stats?.by_status ?? []).filter(s => !['booked', 'won', 'lost'].includes(s.status)).reduce((a, s) => a + s.count, 0)
  const bookedCount = (stats?.by_status ?? []).filter(s => ['booked', 'won'].includes(s.status)).reduce((a, s) => a + s.count, 0)
  const lostCount = (stats?.by_status ?? []).find(s => s.status === 'lost')?.count ?? 0

  // Selection helpers
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLeads((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const selectAllPending = () => setSelectedLeads(new Set(filtered.filter(isPendingLead).map(l => l.id)))
  const clearSelection = () => setSelectedLeads(new Set())

  const handleStatusChange = async (leadId: string, newStatus: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setLeads((prev) => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    try {
      await apiClient.patch(`/leads/${leadId}/status`, { status: newStatus })
    } catch {
      toast.error('Failed to update status')
      fetchLeads()
    }
  }

  const handleSendCampaign = async () => {
    if (!campaignMessage.trim()) return toast.error('Write a message first')
    setSendingCampaign(true)
    try {
      await apiClient.post('/crm/campaigns/bulk', { lead_ids: Array.from(selectedLeads), message: campaignMessage })
      toast.success(`Campaign sent to ${selectedLeads.size} leads`)
      setShowCampaignDialog(false)
      setSelectedLeads(new Set())
      setCampaignMessage('')
    } catch {
      toast.error('Failed to send campaign')
    } finally {
      setSendingCampaign(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bizCfg.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{bizCfg.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <Button size="sm" variant={viewMode === 'cards' ? 'default' : 'ghost'} onClick={() => setViewMode('cards')} className="gap-1.5 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" />Cards
            </Button>
            <Button size="sm" variant={viewMode === 'table' ? 'default' : 'ghost'} onClick={() => setViewMode('table')} className="gap-1.5 text-xs">
              <Table className="h-3.5 w-3.5" />Table
            </Button>
          </div>
        </div>

        {/* Date Tabs + Stats */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            {(['today', 'week', 'month'] as const).map((r) => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  dateRange === r ? 'bg-[#0066FF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: businessType === 'products' ? 'Total Enquiries' : 'Total Enquiries', value: stats?.total_leads ?? 0, icon: Users, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
              { label: businessType === 'products' ? 'Orders Made' : 'Bookings Made', value: stats?.converted_leads ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
              { label: 'Conversion Rate', value: `${parseFloat(stats?.conversion_rate ?? '0').toFixed(1)}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
              { label: 'Revenue', value: '₹0', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${bg} rounded-xl`}><Icon className={`h-5 w-5 ${color}`} /></div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? <span className="opacity-40">—</span> : value}
                    </div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { key: 'all', label: 'All', count: total, cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', active: 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' },
            { key: 'pending', label: '⏳ Pending', count: pendingCount, cls: 'bg-amber-50 text-amber-700 border border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
            { key: 'won', label: '✓ Booked', count: bookedCount, cls: 'bg-green-50 text-green-700 border border-green-200', active: 'bg-green-600 text-white border-green-600' },
            { key: 'lost', label: 'Lost', count: lostCount, cls: 'bg-gray-50 text-gray-500 border border-gray-200', active: 'bg-gray-500 text-white border-gray-500' },
          ] as const).map(({ key, label, count, cls, active }) => (
            <button key={key} onClick={() => {
              setQuickFilter(key)
              clearSelection()
              setPage(1)
              // booked/lost → drive through API status filter; pending/all → clear status filter
              if (key === 'won') setStatusFilter('booked')
              else if (key === 'lost') setStatusFilter('lost')
              else setStatusFilter('all')
            }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${quickFilter === key ? active : cls}`}>
              {label} <span className="ml-1 opacity-70">({count})</span>
            </button>
          ))}
          {quickFilter === 'pending' && filtered.some(isPendingLead) && (
            <button onClick={selectAllPending} className="ml-auto text-xs text-[#0066FF] hover:underline font-medium">
              Select all pending →
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <Card className="p-3">
          <div className="flex flex-col md:flex-row gap-2.5 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 text-sm" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full md:w-[150px] h-10 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_FLOW.map((s) => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={intentFilter} onValueChange={(v) => { setIntentFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full md:w-[150px] h-10 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {bizCfg.intentOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Loading */}
        {loading && (
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#0066FF]" />
          </Card>
        )}

        {/* Cards View */}
        {!loading && viewMode === 'cards' && (
          <div className="space-y-2.5">
            {filtered.map((lead) => {
              const isSelected = selectedLeads.has(lead.id)
              return (
                <Card
                  key={lead.id}
                  className={`p-4 hover:shadow-md transition-all cursor-pointer border-l-4 ${isSelected ? 'ring-2 ring-[#0066FF] shadow-md' : ''}`}
                  style={{ borderLeftColor: getStatusColor(lead.status) }}
                  onClick={() => router.push(`/crm/leads/${lead.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isSelected} onChange={() => {}}
                      onClick={(e) => toggleSelect(lead.id, e)}
                      className="h-4 w-4 rounded border-gray-300 accent-[#0066FF] cursor-pointer mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">{lead.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(lead.status)}`}>{getStatusLabel(lead.status)}</span>
                        {lead.intent_type && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getIntentStyle(lead.intent_type)}`}>{getIntentLabel(lead.intent_type)}</span>}
                        {lead.lead_quality && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getQualityStyle(lead.lead_quality)}`}>{lead.lead_quality === 'hot' ? '🔥' : lead.lead_quality === 'warm' ? '🌤️' : '❄️'} {lead.lead_quality}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{maskPhone(lead.phone)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">{getSourceIcon(lead.source)} {lead.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{lead.time}</span>
                      </div>
                      <div className="mt-1.5"><WhatTheyWant lead={lead} /></div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button size="sm" className="bg-[#25D366] hover:bg-[#1dbd5a] text-white h-7 text-xs"
                        onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank') }}>
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />Chat
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={(e) => { e.stopPropagation(); router.push(`/crm/leads/${lead.id}`) }}>
                        <Eye className="h-3.5 w-3.5 mr-1" />View
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
            {filtered.length === 0 && (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">No leads found</p>
              </Card>
            )}
          </div>
        )}

        {/* Table View */}
        {!loading && viewMode === 'table' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox"
                        checked={filtered.length > 0 && filtered.every(l => selectedLeads.has(l.id))}
                        onChange={(e) => e.target.checked ? setSelectedLeads(new Set(filtered.map(l => l.id))) : clearSelection()}
                        className="h-4 w-4 rounded border-gray-300 accent-[#0066FF] cursor-pointer" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{businessType === 'products' ? 'Customer' : 'Guest Name'}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">What They Want</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filtered.map((lead) => {
                    const isSelected = selectedLeads.has(lead.id)
                    return (
                      <tr key={lead.id}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'}`}
                        onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={() => {}} onClick={(e) => toggleSelect(lead.id, e)}
                            className="h-4 w-4 rounded border-gray-300 accent-[#0066FF] cursor-pointer" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">{lead.name}</div>
                          {lead.lead_quality && <div className="text-xs text-gray-400 mt-0.5">{lead.lead_quality === 'hot' ? '🔥' : lead.lead_quality === 'warm' ? '🌤️' : '❄️'} {lead.lead_quality}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{maskPhone(lead.phone)}</td>
                        <td className="px-4 py-3">
                          {lead.intent_type
                            ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getIntentStyle(lead.intent_type)}`}>{getIntentLabel(lead.intent_type)}</span>
                            : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                        <td className="px-4 py-3"><WhatTheyWant lead={lead} /></td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className={`${getStatusStyle(lead.status)} gap-1 min-w-[110px] justify-between h-7 text-xs`}>
                                {getStatusLabel(lead.status)}<ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {STATUS_FLOW.map((s) => (
                                <DropdownMenuItem key={s} onClick={() => handleStatusChange(lead.id, s)} className="gap-2 text-sm">
                                  <div className="w-2 h-2 rounded-full" style={{ background: getStatusColor(s) }} />
                                  {getStatusLabel(s)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs text-gray-500"><Clock className="h-3 w-3" />{lead.time}</div>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Button size="sm" className="bg-[#25D366] hover:bg-[#1dbd5a] text-white h-7 text-xs"
                              onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}>
                              <MessageCircle className="h-3.5 w-3.5 mr-1" />Chat
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                              <Eye className="h-3.5 w-3.5 mr-1" />View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">No leads found</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{total} leads total</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 px-2">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Campaign Bar ─────────────────────────────── */}
      {selectedLeads.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-[#0066FF] text-white px-5 py-3 rounded-2xl shadow-2xl shadow-blue-500/30">
            <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold">{selectedLeads.size}</span>
            </div>
            <span className="text-sm font-semibold">{selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected</span>
            <div className="h-4 w-px bg-white/30" />
            <button onClick={clearSelection} className="text-white/70 hover:text-white text-sm flex items-center gap-1">
              <X className="h-3.5 w-3.5" />Clear
            </button>
            <Button size="sm" className="bg-white text-[#0066FF] hover:bg-blue-50 gap-1.5 font-bold" onClick={() => setShowCampaignDialog(true)}>
              <Send className="h-3.5 w-3.5" />Send Campaign
            </Button>
          </div>
        </div>
      )}

      {/* ── Campaign Dialog ───────────────────────────────────── */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#0066FF]" />Send Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              Sending to <span className="font-bold">{selectedLeads.size} leads</span> via WhatsApp.
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">WhatsApp Message</label>
              <textarea
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                placeholder={bizCfg.campaignPlaceholder}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Use <code className="bg-gray-100 px-1 rounded text-[#0066FF]">{'{{name}}'}</code> — replaced with each guest&apos;s name
              </p>
            </div>
            {campaignMessage && (
              <div className="bg-[#dcf8c6] rounded-xl p-3 text-sm text-gray-700 border border-green-200">
                <div className="text-[10px] text-gray-400 mb-1 font-medium">Preview</div>
                {campaignMessage.replace(/\{\{name\}\}/g, 'Rahul')}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSendCampaign} disabled={sendingCampaign || !campaignMessage.trim()} className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] gap-2">
                {sendingCampaign
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                  : <><Send className="h-4 w-4" />Send to {selectedLeads.size}</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
