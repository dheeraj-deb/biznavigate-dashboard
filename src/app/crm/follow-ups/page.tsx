'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Users,
  Filter,
  MoreVertical,
  Trash2,
  ExternalLink,
  Loader2,
  Search,
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ── Types ────────────────────────────────────────────────────────────────────

interface FollowUpLead {
  id: string
  name: string
  phone: string
  source: string
  inquiry: string
  status: string
  category: string
  staff_notes?: string
  assigned_to?: string
  follow_up_date: string   // ISO date string — only shown if set
  conversation_id?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFollowUpLead(raw: any): FollowUpLead {
  return {
    id: raw.lead_id ?? raw.id ?? '',
    name: raw.customer_name ?? raw.name ?? 'Unknown',
    phone: raw.phone ?? raw.customer_phone ?? '',
    source: raw.source ?? 'whatsapp',
    inquiry: raw.inquiry ?? raw.product ?? raw.message ?? '',
    status: raw.status ?? 'new',
    category: raw.category ?? raw.priority ?? 'warm',
    staff_notes: raw.staff_notes ?? raw.notes ?? undefined,
    assigned_to: raw.assigned_to ?? raw.assignedTo ?? undefined,
    follow_up_date: raw.follow_up_date ?? raw.followUpDate ?? '',
    conversation_id: raw.conversation_id ?? raw.conversationId ?? undefined,
  }
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date() && !isToday(dateStr)
}

function formatFollowUpDate(dateStr: string): string {
  if (isToday(dateStr)) return 'Today'
  if (isOverdue(dateStr)) {
    const d = new Date(dateStr)
    return `Overdue — ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
  }
  const d = new Date(dateStr)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getFollowUpStatus(dateStr: string): 'overdue' | 'today' | 'upcoming' {
  if (isOverdue(dateStr)) return 'overdue'
  if (isToday(dateStr)) return 'today'
  return 'upcoming'
}

function getCategoryStyle(cat: string) {
  if (cat === 'hot') return 'bg-red-100 text-red-700'
  if (cat === 'warm') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

type TabKey = 'all' | 'today' | 'overdue' | 'upcoming'

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FollowUpsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<FollowUpLead[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')

  // Create dialog
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    follow_up_date: '',
    notes: '',
    assigned_to: '',
  })

  // Complete dialog
  const [completeTarget, setCompleteTarget] = useState<FollowUpLead | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [completing, setCompleting] = useState(false)

  // ── Fetch leads with follow_up_date ──
  useEffect(() => {
    apiClient.get('/crm/leads')
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = res.data as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any[] = Array.isArray(d) ? d : (d?.data ?? d?.leads ?? [])
        const withFollowUp = raw
          .map(normalizeFollowUpLead)
          .filter((l) => !!l.follow_up_date)
        setLeads(withFollowUp)
      })
      .catch(() => toast.error('Failed to load follow-ups'))
      .finally(() => setLoading(false))
  }, [])

  // ── Counts ──
  const counts = {
    all: leads.length,
    today: leads.filter((l) => isToday(l.follow_up_date)).length,
    overdue: leads.filter((l) => isOverdue(l.follow_up_date)).length,
    upcoming: leads.filter((l) => getFollowUpStatus(l.follow_up_date) === 'upcoming').length,
  }

  // ── Filtered list ──
  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.inquiry.toLowerCase().includes(q)
    const matchTab =
      tab === 'all' ? true :
      tab === 'today' ? isToday(l.follow_up_date) :
      tab === 'overdue' ? isOverdue(l.follow_up_date) :
      getFollowUpStatus(l.follow_up_date) === 'upcoming'
    return matchSearch && matchTab
  }).sort((a, b) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime())

  // ── Actions ──
  const handleMarkComplete = async () => {
    if (!completeTarget) return
    setCompleting(true)
    try {
      await apiClient.patch(`/crm/leads/${completeTarget.id}`, {
        follow_up_date: null,
        staff_notes: completionNotes
          ? `${completeTarget.staff_notes ? completeTarget.staff_notes + '\n' : ''}Completed: ${completionNotes}`
          : completeTarget.staff_notes,
      })
      setLeads((prev) => prev.filter((l) => l.id !== completeTarget.id))
      toast.success('Follow-up marked as done')
      setCompleteTarget(null)
      setCompletionNotes('')
    } catch {
      toast.error('Failed to mark as complete')
    } finally {
      setCompleting(false)
    }
  }

  const handleRemoveFollowUp = async (lead: FollowUpLead) => {
    try {
      await apiClient.patch(`/crm/leads/${lead.id}`, { follow_up_date: null })
      setLeads((prev) => prev.filter((l) => l.id !== lead.id))
      toast.success('Follow-up removed')
    } catch {
      toast.error('Failed to remove follow-up')
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.phone.trim() || !createForm.follow_up_date) return
    setCreating(true)
    try {
      const res = await apiClient.post('/crm/leads', {
        customer_name: createForm.name,
        phone: createForm.phone,
        follow_up_date: createForm.follow_up_date,
        staff_notes: createForm.notes || undefined,
        assigned_to: createForm.assigned_to || undefined,
        source: 'manual',
        status: 'new',
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (res.data as any)?.data ?? res.data
      if (raw) {
        const newLead = normalizeFollowUpLead(raw)
        if (newLead.follow_up_date) setLeads((prev) => [newLead, ...prev])
      }
      toast.success('Follow-up scheduled')
      setShowCreate(false)
      setCreateForm({ name: '', phone: '', follow_up_date: '', notes: '', assigned_to: '' })
    } catch {
      toast.error('Failed to schedule follow-up')
    } finally {
      setCreating(false)
    }
  }

  const handleViewInInbox = (lead: FollowUpLead) => {
    if (lead.conversation_id) {
      router.push(`/crm/inbox?conversation=${lead.conversation_id}`)
    } else {
      router.push(`/crm/inbox?phone=${encodeURIComponent(lead.phone)}`)
    }
  }

  // ── Stats for header cards ──
  const stats = {
    total: leads.length,
    today: counts.today,
    overdue: counts.overdue,
    upcoming: counts.upcoming,
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-Ups</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Leads you scheduled to follow up with</p>
          </div>
          <Button
            className="bg-[#0066FF] hover:bg-[#0052CC] gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" />
            Schedule Follow-Up
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: Calendar, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
            { label: 'Due Today', value: stats.today, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
            { label: 'Upcoming', value: stats.upcoming, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 ${bg} rounded-xl`}><Icon className={`h-5 w-5 ${color}`} /></div>
                <div>
                  <div className={`text-2xl font-bold ${value > 0 && label === 'Overdue' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {([
              { key: 'all', label: 'All' },
              { key: 'today', label: 'Today' },
              { key: 'overdue', label: 'Overdue' },
              { key: 'upcoming', label: 'Upcoming' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {label}
                <span className="ml-1.5 opacity-60">({counts[key]})</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name, phone, inquiry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#0066FF]" />
            <p className="text-gray-400 mt-3">Loading follow-ups...</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-600 dark:text-gray-300">No follow-ups found</p>
            <p className="text-sm text-gray-400 mt-1">
              {leads.length === 0
                ? 'Schedule a follow-up from a lead\'s detail page or click "Schedule Follow-Up"'
                : 'No results for the current filter'}
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((lead) => {
              const fuStatus = getFollowUpStatus(lead.follow_up_date)
              return (
                <Card
                  key={lead.id}
                  className={`p-4 transition-all border-l-4 ${
                    fuStatus === 'overdue'
                      ? 'border-l-red-500'
                      : fuStatus === 'today'
                      ? 'border-l-amber-500'
                      : 'border-l-blue-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0066FF] to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {getInitials(lead.name)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{lead.name}</h3>
                        <Badge variant="outline" className={getCategoryStyle(lead.category)}>
                          {lead.category === 'hot' ? '🔥' : lead.category === 'warm' ? '🌤️' : '❄️'} {lead.category}
                        </Badge>
                        {fuStatus === 'overdue' && (
                          <Badge className="bg-red-100 text-red-700 border border-red-300">
                            <AlertCircle className="h-3 w-3 mr-1" />Overdue
                          </Badge>
                        )}
                        {fuStatus === 'today' && (
                          <Badge className="bg-amber-100 text-amber-700 border border-amber-300">
                            <Clock className="h-3 w-3 mr-1" />Today
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                        {lead.inquiry && <span>• {lead.inquiry}</span>}
                        {lead.assigned_to && <span className="flex items-center gap-1"><User className="h-3 w-3" />{lead.assigned_to}</span>}
                      </div>

                      {lead.staff_notes && (
                        <p className="text-xs text-gray-400 italic mt-1 truncate">&quot;{lead.staff_notes}&quot;</p>
                      )}

                      <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                        fuStatus === 'overdue' ? 'text-red-600' : fuStatus === 'today' ? 'text-amber-600' : 'text-blue-600'
                      }`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {formatFollowUpDate(lead.follow_up_date)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-[#25D366] hover:bg-[#1dbd5a] text-white h-7 text-xs gap-1"
                        onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />Chat
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs gap-1"
                        onClick={() => { setCompleteTarget(lead); setCompletionNotes('') }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />Done
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewInInbox(lead)}>
                            <ExternalLink className="mr-2 h-4 w-4" />View Conversation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemoveFollowUp(lead)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Remove Follow-Up
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Mark Complete Dialog ──────────────────────────────── */}
      <Dialog open={!!completeTarget} onOpenChange={() => { setCompleteTarget(null); setCompletionNotes('') }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Mark as Done
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {completeTarget && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2 text-sm">
                <span className="font-semibold">{completeTarget.name}</span>
                <span className="text-gray-400 ml-2">— {formatFollowUpDate(completeTarget.follow_up_date)}</span>
              </div>
            )}
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Completion notes (optional)</Label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="What happened during the follow-up?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>Cancel</Button>
            <Button
              onClick={handleMarkComplete}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Schedule New Follow-Up Dialog ────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#0066FF]" />
              Schedule Follow-Up
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Guest name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Follow-up Date *</Label>
              <Input
                type="date"
                value={createForm.follow_up_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCreateForm((p) => ({ ...p, follow_up_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned to</Label>
              <Input
                value={createForm.assigned_to}
                onChange={(e) => setCreateForm((p) => ({ ...p, assigned_to: e.target.value }))}
                placeholder="Staff member name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="What to discuss..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !createForm.name.trim() || !createForm.phone.trim() || !createForm.follow_up_date}
              className="bg-[#0066FF] hover:bg-[#0052CC] gap-2"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
