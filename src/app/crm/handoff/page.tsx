'use client'

import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Filter,
  MessageSquare,
  MoreVertical,
  Phone,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  UserPlus,
  X,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { useAuthStore } from '@/store/auth-store'
import {
  useHandoffWebSocket,
  useHandoffQueue,
  useHandoffDetail,
  useHandoffTakeover,
  useHandoffSendMessage,
  useHandoffResolve,
  HandoffConversation,
  HandoffMessage,
} from '@/hooks/use-handoff'

// ── Helpers ────────────────────────────────────────────────────────────────────

function waitLabel(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m ago`
}

function MessageTickIcon({ status }: { status?: string }) {
  if (!status) return null
  if (status === 'failed') return <X className="h-3 w-3 text-red-400" />
  if (status === 'sent') return <Check className="h-3 w-3 opacity-60" />
  if (status === 'delivered') return <CheckCheck className="h-3 w-3 opacity-60" />
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-200" />
  return null
}

// ── Queue Card ─────────────────────────────────────────────────────────────────

function QueueCard({
  conv,
  selected,
  currentUserId,
  onClick,
}: {
  conv: HandoffConversation
  selected: boolean
  currentUserId: string
  onClick: () => void
}) {
  const isUnassigned = !conv.agent_id
  const isAssignedToMe = conv.agent_id === currentUserId

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-all duration-200',
        selected
          ? 'bg-orange-50 dark:bg-orange-500/10 shadow-sm shadow-orange-500/5'
          : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80',
        conv.is_resolved && 'opacity-60'
      )}
    >
      {/* Selection indicator */}
      <div className={cn(
        'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300',
        selected ? 'h-8 bg-orange-500' : 'h-0'
      )} />

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className={cn(
          'h-11 w-11 border-2 transition-all',
          selected ? 'border-orange-200 dark:border-orange-900/50' : 'border-transparent'
        )}>
          <AvatarFallback className={cn(
            'text-sm font-semibold',
            isUnassigned
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300'
              : isAssignedToMe
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          )}>
            {(conv.customer_name || 'U').substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Unresolved pulse */}
        {!conv.is_resolved && isUnassigned && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'truncate text-[14px] font-semibold',
            selected ? 'text-orange-900 dark:text-orange-100' : 'text-slate-900 dark:text-slate-100'
          )}>
            {conv.customer_name}
          </span>
          <span className="text-[11px] text-slate-400 tabular-nums flex-shrink-0">
            {waitLabel(conv.human_takeover_at)}
          </span>
        </div>

        <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
          {conv.human_takeover_reason}
        </p>

        <p className="mt-0.5 truncate text-[12px] text-slate-400 dark:text-slate-500 italic">
          {conv.message_text}
        </p>

        <div className="mt-1.5 flex items-center gap-1">
          {conv.is_resolved ? (
            <Badge className="h-4 px-1.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
              <CheckCheck className="h-2.5 w-2.5 mr-0.5" /> Resolved
            </Badge>
          ) : isUnassigned ? (
            <Badge className="h-4 px-1.5 text-[10px] font-bold bg-orange-500 text-white rounded-full shadow-sm">
              <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> Unassigned
            </Badge>
          ) : isAssignedToMe ? (
            <Badge className="h-4 px-1.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
              <UserCheck className="h-2.5 w-2.5 mr-0.5" /> You
            </Badge>
          ) : (
            <Badge className="h-4 px-1.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-full">
              <UserCheck className="h-2.5 w-2.5 mr-0.5" /> Assigned
            </Badge>
          )}

          <span className={cn(
            'ml-auto text-[10px] font-medium capitalize px-1.5 py-0.5 rounded',
            conv.channel === 'whatsapp'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'
          )}>
            {conv.channel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function HandoffPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><RefreshCw className="h-6 w-6 animate-spin text-slate-400" /></div>}>
      <HandoffPage />
    </Suspense>
  )
}

function HandoffPage() {
  const { user } = useAuthStore()
  const currentUserId = user?.user_id || user?.id || ''

  useHandoffWebSocket()

  const { data: queueData, isLoading: isLoadingQueue } = useHandoffQueue()
  const allConversations = queueData?.data ?? []

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active')
  const [replyText, setReplyText] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const { data: detail, isLoading: isLoadingDetail } = useHandoffDetail(selectedId)
  const { mutateAsync: takeover, isPending: isTakingOver } = useHandoffTakeover()
  const { mutateAsync: sendMessage, isPending: isSending } = useHandoffSendMessage()
  const { mutateAsync: resolve, isPending: isResolving } = useHandoffResolve()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Prefer queue data (real-time updates) but fall back to detail when queue hasn't loaded yet
  const selectedConv = allConversations.find(c => c.conversation_id === selectedId)
    ?? (detail?.conversation_id === selectedId ? (detail as unknown as HandoffConversation) : null)

  const isUnassigned = selectedConv ? !selectedConv.agent_id : false
  const isAssignedToMe = selectedConv ? selectedConv.agent_id === currentUserId : false
  const isAssignedToOther = selectedConv ? (!!selectedConv.agent_id && selectedConv.agent_id !== currentUserId) : false
  const canTakeover = isUnassigned || isAssignedToOther
  const canReply = isAssignedToMe && !selectedConv?.is_resolved

  // Filter + sort
  const filteredConversations = useMemo(() => {
    return allConversations
      .filter(c => {
        const matchesTab = activeTab === 'resolved' ? c.is_resolved : !c.is_resolved
        const matchesSearch =
          (c.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.human_takeover_reason || '').toLowerCase().includes(searchQuery.toLowerCase())
        return matchesTab && matchesSearch
      })
      .sort((a, b) => new Date(a.human_takeover_at).getTime() - new Date(b.human_takeover_at).getTime())
  }, [allConversations, activeTab, searchQuery])

  const unassignedCount = allConversations.filter(c => !c.is_resolved && !c.agent_id).length

  // Messages from detail
  const messages: HandoffMessage[] = useMemo(() => {
    return [...(detail?.messages ?? [])].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [detail?.messages])

  // Auto-scroll
  const lastTs = messages[messages.length - 1]?.timestamp
  const prevLastTs = useRef(lastTs)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [selectedId])
  useEffect(() => {
    if (lastTs !== prevLastTs.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      prevLastTs.current = lastTs
    }
  }, [lastTs])

  // Mobile sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(!selectedId)
      else setIsSidebarOpen(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedId])

  const handleSend = async () => {
    if (!replyText.trim() || !selectedId || !canReply) return
    const text = replyText
    setReplyText('')
    await sendMessage({ conversationId: selectedId, content: text })
  }

  const handleTakeover = async () => {
    if (!selectedId) return
    await takeover(selectedId)
  }

  const handleResolve = async () => {
    if (!selectedId) return
    await resolve(selectedId)
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-6rem)] flex-col bg-white dark:bg-slate-950 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">

        {/* Page header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/50">
              <Phone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Human Agent Queue
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Escalated conversations awaiting human support</p>
            </div>
          </div>
          {unassignedCount > 0 && (
            <Badge className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500 text-white rounded-full text-[12px] font-bold shadow-sm shadow-orange-500/20">
              <AlertCircle className="h-3.5 w-3.5" />
              {unassignedCount} unassigned
            </Badge>
          )}
        </div>

        {/* Main split layout */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Queue sidebar */}
          <div className={cn(
            'flex flex-col border-r border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-all duration-300 absolute inset-y-0 left-0 z-20 lg:relative',
            isSidebarOpen ? 'w-full sm:w-80 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-80'
          )}>

            {/* Sidebar header */}
            <div className="p-3 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search queue..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-[13px] bg-slate-100/50 dark:bg-slate-800/50 border-transparent rounded-xl shadow-none focus:border-orange-500/50 focus:ring-orange-500/20"
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl">
                {(['active', 'resolved'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 text-[12px] font-medium py-1.5 rounded-lg capitalize transition-all',
                      activeTab === tab
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    )}
                  >
                    {tab}
                    {tab === 'active' && unassignedCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-orange-500 text-white text-[9px] font-bold px-1">
                        {unassignedCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {isLoadingQueue ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 mb-3">
                    <UserCheck className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {activeTab === 'active' ? 'No active escalations' : 'No resolved conversations'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 max-w-[180px]">
                    {activeTab === 'active' ? 'All conversations are handled.' : 'Resolved conversations will appear here.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <QueueCard
                    key={conv.conversation_id}
                    conv={conv}
                    selected={selectedId === conv.conversation_id}
                    currentUserId={currentUserId}
                    onClick={() => {
                      setSelectedId(conv.conversation_id)
                      if (window.innerWidth < 1024) setIsSidebarOpen(false)
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Chat panel */}
          {selectedId && selectedConv ? (
            <div className={cn(
              'flex flex-1 flex-col bg-[#F9FAFB] dark:bg-[#0B1120] relative w-full h-full',
              !isSidebarOpen && 'fixed inset-0 z-30 lg:relative'
            )}>

              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 px-4 py-3 sm:px-5 backdrop-blur-xl z-10 sticky top-0 shadow-sm">
                <div className="flex items-center gap-3">
                  {/* Mobile back */}
                  <button
                    className="lg:hidden -ml-1 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setSelectedId(null); setIsSidebarOpen(true) }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>

                  <Avatar className="h-9 w-9 border border-slate-100 dark:border-slate-800">
                    <AvatarFallback className="text-sm font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                      {(selectedConv.customer_name || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h2 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">
                      {selectedConv.customer_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {waitLabel(selectedConv.human_takeover_at)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[11px] text-slate-500 capitalize">{selectedConv.channel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status pills */}
                  {selectedConv.is_resolved ? (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                      <CheckCheck className="h-3 w-3" /> Resolved
                    </span>
                  ) : isAssignedToMe ? (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                      <UserCheck className="h-3 w-3" /> You are handling this
                    </span>
                  ) : isAssignedToOther ? (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-full">
                      <UserCheck className="h-3 w-3" /> Assigned to agent
                    </span>
                  ) : null}

                  {/* Action buttons */}
                  {!selectedConv.is_resolved && canTakeover && (
                    <Button
                      size="sm"
                      onClick={handleTakeover}
                      disabled={isTakingOver}
                      className="h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-semibold px-3 shadow-sm shadow-orange-500/20 hidden sm:flex gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Take Over
                    </Button>
                  )}
                  {!selectedConv.is_resolved && isAssignedToMe && (
                    <Button
                      size="sm"
                      onClick={handleResolve}
                      disabled={isResolving}
                      className="h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold px-3 shadow-sm shadow-emerald-500/20 hidden sm:flex gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Resolve
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
                      {!selectedConv.is_resolved && canTakeover && (
                        <DropdownMenuItem onClick={handleTakeover} className="rounded-lg sm:hidden">
                          <UserPlus className="mr-2 h-4 w-4 text-orange-500" /> Take Over
                        </DropdownMenuItem>
                      )}
                      {!selectedConv.is_resolved && isAssignedToMe && (
                        <DropdownMenuItem onClick={handleResolve} className="rounded-lg sm:hidden">
                          <Check className="mr-2 h-4 w-4 text-emerald-500" /> Resolve
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="rounded-lg text-slate-500">
                        <Phone className="mr-2 h-4 w-4" /> Customer: {selectedConv.customer_id}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Escalation reason banner */}
              {!selectedConv.is_resolved && (
                <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50">
                  <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-orange-800 dark:text-orange-300">Escalation Reason</p>
                    <p className="text-[12px] text-orange-700 dark:text-orange-400">{selectedConv.human_takeover_reason}</p>
                  </div>
                  <span className="ml-auto text-[11px] text-orange-500 flex-shrink-0 whitespace-nowrap">
                    {format(new Date(selectedConv.human_takeover_at), 'HH:mm')}
                  </span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 z-10 relative">
                <div className="mx-auto max-w-3xl space-y-4">
                  {isLoadingDetail ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <span className="text-[13px] text-slate-400">No messages yet</span>
                    </div>
                  ) : (
                    messages.map((msg, index, arr) => {
                      // System message
                      if (msg.sender_type === 'system') {
                        return (
                          <div key={msg._id || msg.timestamp} className="flex items-center gap-3 py-1 select-none">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 whitespace-nowrap">
                              <AlertCircle className="h-3 w-3 text-orange-400 flex-shrink-0" />
                              {msg.message_text}
                            </span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                          </div>
                        )
                      }

                      const isIncoming = msg.sender_type === 'lead'
                      const isNextSame = arr[index + 1]?.sender_type === msg.sender_type
                      const isPrevSame = arr[index - 1]?.sender_type === msg.sender_type

                      const msgDate = new Date(msg.timestamp)
                      const prevDate = index > 0 ? new Date(arr[index - 1].timestamp) : null
                      const showDate = !prevDate || msgDate.toDateString() !== prevDate.toDateString()
                      const dateLabel = isToday(msgDate) ? 'Today' : isYesterday(msgDate) ? 'Yesterday' : format(msgDate, 'MMMM d, yyyy')

                      return (
                        <div key={msg._id || msg.timestamp}>
                          {showDate && (
                            <div className="flex justify-center mb-4 mt-2">
                              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-3 py-1 rounded-full shadow-sm">
                                {dateLabel}
                              </span>
                            </div>
                          )}
                          <div className={cn('flex w-full', isIncoming ? 'justify-start' : 'justify-end', isNextSame ? 'mb-1' : 'mb-4')}>
                            <div className="flex max-w-[80%] sm:max-w-[65%] flex-col gap-0.5">
                              {/* Agent label */}
                              {!isIncoming && msg.metadata?.is_agent && (
                                <div className="flex items-center gap-1 justify-end mb-0.5">
                                  <UserCheck className="h-3 w-3 text-emerald-400" />
                                  <span className="text-[10px] font-medium text-emerald-500">
                                    {msg.sender_name || 'Agent'}
                                  </span>
                                </div>
                              )}
                              {!isIncoming && !msg.metadata?.is_agent && (
                                <div className="flex items-center gap-1 justify-end mb-0.5">
                                  <Bot className="h-3 w-3 text-violet-400" />
                                  <span className="text-[10px] font-medium text-violet-400">AI Agent</span>
                                </div>
                              )}
                              <div className="flex items-end gap-2">
                                {isIncoming && !isNextSame && (
                                  <Avatar className="h-6 w-6 border border-slate-100 dark:border-slate-800 mb-1 flex-shrink-0">
                                    <AvatarFallback className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                                      {(selectedConv.customer_name || 'U')[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                {isIncoming && isNextSame && <div className="w-6 hidden sm:block" />}

                                <div className={cn(
                                  'relative flex flex-col px-4 py-2.5 text-[14px] leading-relaxed shadow-sm',
                                  isIncoming
                                    ? 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl'
                                    : msg.metadata?.is_agent
                                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-emerald-500/10 rounded-2xl'
                                      : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/10 rounded-2xl',
                                  isIncoming
                                    ? cn(isPrevSame && !showDate && 'rounded-tl-md', isNextSame && 'rounded-bl-md')
                                    : cn(isPrevSame && !showDate && 'rounded-tr-md', isNextSame && 'rounded-br-md')
                                )}>
                                  <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                                  <div className={cn(
                                    'mt-1 flex items-center justify-end gap-1 select-none',
                                    isIncoming ? 'text-slate-400' : 'text-white/70'
                                  )}>
                                    <span className="text-[10px] font-medium">{format(new Date(msg.timestamp), 'HH:mm')}</span>
                                    {!isIncoming && <MessageTickIcon status={msg.delivery_status} />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
              </div>

              {/* Input area */}
              <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800 px-4 py-3 sm:px-5 z-10">
                {/* Status banners */}
                {selectedConv.is_resolved && (
                  <div className="mx-auto max-w-3xl mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <CheckCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-[13px] text-emerald-700 dark:text-emerald-300">This conversation has been resolved</span>
                  </div>
                )}
                {!selectedConv.is_resolved && canTakeover && (
                  <div className="mx-auto max-w-3xl mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-[13px] text-orange-700 dark:text-orange-300 flex-1">
                      {isUnassigned ? 'No agent assigned — take over to reply' : 'Assigned to another agent'}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleTakeover}
                      disabled={isTakingOver}
                      className="h-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold px-2.5 flex-shrink-0"
                    >
                      Take Over
                    </Button>
                  </div>
                )}

                <div className="mx-auto max-w-3xl flex items-end gap-2 sm:gap-3">
                  <div className={cn(
                    'flex-1 relative bg-white dark:bg-slate-900 rounded-2xl border shadow-sm transition-all flex items-center pr-2',
                    canReply
                      ? 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50'
                      : 'border-slate-100 dark:border-slate-800'
                  )}>
                    <Textarea
                      placeholder={
                        selectedConv.is_resolved
                          ? 'Conversation resolved'
                          : canTakeover
                            ? 'Take over to send a message…'
                            : `Reply to ${selectedConv.customer_name.split(' ')[0]}…`
                      }
                      value={replyText}
                      disabled={!canReply}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      className="min-h-[44px] max-h-[120px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-4 py-3 text-[14px] scrollbar-hide disabled:opacity-50 disabled:cursor-not-allowed"
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!replyText.trim() || !canReply || isSending}
                    className={cn(
                      'mb-1 h-10 w-10 rounded-full p-0 flex items-center justify-center transition-all shadow-sm',
                      replyText.trim() && canReply
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95 shadow-emerald-500/20'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                    )}
                  >
                    <Send className={cn('h-4 w-4', replyText.trim() && canReply ? 'ml-0.5' : '')} />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className={cn(
              'flex-1 items-center justify-center bg-slate-50/50 dark:bg-slate-900/30',
              !isSidebarOpen ? 'hidden lg:flex' : 'hidden'
            )}>
              <div className="flex flex-col items-center justify-center max-w-sm text-center animate-in fade-in duration-500">
                <div className="relative mb-5">
                  <div className="absolute inset-0 rounded-full bg-orange-100/50 dark:bg-orange-900/20 blur-2xl scale-150 animate-pulse" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 rotate-3">
                    <Phone className="h-9 w-9 text-orange-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Select a conversation</h3>
                <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Choose an escalated conversation from the queue to view the chat and respond as a human agent.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
