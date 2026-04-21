'use client'

import { useRouter } from 'next/navigation'
import { useBusinessType } from '@/hooks/use-business-type'
import { useAuthStore } from '@/store/auth-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  useDailyOverview,
  useNeedsAttention,
  useChannelAnalytics,
  useLeads,
} from '@/hooks/use-leads'
import {
  Users,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  MessageCircle,
  Camera,
  ArrowRight,
  ChevronRight,
  Loader2,
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
  extracted_entities: Record<string, string | number | null>
  time: string
}

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

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length < 7) return phone
  return d.slice(0, 3) + 'X'.repeat(Math.max(0, d.length - 6)) + d.slice(-3)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLead(raw: any): Lead {
  const first = raw.first_name ?? ''
  const last = raw.last_name ?? ''
  return {
    id: raw.lead_id ?? raw.id ?? '',
    name: [first, last].filter(Boolean).join(' ') || (raw.customer_name ?? raw.name ?? 'Unknown'),
    phone: raw.phone ?? '',
    source: raw.source ?? 'whatsapp',
    status: raw.status ?? 'new',
    lead_quality: raw.lead_quality ?? 'warm',
    intent_type: raw.intent_type ?? null,
    extracted_entities: (raw.extracted_entities ?? {}) as Record<string, string | number | null>,
    time: timeAgo(raw.created_at ?? new Date().toISOString()),
  }
}

function getIntentLabel(intent: string | null) {
  return intent === 'resort' ? '🏨 Resort' : intent === 'camping' ? '⛺ Camping' : intent === 'product' ? '📦 Product' : '—'
}

function getWhatTheyWant(lead: Lead): string {
  const e = lead.extracted_entities
  if (!e) return '—'
  if (lead.intent_type === 'resort' || lead.intent_type === 'camping') {
    const parts = []
    if (e.room_preference) parts.push(String(e.room_preference))
    if (e.guest_count) parts.push(`${e.guest_count} guests`)
    if (e.check_in) parts.push(new Date(String(e.check_in)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))
    if (e.budget) parts.push(`₹${e.budget}`)
    return parts.join(' · ') || '—'
  }
  if (lead.intent_type === 'product') {
    const parts = []
    if (e.product_name) parts.push(String(e.product_name))
    if (e.quantity) parts.push(`×${e.quantity}`)
    if (e.budget) parts.push(`₹${e.budget}`)
    return parts.join(' · ') || '—'
  }
  return Object.values(e).filter(Boolean).slice(0, 2).join(' · ') || '—'
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LeadIntelligenceSection() {
  const router = useRouter()
  const { businessType } = useBusinessType()
  const { user } = useAuthStore()
  const businessId = user?.business_id

  const intentType = businessType === 'hospitality' ? 'resort' : businessType === 'events' ? 'camping' : 'product'
  const sectionTitle = businessType === 'hospitality' ? 'Resort Enquiries' : businessType === 'events' ? 'Camping Enquiries' : 'Product Enquiries'
  const enquiryLabel = businessType === 'products' ? 'Orders' : 'Bookings'

  // ── Data fetching via dedicated dashboard endpoints ──
  // businessId is passed as a hint; server also infers it from the Bearer token
  const dailyOverviewQuery = useDailyOverview(businessId)
  const needsAttentionQuery = useNeedsAttention(businessId)
  const channelAnalyticsQuery = useChannelAnalytics(businessId)
  const recentLeadsQuery = useLeads({ intent_type: intentType, limit: 6, sortBy: 'created_at', sortOrder: 'desc', businessId })

  const loading = dailyOverviewQuery.isLoading || needsAttentionQuery.isLoading || channelAnalyticsQuery.isLoading

  // ── Daily overview stats ──
  const dailyOverview = dailyOverviewQuery.data
  const wonToday = dailyOverview?.won_count
    ?? dailyOverview?.by_status?.find((s: any) => s.status === 'won')?.count
    ?? 0
  const pendingToday = dailyOverview?.pending_count
    ?? (dailyOverview?.by_status ?? [])
        .filter((s: any) => !['won', 'lost'].includes(s.status))
        .reduce((a: number, s: any) => a + s.count, 0)

  // ── Needs attention leads ──
  const attentionLeads = (needsAttentionQuery.data ?? []).map(normalizeLead)

  // ── Channel analytics ──
  const channelAnalytics = channelAnalyticsQuery.data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawChannelList: any[] = channelAnalytics?.by_channel ?? channelAnalytics?.by_source ?? []
  const channelData = rawChannelList.map((s: any) => {
    const src: string = s.channel ?? s.source ?? ''
    return {
      source: src,
      count: s.count ?? 0,
      label: src === 'whatsapp' ? 'WhatsApp' : src === 'instagram' || src === 'instagram_dm' ? 'Instagram' : src,
      icon: src === 'instagram' || src === 'instagram_dm' ? 'instagram' : 'whatsapp',
    }
  })
  const totalSourceLeads = channelData.reduce((a, c) => a + c.count, 0)
  const monthTotalLeads = channelAnalytics?.total_leads ?? channelAnalytics?.total ?? 0
  const monthConverted = channelAnalytics?.converted_leads ?? channelAnalytics?.converted ?? 0
  const monthConversionRate = channelAnalytics?.conversion_rate ?? '0'

  // ── Recent leads ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRecentLeads: any[] = recentLeadsQuery.data?.data ?? (Array.isArray(recentLeadsQuery.data) ? recentLeadsQuery.data : [])
  const recentLeads = rawRecentLeads.map(normalizeLead)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Row 1: Today's 5-second overview ──────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Today&apos;s Snapshot</h2>
          <p className="text-xs text-gray-400 mt-0.5">{sectionTitle} — WhatsApp leads</p>
        </div>
        <button onClick={() => router.push('/crm/leads')} className="text-xs text-[#0066FF] hover:underline flex items-center gap-1">
          View all leads <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{dailyOverview?.total_leads ?? 0}</div>
              <div className="text-xs text-gray-500">Enquiries Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CalendarCheck className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{wonToday}</div>
              <div className="text-xs text-gray-500">{enquiryLabel} Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#0066FF]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <TrendingUp className="h-4 w-4 text-[#0066FF]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {parseFloat(dailyOverview?.conversion_rate ?? '0').toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Conversion Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{pendingToday}</div>
              <div className="text-xs text-gray-500">Pending Follow-up</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row 2: Needs Attention + Channel Performance ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Needs Attention */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Needs Attention</span>
                {attentionLeads.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {attentionLeads.length}
                  </span>
                )}
              </div>
              <button onClick={() => router.push('/crm/leads?status=contacted')} className="text-xs text-[#0066FF] hover:underline">
                View all →
              </button>
            </div>

            {attentionLeads.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-2xl mb-2">🎉</div>
                <p className="text-sm text-gray-500">No leads need attention right now</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {attentionLeads.map((lead) => (
                  <div key={lead.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                    {/* Avatar */}
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {lead.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{lead.name}</span>
                        {lead.lead_quality === 'hot' && <span className="text-xs">🔥</span>}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{getWhatTheyWant(lead)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400">{lead.time}</span>
                      <Button size="sm"
                        className="h-6 text-[10px] bg-[#25D366] hover:bg-[#1dbd5a] text-white px-2"
                        onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank') }}>
                        <MessageCircle className="h-3 w-3 mr-1" />Call
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Channel Performance */}
        <div>
          <Card className="h-full">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Channel Performance</span>
              <p className="text-xs text-gray-400 mt-0.5">This month</p>
            </div>
            <div className="p-4 space-y-4">
              {channelData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
              ) : (
                channelData.map((ch) => {
                  const pct = totalSourceLeads > 0 ? Math.round((ch.count / totalSourceLeads) * 100) : 0
                  return (
                    <div key={ch.source}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          {ch.icon === 'whatsapp'
                            ? <MessageCircle className="h-4 w-4 text-[#25D366]" />
                            : <Camera className="h-4 w-4 text-pink-500" />}
                          <span className="font-medium text-gray-700 dark:text-gray-300">{ch.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{ch.count}</span>
                          <span className="text-xs text-gray-400 ml-1">leads</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${ch.icon === 'whatsapp' ? 'bg-[#25D366]' : 'bg-pink-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 text-right">{pct}% of enquiries</div>
                    </div>
                  )
                })
              )}

              {/* Month summary */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Month total</span>
                  <span className="font-bold text-gray-900 dark:text-white">{monthTotalLeads} enquiries</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Converted</span>
                  <span className="font-bold text-green-600">{monthConverted} {enquiryLabel.toLowerCase()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Conversion rate</span>
                  <span className="font-bold text-[#0066FF]">{parseFloat(monthConversionRate).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Row 3: Recent Enquiries ────────────────────────────────────── */}
      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Recent {sectionTitle}</span>
          <button onClick={() => router.push('/crm/leads')} className="text-xs text-[#0066FF] hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Guest</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">What They Want</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No recent enquiries</td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{lead.name}</div>
                      <div className="text-xs text-gray-400">{lead.lead_quality === 'hot' ? '🔥' : lead.lead_quality === 'warm' ? '🌤️' : '❄️'} {lead.lead_quality}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{maskPhone(lead.phone)}</td>
                    <td className="px-4 py-3">
                      {lead.intent_type
                        ? <span className="text-xs font-medium">{getIntentLabel(lead.intent_type)}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate block max-w-[180px]">
                        {getWhatTheyWant(lead)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        lead.status === 'new' ? 'bg-gray-100 text-gray-600 border-gray-300'
                        : lead.status === 'contacted' ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : lead.status === 'interested' ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : lead.status === 'converted' ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-red-100 text-red-500 border-red-300'
                      }`}>
                        {lead.status === 'new' ? 'New'
                          : lead.status === 'contacted' ? 'Contacted'
                          : lead.status === 'interested' ? 'Interested'
                          : lead.status === 'converted' ? 'Converted'
                          : lead.status === 'lost' ? 'Lost'
                          : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{lead.time}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank') }}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors ml-auto"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
