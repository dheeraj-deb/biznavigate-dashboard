'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Search,
  Filter,
  MessageSquare,
  Instagram,
  Send,
  Sparkles,
  Tag,
  UserPlus,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Clock,
  CheckCheck,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  Phone,
  Video,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'

// Mock data types
type Platform = 'whatsapp' | 'instagram' | 'comment'
type MessageStatus = 'unread' | 'read' | 'replied'
type Priority = 'high' | 'medium' | 'low'

interface Message {
  id: string
  contactName: string
  contactAvatar?: string
  platform: Platform
  lastMessage: string
  timestamp: Date
  status: MessageStatus
  priority?: Priority
  tags?: string[]
  isStarred?: boolean
  unreadCount?: number
}

interface ConversationMessage {
  id: string
  content: string
  timestamp: Date
  isIncoming: boolean
  status?: 'sent' | 'delivered' | 'read'
  attachments?: { type: 'image' | 'file'; url: string; name?: string }[]
}

// Mock messages data
const mockMessages: Message[] = [
  {
    id: '1',
    contactName: 'Priya Sharma',
    contactAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    platform: 'whatsapp',
    lastMessage: 'Hi! I\'m interested in your summer collection. Do you have it in blue?',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'unread',
    priority: 'high',
    tags: ['product-inquiry', 'new-lead'],
    unreadCount: 3,
  },
  {
    id: '2',
    contactName: 'Rahul Verma',
    platform: 'instagram',
    lastMessage: 'What are your delivery charges to Mumbai?',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    status: 'unread',
    tags: ['shipping-query'],
    unreadCount: 1,
  },
  {
    id: '3',
    contactName: 'Anjali Patel',
    contactAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
    platform: 'whatsapp',
    lastMessage: 'Thanks for the quick response! I\'ll place the order soon.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'replied',
    isStarred: true,
    tags: ['hot-lead'],
  },
  {
    id: '4',
    contactName: 'Sarah Wilson',
    platform: 'comment',
    lastMessage: 'Beautiful products! Where can I buy this?',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'unread',
    priority: 'medium',
    unreadCount: 1,
  },
  {
    id: '5',
    contactName: 'Amit Kumar',
    contactAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
    platform: 'whatsapp',
    lastMessage: 'Is this still available?',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'read',
    tags: ['follow-up'],
  },
]

// Mock conversation data
const mockConversation: ConversationMessage[] = [
  {
    id: '1',
    content: 'Hi! I\'m interested in your summer collection. Do you have it in blue?',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    isIncoming: true,
  },
  {
    id: '2',
    content: 'Yes! We have the summer collection in multiple shades of blue. Would you like to see some images?',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    isIncoming: false,
    status: 'read',
  },
  {
    id: '3',
    content: 'Yes please! Also, what\'s the price range?',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    isIncoming: true,
  },
]

// AI suggested responses - context-aware based on conversation
const getAiSuggestions = (lastMessage: string, platform: Platform) => {
  const lowerMessage = lastMessage.toLowerCase()

  // Product inquiry suggestions
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    return [
      'Our prices range from ₹999 to ₹4,999. I can share detailed pricing with images. Would you like to see?',
      'Great question! Let me send you our complete price list with product details.',
      'We have various options in different price ranges. What\'s your budget?',
    ]
  }

  // Product availability suggestions
  if (lowerMessage.includes('available') || lowerMessage.includes('stock') || lowerMessage.includes('have')) {
    return [
      'Yes! We have this in stock. Would you like to place an order?',
      'Currently available in multiple colors and sizes. Which one would you prefer?',
      'We have limited stock left. I can reserve one for you right away!',
    ]
  }

  // Interest/inquiry suggestions
  if (lowerMessage.includes('interested') || lowerMessage.includes('want') || lowerMessage.includes('need')) {
    return [
      'Wonderful! Let me share more details about this product. When would you like to receive it?',
      'Great choice! I can send you high-quality images and full specifications.',
      'Perfect! Would you like to know about our current offers and discounts?',
    ]
  }

  // Shipping/delivery suggestions
  if (lowerMessage.includes('deliver') || lowerMessage.includes('shipping') || lowerMessage.includes('ship')) {
    return [
      'We offer free delivery within 2-3 business days. What\'s your location?',
      'Delivery is available across India. Share your pincode and I\'ll confirm delivery time.',
      'We provide express shipping! Your order can reach you in 24-48 hours.',
    ]
  }

  // Default friendly responses
  return [
    'Thank you for your interest! How can I help you with this product?',
    'I\'d be happy to assist you. What would you like to know?',
    'Great to hear from you! Let me know if you need any specific details.',
  ]
}

export default function SocialInboxPage() {
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [conversations, setConversations] = useState<Record<string, ConversationMessage[]>>({
    '1': mockConversation,
    '2': [],
    '3': [],
    '4': [],
    '5': [],
  })
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(mockMessages[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [replyText, setReplyText] = useState('')
  const [showAiSuggestions, setShowAiSuggestions] = useState(true)
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false)
  const [newConversationData, setNewConversationData] = useState({
    name: '',
    phone: '',
    platform: 'whatsapp' as Platform,
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, selectedMessage])

  // Handle opening specific chat from URL parameters
  useEffect(() => {
    const contactName = searchParams.get('contact')
    const platform = searchParams.get('platform') as Platform | null

    if (contactName && platform) {
      // Find the message matching the contact and platform
      const message = messages.find(
        (msg) => msg.contactName === contactName && msg.platform === platform
      )

      if (message) {
        handleSelectMessage(message)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, messages])

  // Get AI suggestions based on selected conversation
  const currentAiSuggestions = selectedMessage
    ? getAiSuggestions(selectedMessage.lastMessage, selectedMessage.platform)
    : []

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'instagram':
        return <Instagram className="h-4 w-4 text-purple-600" />
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
    }
  }

  const getPlatformBadge = (platform: Platform) => {
    const configs = {
      whatsapp: { label: 'WhatsApp', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
      instagram: { label: 'Instagram', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
      comment: { label: 'Comment', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
    }
    const config = configs[platform]
    return (
      <Badge variant="secondary" className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: MessageStatus) => {
    const configs = {
      unread: { label: 'New', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
      read: { label: 'Read', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
      replied: { label: 'Replied', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
    }
    const config = configs[status]
    return (
      <Badge variant="secondary" className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    )
  }

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = msg.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         msg.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleSendMessage = () => {
    if (!replyText.trim() || !selectedMessage) return

    // Create new message
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      content: replyText,
      timestamp: new Date(),
      isIncoming: false,
      status: 'sent',
    }

    // Update conversation
    setConversations(prev => ({
      ...prev,
      [selectedMessage.id]: [...(prev[selectedMessage.id] || []), newMessage],
    }))

    // Update message list - mark as replied and update last message
    setMessages(prev =>
      prev.map(msg =>
        msg.id === selectedMessage.id
          ? {
              ...msg,
              status: 'replied' as MessageStatus,
              lastMessage: replyText,
              timestamp: new Date(),
              unreadCount: 0,
            }
          : msg
      )
    )

    // Update selected message
    setSelectedMessage(prev =>
      prev
        ? {
            ...prev,
            status: 'replied' as MessageStatus,
            lastMessage: replyText,
            timestamp: new Date(),
            unreadCount: 0,
          }
        : null
    )

    setReplyText('')
    setShowAiSuggestions(true)
  }

  const handleUseSuggestion = (suggestion: string) => {
    setReplyText(suggestion)
    setShowAiSuggestions(false)
  }

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message)

    // Mark message as read if it was unread
    if (message.status === 'unread') {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === message.id
            ? { ...msg, status: 'read' as MessageStatus, unreadCount: 0 }
            : msg
        )
      )
    }
  }

  const handleCreateNewConversation = () => {
    if (!newConversationData.name.trim() || !newConversationData.phone.trim()) {
      return
    }

    const newId = (messages.length + 1).toString()
    const newMessage: Message = {
      id: newId,
      contactName: newConversationData.name,
      platform: newConversationData.platform,
      lastMessage: 'Start a conversation...',
      timestamp: new Date(),
      status: 'read',
    }

    // Add to messages list
    setMessages(prev => [newMessage, ...prev])

    // Initialize empty conversation
    setConversations(prev => ({
      ...prev,
      [newId]: [],
    }))

    // Select the new conversation
    setSelectedMessage(newMessage)

    // Reset dialog
    setNewConversationData({
      name: '',
      phone: '',
      platform: 'whatsapp',
    })
    setShowNewConversationDialog(false)
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {/* Header */}
        <div className="border-b bg-white dark:bg-gray-950 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Social Inbox</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage all your customer conversations in one place
              </p>
            </div>
            <Button size="sm" onClick={() => setShowNewConversationDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              New Conversation
            </Button>
          </div>

          {/* Search Only */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Messages List */}
          <div className="w-96 overflow-y-auto border-r bg-gray-50 dark:bg-gray-900">
            <div className="p-2">
              {filteredMessages.map((message) => (
                <Card
                  key={message.id}
                  className={cn(
                    'mb-2 cursor-pointer transition-all hover:shadow-md',
                    selectedMessage?.id === message.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'bg-white dark:bg-gray-950'
                  )}
                  onClick={() => handleSelectMessage(message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={message.contactAvatar} alt={message.contactName} />
                          <AvatarFallback>{message.contactName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 dark:bg-gray-950">
                          {getPlatformIcon(message.platform)}
                        </div>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {message.contactName}
                          </h3>
                          {message.isStarred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        </div>

                        <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                          {message.lastMessage}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {getPlatformBadge(message.platform)}
                          {getStatusBadge(message.status)}
                          {message.priority && (
                            <Badge variant="secondary" className="text-xs">
                              {message.priority}
                            </Badge>
                          )}
                        </div>

                        {message.tags && message.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                <Tag className="mr-1 h-2.5 w-2.5" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                          <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
                          {message.unreadCount && message.unreadCount > 0 && (
                            <Badge className="h-5 rounded-full bg-blue-600 px-2 text-xs">
                              {message.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No conversations found</p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation View */}
          {selectedMessage ? (
            <div className="flex flex-1 flex-col bg-white dark:bg-gray-950">
              {/* Conversation Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedMessage.contactAvatar} alt={selectedMessage.contactName} />
                    <AvatarFallback>{selectedMessage.contactName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedMessage.contactName}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      {getPlatformIcon(selectedMessage.platform)}
                      <span>
                        {selectedMessage.platform === 'whatsapp'
                          ? 'WhatsApp'
                          : selectedMessage.platform === 'instagram'
                          ? 'Instagram DM'
                          : 'Instagram Comment'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convert to Lead
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Star className="mr-2 h-4 w-4" />
                        Star Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Tag className="mr-2 h-4 w-4" />
                        Add Tags
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
                <div className="mx-auto max-w-3xl space-y-4">
                  {(conversations[selectedMessage.id] || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.isIncoming ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-lg px-4 py-2',
                          msg.isIncoming
                            ? 'bg-white dark:bg-gray-950'
                            : 'bg-blue-600 text-white'
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
                          <span>{format(msg.timestamp, 'HH:mm')}</span>
                          {!msg.isIncoming && msg.status && (
                            <CheckCheck
                              className={cn(
                                'h-3 w-3',
                                msg.status === 'read' && 'text-blue-200'
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* AI Suggestions */}
              {showAiSuggestions && currentAiSuggestions.length > 0 && (
                <div className="border-t bg-gradient-to-r from-purple-50 to-indigo-50 p-3 dark:from-purple-950/20 dark:to-indigo-950/20">
                  <div className="mx-auto max-w-3xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-400">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      AI Suggested Responses
                      <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs px-2 py-0">
                        Smart
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {currentAiSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleUseSuggestion(suggestion)}
                          className="group w-full rounded-md border border-purple-200 bg-white px-2.5 py-2 text-left text-xs transition-all hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm dark:border-purple-800 dark:bg-gray-950 dark:hover:border-purple-600 dark:hover:bg-purple-950/30"
                        >
                          <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-purple-500 dark:text-purple-400" />
                            <span className="flex-1 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white leading-snug">
                              {suggestion}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reply Box */}
              <div className="border-t bg-white p-4 dark:bg-gray-950">
                <div className="mx-auto max-w-3xl">
                  <div className="flex items-end gap-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        className="min-h-[60px] resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                        className={cn(
                          showAiSuggestions && 'bg-purple-100 text-purple-700 dark:bg-purple-950'
                        )}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleSendMessage} disabled={!replyText.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Select a conversation
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Create a new conversation with a customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Contact Name
              </label>
              <Input
                placeholder="Enter customer name"
                value={newConversationData.name}
                onChange={(e) =>
                  setNewConversationData(prev => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <Input
                placeholder="+91 98765 43210"
                value={newConversationData.phone}
                onChange={(e) =>
                  setNewConversationData(prev => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Platform
              </label>
              <Select
                value={newConversationData.platform}
                onValueChange={(value: Platform) =>
                  setNewConversationData(prev => ({ ...prev, platform: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-purple-600" />
                      Instagram
                    </div>
                  </SelectItem>
                  <SelectItem value="comment">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      Comment
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowNewConversationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewConversation}
              disabled={!newConversationData.name.trim() || !newConversationData.phone.trim()}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
