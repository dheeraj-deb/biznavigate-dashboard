'use client'

import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, MessageSquare, Phone, MoreVertical, Paperclip, Send, Check, CheckCheck, RefreshCw, X, Image as ImageIcon, UserPlus, AlertCircle, Bot, UserCheck, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useConversations, useCustomerConversations, useSendMessage, useUpdateConversationStatus, useInboxWebSocket, useTakeoverConversation, useResolveConversation, Channel as Platform, GroupedCustomer } from '@/hooks/use-inbox'
import { isToday, isYesterday, format as formatDate } from 'date-fns'
import { useAuthStore } from '@/store/auth-store'

type InboxTab = 'needs' | 'mine' | 'ai' | 'resolved' | 'all'

const queueLabels: Record<InboxTab, { label: string; description: string }> = {
  all: { label: 'All conversations', description: 'Everything in one place' },
  needs: { label: 'Needs attention', description: 'AI or bot asked for help' },
  mine: { label: 'Assigned to me', description: 'Chats owned by you' },
  ai: { label: 'AI handled', description: 'Bot is still replying' },
  resolved: { label: 'Resolved', description: 'Closed conversations' },
}

function getInboxTabFromParam(value: string | null): InboxTab {
  if (value === 'needs' || value === 'priority') return 'needs'
  if (value === 'mine' || value === 'ai' || value === 'resolved' || value === 'all') return value
  return 'all'
}

interface TemplateButton { type: string; text: string }
interface TemplateHeader { type: string; text?: string }
interface TemplateMeta {
  name: string
  language: string
  header?: TemplateHeader
  body: string
  footer?: string
  buttons?: TemplateButton[]
}

function TemplateBubble({ template, timestamp, deliveryStatus }: {
  template: TemplateMeta
  timestamp: string
  deliveryStatus?: string
}) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/10 min-w-[220px] max-w-full">
      {/* Header */}
      {template.header?.type === 'TEXT' && template.header.text && (
        <div className="px-4 pt-3 pb-1 font-semibold text-[14px] leading-snug border-b border-white/10">
          {template.header.text}
        </div>
      )}

      {/* Body */}
      <div className="px-4 pt-2.5 pb-1 text-[14.5px] leading-relaxed whitespace-pre-wrap">
        {template.body}
      </div>

      {/* Footer */}
      {template.footer && (
        <div className="px-4 pb-2 text-[11px] text-blue-100/60">
          {template.footer}
        </div>
      )}

      {/* Timestamp + tick */}
      <div className="px-4 pb-2 flex items-center justify-end gap-1.5 select-none text-blue-100/80">
        <span className="text-[10px] font-medium tracking-wide">
          {formatDate(new Date(timestamp), 'HH:mm')}
        </span>
        <MessageTickIcon status={deliveryStatus} />
      </div>

      {/* Buttons */}
      {template.buttons && template.buttons.length > 0 && (
        <div className="border-t border-white/10">
          {template.buttons.map((btn, i) => (
            <div
              key={i}
              className="px-4 py-2 text-center text-[13px] font-medium text-blue-100 border-b border-white/10 last:border-0 cursor-default select-none"
            >
              {btn.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MessageTickIcon({ status }: { status?: string }) {
  if (!status) return null
  if (status === 'failed') return <X className="h-3.5 w-3.5 text-red-400" />
  if (status === 'sent') return <Check className="h-3.5 w-3.5 opacity-70" />
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 opacity-70" />
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
  return null
}

export default function SocialInboxPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <SocialInboxPage />
    </Suspense>
  )
}

function SocialInboxPage() {
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()
  const currentUserId = user?.user_id || user?.id || ''

  // Socket
  useInboxWebSocket()

  // Queries & Mutations
  const { data: convData, isLoading: isLoadingList, isFetching: isRefreshingList, refetch: refetchConversations } = useConversations({ limit: 100 })
  const messages = convData?.data || []

  const { mutateAsync: sendMessageAsync } = useSendMessage()
  useUpdateConversationStatus() // keep hook registered for cache side-effects
  const { mutateAsync: takeoverAsync, isPending: isTakingOver } = useTakeoverConversation()
  const { mutateAsync: resolveAsync, isPending: isResolving } = useResolveConversation()

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([])

  const {
    data: detailData,
    isLoading: isLoadingDetail,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useCustomerConversations(selectedConversationIds)

  const activeMessages = useMemo(() => {
    if (!detailData?.pages) return []
    const all = detailData.pages.flatMap((p: any) => p?.messages || [])
    return all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [detailData])

  const [activeTab, setActiveTab] = useState<InboxTab>(() => getInboxTabFromParam(searchParams.get('tab') || searchParams.get('queue')))
  const [searchQuery, setSearchQuery] = useState('')
  const [replyText, setReplyText] = useState('')

  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false)
  const [newConversationData, setNewConversationData] = useState({
    name: '',
    phone: '',
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Smart Auto-scroll to bottom logic
  const lastMessageId = activeMessages[activeMessages.length - 1]?.platform_message_id || activeMessages[activeMessages.length - 1]?.timestamp
  const previousLastMessageId = useRef(lastMessageId)

  useEffect(() => {
    // Scroll down instantly on customer switch
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [selectedCustomerId])

  useEffect(() => {
    // Scroll down smoothly if a new message arrives at the bottom
    if (lastMessageId !== previousLastMessageId.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      previousLastMessageId.current = lastMessageId
    }
  }, [lastMessageId])

  // Close sidebar on mobile when a chat is selected
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(!selectedCustomerId)
      } else {
        setIsSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedCustomerId])

  useEffect(() => {
    setActiveTab(getInboxTabFromParam(searchParams.get('tab') || searchParams.get('queue')))
  }, [searchParams])

  // Handle opening specific chat from URL parameters
  useEffect(() => {
    const contactName = searchParams.get('contact')
    const platform = searchParams.get('platform') as Platform | null

    if (contactName && platform && messages.length > 0) {
      // Find the message matching the contact and platform
      const message = messages.find(
        (msg) => msg.sender_name === contactName && msg.channel === platform
      )

      if (message) {
        // Create a temporary grouped customer to select it
        const tempCust: GroupedCustomer = {
          customer_id: message.customer_id,
          sender_name: message.sender_name,
          channels: [message.channel],
          conversation_ids: [message.conversation_id],
          latest_message: message.message_text,
          updated_at: message.updated_at,
          unreadCount: message.unreadCount || 0
        }
        if (!selectedCustomerId || selectedCustomerId !== tempCust.customer_id) {
          handleSelectCustomer(tempCust)
        }
      }
    }
  }, [searchParams, messages, selectedCustomerId]) // removed handleSelectCustomer to prevent infinite loop


  // ── Group Conversations by Customer ──
  const groupedCustomers = messages.reduce<GroupedCustomer[]>((acc, msg) => {
    const existing = acc.find(c => c.customer_id === msg.customer_id)
    if (existing) {
      if (!existing.channels.includes(msg.channel)) {
        existing.channels.push(msg.channel)
      }
      if (!existing.conversation_ids.includes(msg.conversation_id)) {
        existing.conversation_ids.push(msg.conversation_id)
      }
      // Update latest message if this one is newer
      if (new Date(msg.updated_at) > new Date(existing.updated_at)) {
        existing.latest_message = msg.message_text
        existing.updated_at = msg.updated_at
      }
      existing.unreadCount += (msg.unreadCount || 0)
      // Propagate escalation/AI state — any conversation escalated makes the group escalated
      if (msg.needs_attention) {
        existing.needs_attention = true
        if (msg.human_takeover_reason) existing.human_takeover_reason = msg.human_takeover_reason
        if (msg.human_takeover_at) existing.human_takeover_at = msg.human_takeover_at
      }
      // Only mark group resolved if this conversation is resolved AND no active escalation overrides it
      if (msg.is_resolved && !existing.needs_attention) existing.is_resolved = true
      // If any conversation is NOT resolved, the group is not resolved
      if (!msg.is_resolved) existing.is_resolved = false
      if (msg.agent_id) existing.agent_id = msg.agent_id
      if (msg.is_ai_handled === false) existing.is_ai_handled = false
      else if (existing.is_ai_handled === undefined && msg.is_ai_handled) existing.is_ai_handled = true
    } else {
      acc.push({
        customer_id: msg.customer_id,
        sender_name: msg.sender_name,
        contactAvatar: msg.contactAvatar,
        channels: [msg.channel],
        conversation_ids: [msg.conversation_id],
        latest_message: msg.message_text,
        updated_at: msg.updated_at,
        unreadCount: msg.unreadCount || 0,
        is_ai_handled: msg.is_ai_handled,
        needs_attention: msg.needs_attention,
        is_resolved: !!msg.is_resolved,
        agent_id: msg.agent_id,
        human_takeover_reason: msg.human_takeover_reason,
        human_takeover_at: msg.human_takeover_at,
      })
    }
    return acc
  }, [])

  const inboxStats = groupedCustomers.reduce(
    (acc, customer) => {
      const needsAttention = !!customer.needs_attention && !customer.is_resolved
      const isMine = !!currentUserId && customer.agent_id === currentUserId && !customer.is_resolved
      const isAI = !!customer.is_ai_handled && !customer.is_resolved

      if (needsAttention) acc.needs += 1
      if (isMine) acc.mine += 1
      if (isAI) acc.ai += 1
      if (customer.is_resolved) acc.resolved += 1
      acc.unread += customer.unreadCount || 0
      return acc
    },
    { needs: 0, mine: 0, ai: 0, resolved: 0, unread: 0 }
  )

  const queueTabs = [
    {
      key: 'all',
      icon: Inbox,
      count: groupedCustomers.length,
      tone: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      key: 'needs',
      icon: AlertCircle,
      count: inboxStats.needs,
      tone: 'text-orange-600 bg-orange-100 dark:bg-orange-950/50 dark:text-orange-300',
    },
    {
      key: 'mine',
      icon: UserCheck,
      count: inboxStats.mine,
      tone: 'text-blue-600 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300',
    },
    {
      key: 'ai',
      icon: Bot,
      count: inboxStats.ai,
      tone: 'text-violet-600 bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300',
    },
    {
      key: 'resolved',
      icon: CheckCheck,
      count: inboxStats.resolved,
      tone: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
  ] as const

  const filteredCustomers = groupedCustomers.filter((cust) => {
    const matchesSearch = (cust.sender_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust.latest_message || '').toLowerCase().includes(searchQuery.toLowerCase())

    const needsAttention = !!cust.needs_attention && !cust.is_resolved
    const isMine = !!currentUserId && cust.agent_id === currentUserId && !cust.is_resolved
    const isResolved = !!cust.is_resolved
    const isAI = !!cust.is_ai_handled && !cust.is_resolved

    const matchesTab =
      (activeTab === 'needs' && needsAttention) ||
      (activeTab === 'mine' && isMine) ||
      (activeTab === 'ai' && isAI) ||
      (activeTab === 'resolved' && isResolved) ||
      activeTab === 'all'

    return matchesSearch && matchesTab
  })

  // Sort work that needs a person first, then by recency.
  filteredCustomers.sort((a, b) => {
    const aPriority = a.needs_attention && !a.is_resolved ? 1 : 0
    const bPriority = b.needs_attention && !b.is_resolved ? 1 : 0
    if (aPriority !== bPriority) return bPriority - aPriority
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  // Derive selectedCustomer from live query data so real-time cache updates (is_resolved, needs_attention etc.) are always reflected
  const selectedCustomer = selectedCustomerId
    ? (groupedCustomers.find(c => c.customer_id === selectedCustomerId) ?? null)
    : null

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedCustomer || selectedCustomer.conversation_ids.length === 0) return

    const text = replyText
    setReplyText('')

    try {
      // Send on the most recent active channel or first channel available
      const primaryConvId = selectedCustomer.conversation_ids[0]
      await sendMessageAsync({ conversationId: primaryConvId, content: text })
    } catch (err) {
      console.error('Failed to send message', err)
      // Revert reply text on fail if needed
    }
  }

  const handleSelectCustomer = (customer: GroupedCustomer) => {
    setSelectedCustomerId(customer.customer_id)
    setSelectedConversationIds(customer.conversation_ids)
  }

  const handleTakeover = async () => {
    if (!selectedCustomer) return
    await takeoverAsync(selectedCustomer.conversation_ids[0])
  }

  const handleResolve = async () => {
    if (!selectedCustomer) return
    await resolveAsync(selectedCustomer.conversation_ids[0])
  }

  const handleCreateNewConversation = () => {
    if (!newConversationData.name.trim() || !newConversationData.phone.trim()) {
      return
    }

    const newCust: GroupedCustomer = {
      customer_id: newConversationData.phone,
      sender_name: newConversationData.name,
      channels: ['whatsapp'],
      conversation_ids: [`temp_${Date.now()}`],
      latest_message: 'Start a conversation...',
      updated_at: new Date().toISOString(),
      unreadCount: 0
    }

    // Select the new (temporary) conversation for drafting
    setSelectedCustomerId(newCust.customer_id)
    setSelectedConversationIds(newCust.conversation_ids)

    // Reset dialog
    setNewConversationData({
      name: '',
      phone: '',
    })
    setShowNewConversationDialog(false)
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">

        {/* Main Interface */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Conversation List Sidebar */}
          <div className={cn(
            "flex flex-col border-r border-slate-200 bg-white transition-all duration-300 absolute inset-y-0 left-0 z-20 dark:border-slate-800 dark:bg-slate-950 lg:relative",
            isSidebarOpen ? "w-full sm:w-80 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-80"
          )}>

            {/* Sidebar Header */}
            <div className="z-10 space-y-2.5 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight text-slate-950 dark:text-slate-50">Inbox</h2>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {queueLabels[activeTab].label} · {filteredCustomers.length} shown
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="hidden items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 sm:flex">
                    <MessageSquare className="h-3.5 w-3.5" />
                    WhatsApp
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    onClick={() => refetchConversations()}
                    disabled={isRefreshingList}
                  >
                    <RefreshCw className={cn('h-4 w-4', isRefreshingList && 'animate-spin')} />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 w-8 rounded-lg bg-blue-600 p-0 text-white shadow-sm hover:bg-blue-700"
                    onClick={() => setShowNewConversationDialog(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm shadow-none transition-all focus:bg-white focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-950"
                />
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5">
                  {queueTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.key
                    const meta = queueLabels[tab.key]
                    return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                    )}
                    title={meta.description}
                  >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {tab.key === 'all' ? 'All' : tab.key === 'needs' ? 'Needs' : tab.key === 'mine' ? 'Mine' : tab.key === 'resolved' ? 'Done' : 'AI'}
                        </span>
                        <span className={cn('tabular-nums', isActive ? 'text-blue-600 dark:text-blue-200' : 'text-slate-400')}>
                          {tab.count}
                        </span>
                  </button>
                    )
                  })}
                </div>
                {inboxStats.unread > 0 && (
                  <p className="mt-1.5 px-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">{inboxStats.unread} unread messages</p>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-slate-50/60 px-1.5 py-1.5 dark:bg-slate-900/30">
              {isLoadingList && (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl p-3">
                      <div className="h-12 w-12 rounded-full bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
                        <div className="h-3 w-full rounded bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredCustomers.map((customer) => (
                <div
                  key={customer.customer_id}
                  className={cn(
                    'group relative mb-1 flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 transition-colors',
                    selectedCustomer?.customer_id === customer.customer_id
                      ? 'border-blue-200 bg-white shadow-sm dark:border-blue-900/60 dark:bg-slate-950'
                      : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white dark:hover:border-slate-800 dark:hover:bg-slate-950'
                  )}
                  onClick={() => handleSelectCustomer(customer)}
                >
                  {/* Selection Indicator Line */}
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300",
                    selectedCustomer?.customer_id === customer.customer_id ? "h-7 bg-blue-500" : "h-0 bg-transparent"
                  )} />

                  <div className="relative flex-shrink-0">
                    <Avatar className={cn(
                      "h-9 w-9 border transition-all duration-300",
                      selectedCustomer?.customer_id === customer.customer_id ? "border-blue-100 dark:border-blue-900/50" : "border-transparent"
                    )}>
                      <AvatarImage src={customer.contactAvatar} alt={customer.sender_name} />
                      <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-medium text-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300">
                        {customer.contactAvatar ? null : (customer.sender_name || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Platform Icon Badge */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-slate-950 shadow-sm [&_svg]:h-3 [&_svg]:w-3",
                      'bg-emerald-100 dark:bg-emerald-950/50'
                    )}>
                      <MessageSquare className="h-3 w-3 text-emerald-600" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cn(
                        "truncate text-[13px] font-semibold transition-colors",
                        selectedCustomer?.customer_id === customer.customer_id
                          ? "text-slate-950 dark:text-slate-50"
                          : "text-slate-900 dark:text-slate-100"
                      )}>
                        {customer.sender_name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                          {formatDistanceToNow(new Date(customer.updated_at), { addSuffix: false }).replace('about ', '')}
                        </span>
                      </div>
                    </div>

                    <p className={cn(
                      "mt-0.5 truncate text-xs leading-relaxed transition-colors",
                      selectedCustomer?.customer_id === customer.customer_id ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {customer.latest_message}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1.5 min-w-0">
                      <span className="truncate text-[11px] font-medium capitalize text-slate-400">
                        WhatsApp
                      </span>

                      <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                        {customer.is_resolved && (
                          <Badge className="flex h-4 items-center gap-1 rounded-full bg-emerald-100 px-1.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCheck className="h-2.5 w-2.5" />
                            Resolved
                          </Badge>
                        )}
                        {!customer.is_resolved && customer.needs_attention && (
                          <Badge className="flex h-4 items-center gap-1 rounded-full bg-orange-500 px-1.5 text-[9px] font-semibold text-white">
                            <AlertCircle className="h-2.5 w-2.5" />
                            Needs
                          </Badge>
                        )}
                        {!customer.is_resolved && !customer.needs_attention && customer.is_ai_handled && (
                          <Badge className="flex h-4 items-center gap-1 rounded-full bg-violet-100 px-1.5 text-[9px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                            <Bot className="h-2.5 w-2.5" />
                            AI
                          </Badge>
                        )}
                        {customer.unreadCount > 0 && (
                          <Badge className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                            {customer.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!isLoadingList && filteredCustomers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 mb-4">
                    <Inbox className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">No conversations</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
                    Try another queue, search by customer name, or start a new WhatsApp conversation.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation View Area */}
          {selectedCustomer ? (
            <div className={cn(
              "flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 relative w-full h-full",
              !isSidebarOpen && "fixed inset-0 z-30 lg:relative"
            )}>
              {/* Chat Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Mobile Back Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden -ml-2 h-9 w-9 text-slate-500"
                    onClick={() => {
                      setSelectedCustomerId(null)
                      setSelectedConversationIds([])
                      setIsSidebarOpen(true)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </Button>

                  <Avatar className="h-9 w-9 flex-shrink-0 border border-slate-100 dark:border-slate-800">
                    <AvatarImage src={selectedCustomer.contactAvatar} alt={selectedCustomer.sender_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 font-medium">
                      {(selectedCustomer.sender_name || 'U')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col justify-center">
                    <h2 className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                      {selectedCustomer.sender_name}
                    </h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 [&_svg]:h-3 [&_svg]:w-3">
                        <MessageSquare className="h-3 w-3 text-emerald-600" />
                        <span>WhatsApp</span>
                      </div>
                      {selectedCustomer.is_resolved ? (
                        <div className="flex items-center gap-1 rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <CheckCheck className="h-3 w-3" />
                          Resolved
                        </div>
                      ) : selectedCustomer.needs_attention ? (
                        <div className="flex items-center gap-1 rounded-sm bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
                          <AlertCircle className="h-3 w-3" />
                          Needs attention
                        </div>
                      ) : selectedCustomer.is_ai_handled ? (
                        <div className="flex items-center gap-1 rounded-sm bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                          <Bot className="h-3 w-3" />
                          AI handling
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                          <UserCheck className="h-3 w-3" />
                          Human inbox
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
                  {/* Escalation action buttons */}
                  {selectedCustomer.needs_attention && !selectedCustomer.is_resolved && (
                    <Button
                      size="sm"
                      onClick={handleTakeover}
                      disabled={isTakingOver}
                      className="hidden h-8 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 sm:flex"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Take Over
                    </Button>
                  )}
                  {!selectedCustomer.is_resolved && !selectedCustomer.is_ai_handled && selectedCustomer.needs_attention && (
                    <Button
                      size="sm"
                      onClick={handleResolve}
                      disabled={isResolving}
                      className="hidden h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-600 sm:flex"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Resolve
                    </Button>
                  )}
                  {selectedCustomer.is_resolved && (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                      <CheckCheck className="h-3 w-3" />
                      Resolved
                    </span>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <Phone className="h-[18px] w-[18px]" />
                  </Button>
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <MoreVertical className="h-[18px] w-[18px]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none">
                      <DropdownMenuLabel className="text-xs text-slate-500 font-medium px-2">Manage Chat</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                      {selectedCustomer.needs_attention && !selectedCustomer.is_resolved && (
                        <DropdownMenuItem onClick={handleTakeover} className="rounded-lg cursor-pointer focus:bg-orange-50 dark:focus:bg-orange-950/30">
                          <UserPlus className="mr-2 h-4 w-4 text-orange-500" /> Take over
                        </DropdownMenuItem>
                      )}
                      {!selectedCustomer.is_resolved && !selectedCustomer.is_ai_handled && (
                        <DropdownMenuItem onClick={handleResolve} className="rounded-lg cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-950/30">
                          <Check className="mr-2 h-4 w-4 text-emerald-500" /> Mark resolved
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => refetchConversations()} className="rounded-lg cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50">
                        <RefreshCw className="mr-2 h-4 w-4 text-slate-400" /> Refresh thread
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="mx-auto max-w-4xl space-y-4">
                  {selectedCustomer.needs_attention && !selectedCustomer.is_resolved && selectedCustomer.human_takeover_reason && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 shadow-sm dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                        <div className="min-w-0">
                          <p className="font-semibold">Why this needs a person</p>
                          <p className="mt-1 leading-relaxed">{selectedCustomer.human_takeover_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Infinite Scroll Observer / Loader */}
                  {(hasNextPage || isFetchingNextPage) && (
                    <div ref={loadMoreRef} className="h-8 w-full flex items-center justify-center py-2">
                      {isFetchingNextPage && <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />}
                    </div>
                  )}

                  {isLoadingDetail && !isFetchingNextPage ? (
                    <div className="flex justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    activeMessages.map((msg: any, index: number, arr: any[]) => {
                      // System messages render as a centered divider
                      if (msg.sender_type === 'system') {
                        return (
                          <div key={msg.platform_message_id || msg.timestamp} className="flex items-center gap-3 py-1 select-none">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 whitespace-nowrap">
                              <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                              {msg.message_text}
                            </span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                          </div>
                        )
                      }

                      const isIncoming = msg.sender_type === 'lead';
                      const isNextIncoming = arr[index + 1]?.sender_type === 'lead';
                      const isPrevIncoming = arr[index - 1]?.sender_type === 'lead';
                      const isNextSameSender = isNextIncoming === isIncoming;
                      const isPrevSameSender = isPrevIncoming === isIncoming;

                      const msgDate = new Date(msg.timestamp)
                      const prevMsgDate = index > 0 ? new Date(arr[index - 1].timestamp) : null

                      // Check if date boundary crossed to show date divider
                      let showDateDivider = false
                      let dateText = ''

                      if (!prevMsgDate || msgDate.toDateString() !== prevMsgDate.toDateString()) {
                        showDateDivider = true
                        if (isToday(msgDate)) {
                          dateText = 'Today'
                        } else if (isYesterday(msgDate)) {
                          dateText = 'Yesterday'
                        } else {
                          dateText = formatDate(msgDate, 'MMMM d, yyyy')
                        }
                      }

                      return (
                        <div key={msg.platform_message_id || msg.timestamp}>
                          {showDateDivider && (
                            <div className="flex justify-center mb-6 mt-4">
                              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-3 py-1 rounded-full shadow-sm shadow-slate-200/10">
                                {dateText}
                              </span>
                            </div>
                          )}
                          <div
                            className={cn(
                              'flex w-full',
                              isIncoming ? 'justify-start' : 'justify-end',
                              isNextSameSender ? 'mb-1' : 'mb-6' // tighter spacing for same sender
                            )}
                          >
                            <div className="flex max-w-[85%] sm:max-w-[70%] flex-col gap-0.5">
                              {/* AI sender label */}
                              {!isIncoming && msg.metadata?.is_ai && (
                                <div className="flex items-center gap-1 justify-end mb-0.5">
                                  <Bot className="h-3 w-3 text-violet-400" />
                                  <span className="text-[10px] font-medium text-violet-400 dark:text-violet-500">AI Agent</span>
                                </div>
                              )}
                            <div className="flex items-end gap-2 group/msg">
                              {/* Avatar for Incoming Messages */}
                              {isIncoming && !isNextSameSender && (
                                <Avatar className="h-6 w-6 border border-slate-100 dark:border-slate-800 mb-1 flex-shrink-0">
                                  <AvatarImage src={selectedCustomer.contactAvatar} />
                                  <AvatarFallback className="text-[10px] bg-slate-100 dark:bg-slate-800">{(selectedCustomer.sender_name || 'U')[0]}</AvatarFallback>
                                </Avatar>
                              )}
                              {isIncoming && isNextSameSender && <div className="w-6 hidden sm:block" />} {/* Spacer */}

                              {/* Message Bubble */}
                              <div
                                className={cn(
                                  'relative flex flex-col px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm transition-all',

                                  isIncoming
                                    ? 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                                    : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/10',

                                  // Dynamic border radius for message grouping
                                  isIncoming
                                    ? cn(
                                      'rounded-2xl',
                                      isPrevSameSender && !showDateDivider && 'rounded-tl-md',
                                      isNextSameSender && 'rounded-bl-md'
                                    )
                                    : cn(
                                      'rounded-2xl',
                                      isPrevSameSender && !showDateDivider && 'rounded-tr-md',
                                      isNextSameSender && 'rounded-br-md'
                                    )
                                )}
                              >
                                {msg.message_type === 'template' && msg.metadata?.template ? (
                                  <TemplateBubble
                                    template={msg.metadata.template}
                                    timestamp={msg.timestamp}
                                    deliveryStatus={msg.delivery_status}
                                  />
                                ) : (
                                  <>
                                    <p className="whitespace-pre-wrap word-break-word font-inter">{msg.message_text}</p>

                                    {/* Metadata inside bubble */}
                                    <div className={cn(
                                      "mt-1 flex items-center justify-end gap-1.5 select-none",
                                      isIncoming ? "text-slate-400" : "text-blue-100/80"
                                    )}>
                                      <span className="text-[10px] font-medium tracking-wide">
                                        {formatDate(new Date(msg.timestamp), 'HH:mm')}
                                      </span>
                                      {!isIncoming && <MessageTickIcon status={msg.delivery_status} />}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </div>


              {/* Input Area */}
              <div className="z-10 mt-auto border-t border-slate-200/60 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950 sm:px-4">
                {selectedCustomer?.is_resolved && !selectedCustomer?.needs_attention && (
                  <div className="mx-auto mb-2 flex max-w-4xl items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CheckCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-[13px] text-emerald-700 dark:text-emerald-300">This conversation has been resolved</span>
                  </div>
                )}
                {!selectedCustomer?.is_resolved && selectedCustomer?.is_ai_handled && (
                  <div className="mx-auto mb-2 flex max-w-4xl items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 dark:border-violet-800 dark:bg-violet-950/30">
                    <Bot className="h-4 w-4 text-violet-500 flex-shrink-0" />
                    <span className="text-[13px] text-violet-700 dark:text-violet-300">AI is handling this conversation</span>
                  </div>
                )}
                {!selectedCustomer?.is_resolved && selectedCustomer?.needs_attention && !selectedCustomer?.is_ai_handled && (
                  <div className="mx-auto mb-2 flex max-w-4xl items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 dark:border-orange-800 dark:bg-orange-950/30">
                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-[13px] text-orange-700 dark:text-orange-300 flex-1">Escalated — customer needs human support</span>
                    <Button size="sm" onClick={handleTakeover} disabled={isTakingOver} className="h-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold px-2.5 sm:hidden">
                      Take Over
                    </Button>
                  </div>
                )}
                <div className="mx-auto max-w-4xl relative flex items-end gap-2 sm:gap-3">

                  {/* Attachment Menus */}
                  <div className="mb-1 flex gap-1">
                    <Button variant="ghost" size="icon" className="hidden h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 sm:flex">
                      <Paperclip className="h-[18px] w-[18px]" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 sm:flex">
                      <ImageIcon className="h-[18px] w-[18px]" />
                    </Button>

                    {/* Mobile combo button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-32">
                        <DropdownMenuItem><Paperclip className="mr-2 h-4 w-4" /> Document</DropdownMenuItem>
                        <DropdownMenuItem><ImageIcon className="mr-2 h-4 w-4" /> Image/Video</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Input Box */}
                  <div className="group relative flex flex-1 items-center rounded-xl border border-slate-200 bg-white pr-2 shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 dark:border-slate-700 dark:bg-slate-900">
                    <Textarea
                      placeholder={selectedCustomer?.is_resolved && !selectedCustomer?.needs_attention ? 'Conversation resolved' : selectedCustomer?.is_ai_handled ? 'AI is responding…' : `Draft a message to ${(selectedCustomer.sender_name || 'Customer').split(' ')[0]}...`}
                      value={replyText}
                      disabled={!!selectedCustomer?.is_ai_handled || (!!selectedCustomer?.is_resolved && !selectedCustomer?.needs_attention)}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="min-h-10 max-h-[100px] w-full resize-none border-0 bg-transparent px-3 py-2.5 text-sm scrollbar-hide focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={1}
                    />

                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!replyText.trim() || !!selectedCustomer?.is_ai_handled || (!!selectedCustomer?.is_resolved && !selectedCustomer?.needs_attention)}
                    className={cn(
                      "mb-1 flex h-10 w-10 items-center justify-center rounded-xl p-0 shadow-sm shadow-blue-500/20 transition-all",
                      replyText.trim()
                        ? "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <Send className={cn("h-4 w-4 sm:h-4.5 sm:w-4.5", replyText.trim() ? "ml-1" : "")} />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Area */
            <div className={cn(
              "hidden flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 lg:flex",
              !isSidebarOpen && "lg:flex"
            )}>
              <div className="flex max-w-sm flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  Pick a conversation
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Select a customer on the left to read the thread, take over from AI, or reply.
                </p>
                <Button
                  onClick={() => setShowNewConversationDialog(true)}
                  variant="outline"
                  className="mt-6 rounded-lg border-slate-200 px-4 font-medium text-slate-700 shadow-sm transition-all hover:border-blue-500/50 hover:bg-blue-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/10"
                >
                  <UserPlus className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                  New conversation
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent className="max-w-md p-6 rounded-2xl gap-6">
          <DialogHeader className="gap-1.5 space-y-0">
            <DialogTitle className="text-xl">Start New Conversation</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new direct conversation to reach out to a customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                Contact Name
              </label>
              <Input
                placeholder="Enter customer name"
                value={newConversationData.name}
                onChange={(e) =>
                  setNewConversationData(prev => ({ ...prev, name: e.target.value }))
                }
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <Input
                placeholder="+91 98765 43210"
                value={newConversationData.phone}
                onChange={(e) =>
                  setNewConversationData(prev => ({ ...prev, phone: e.target.value }))
                }
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                Channel
              </label>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleCreateNewConversation}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                disabled={!newConversationData.name.trim() || !newConversationData.phone.trim()}
              >
                Start Chat Setup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
}
