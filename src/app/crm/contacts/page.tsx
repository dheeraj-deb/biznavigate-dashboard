'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Plus,
  Search,
  Settings,
  MessageCircle,
  FileText,
  Eye,
  X,
  Phone,
  Instagram,
  Clock,
  Tag,
  ShoppingBag,
  Calendar,
  Filter,
} from 'lucide-react'
import Image from 'next/image'

type Platform = 'whatsapp' | 'instagram' | 'all'
type LeadStage = 'new' | 'in_progress' | 'converted' | 'follow_up' | 'all'

interface Contact {
  id: string
  name: string
  phone: string
  instagram?: string
  platform: 'whatsapp' | 'instagram'
  stage: LeadStage
  tags: string[]
  lastInteraction: string
  avatar?: string
  initials: string
  orders: number
  totalSpent: number
  notes: string[]
  timeline: TimelineEvent[]
}

interface TimelineEvent {
  id: string
  type: 'whatsapp' | 'instagram' | 'order' | 'note'
  message: string
  timestamp: Date
}

interface FilterState {
  platform: Platform
  stage: LeadStage
  dateRange: string
  activeTags: string[]
}

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    instagram: '@priya.sharma',
    platform: 'whatsapp',
    stage: 'new',
    tags: ['New Lead', 'Fashion'],
    lastInteraction: '2h ago',
    initials: 'PS',
    orders: 0,
    totalSpent: 0,
    notes: ['Interested in summer collection', 'Follow up on Friday'],
    timeline: [
      {
        id: '1',
        type: 'whatsapp',
        message: 'Inquired about product availability',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    phone: '+91 98765 43211',
    instagram: '@rahul_mehta',
    platform: 'instagram',
    stage: 'converted',
    tags: ['VIP', 'Repeated Buyer'],
    lastInteraction: '1d ago',
    initials: 'RM',
    orders: 5,
    totalSpent: 25000,
    notes: ['Prefers COD', 'Always orders in bulk'],
    timeline: [
      {
        id: '1',
        type: 'order',
        message: 'Placed order #1234 - ₹5,000',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        type: 'instagram',
        message: 'Sent DM about new arrivals',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: '3',
    name: 'Anjali Gupta',
    phone: '+91 98765 43212',
    platform: 'whatsapp',
    stage: 'in_progress',
    tags: ['Follow Up', 'Electronics'],
    lastInteraction: '5h ago',
    initials: 'AG',
    orders: 1,
    totalSpent: 8000,
    notes: ['Payment pending', 'Send reminder tomorrow'],
    timeline: [
      {
        id: '1',
        type: 'whatsapp',
        message: 'Discussed product specifications',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: '4',
    name: 'Vikram Singh',
    phone: '+91 98765 43213',
    instagram: '@vikram.singh',
    platform: 'instagram',
    stage: 'follow_up',
    tags: ['Follow Up'],
    lastInteraction: '3d ago',
    initials: 'VS',
    orders: 2,
    totalSpent: 12000,
    notes: ['Interested in premium products'],
    timeline: [],
  },
  {
    id: '5',
    name: 'Neha Kapoor',
    phone: '+91 98765 43214',
    instagram: '@neha_kapoor',
    platform: 'whatsapp',
    stage: 'converted',
    tags: ['VIP', 'Fashion', 'Repeated Buyer'],
    lastInteraction: '30m ago',
    initials: 'NK',
    orders: 8,
    totalSpent: 45000,
    notes: ['Premium customer', 'Always leaves reviews'],
    timeline: [
      {
        id: '1',
        type: 'whatsapp',
        message: 'Confirmed delivery address',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  },
  {
    id: '6',
    name: 'Arjun Reddy',
    phone: '+91 98765 43215',
    platform: 'instagram',
    instagram: '@arjun_reddy',
    stage: 'new',
    tags: ['New Lead'],
    lastInteraction: '1h ago',
    initials: 'AR',
    orders: 0,
    totalSpent: 0,
    notes: [],
    timeline: [
      {
        id: '1',
        type: 'instagram',
        message: 'Commented on product post',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
    ],
  },
]

export default function ContactsPage() {
  const [contacts] = useState<Contact[]>(mockContacts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    platform: 'all',
    stage: 'all',
    dateRange: 'all',
    activeTags: [],
  })

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.instagram?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPlatform =
      filters.platform === 'all' || contact.platform === filters.platform

    const matchesStage =
      filters.stage === 'all' || contact.stage === filters.stage

    const matchesTags =
      filters.activeTags.length === 0 ||
      filters.activeTags.some((tag) => contact.tags.includes(tag))

    return matchesSearch && matchesPlatform && matchesStage && matchesTags
  })

  // Get available tags
  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)))

  // Toggle tag filter
  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      activeTags: prev.activeTags.includes(tag)
        ? prev.activeTags.filter((t) => t !== tag)
        : [...prev.activeTags, tag],
    }))
  }

  // Remove tag filter
  const removeTagFilter = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      activeTags: prev.activeTags.filter((t) => t !== tag),
    }))
  }

  // Open contact details
  const openContactDetails = (contact: Contact) => {
    setSelectedContact(contact)
    setShowDetailsModal(true)
  }

  // Get stage badge color
  const getStageBadge = (stage: LeadStage) => {
    switch (stage) {
      case 'new':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
      case 'converted':
        return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
      case 'follow_up':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400'
    }
  }

  // Get stage label
  const getStageLabel = (stage: LeadStage) => {
    switch (stage) {
      case 'new':
        return 'New'
      case 'in_progress':
        return 'In Progress'
      case 'converted':
        return 'Converted'
      case 'follow_up':
        return 'Follow-Up'
      default:
        return stage
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your WhatsApp & Instagram contacts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-300 dark:border-gray-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => setShowAddContact(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, phone, Instagram username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>

            {/* Platform Filter */}
            <Select
              value={filters.platform}
              onValueChange={(value: Platform) =>
                setFilters((prev) => ({ ...prev, platform: value }))
              }
            >
              <SelectTrigger className="w-[140px] h-9 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>

            {/* Stage Filter */}
            <Select
              value={filters.stage}
              onValueChange={(value: LeadStage) =>
                setFilters((prev) => ({ ...prev, stage: value }))
              }
            >
              <SelectTrigger className="w-[150px] h-9 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Lead Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="follow_up">Follow-Up</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select
              value={filters.dateRange}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger className="w-[140px] h-9 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Tags Filter Dropdown */}
            <Select onValueChange={toggleTag}>
              <SelectTrigger className="w-[120px] h-9 border-gray-300 dark:border-gray-700">
                <Tag className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Chips */}
          {filters.activeTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Active filters:
              </span>
              {filters.activeTags.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 pl-2 pr-1 py-1 gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTagFilter(tag)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-900 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, activeTags: [] }))}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Contacts List */}
        <div className="grid gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white dark:bg-gray-950 rounded-xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="flex items-center justify-between">
                {/* Left: Profile Info */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-lg">
                    {contact.initials}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {contact.name}
                      </h3>
                      <Badge className={getStageBadge(contact.stage)}>
                        {getStageLabel(contact.stage)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </div>
                      {contact.instagram && (
                        <div className="flex items-center gap-1">
                          <Instagram className="h-4 w-4" />
                          {contact.instagram}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {contact.platform === 'whatsapp' ? (
                          <>
                            <Image
                              src="/icons/whatsapp.png"
                              alt="WhatsApp"
                              width={14}
                              height={14}
                              className="opacity-70"
                            />
                            <span>WhatsApp</span>
                          </>
                        ) : (
                          <>
                            <Image
                              src="/icons/instagram.png"
                              alt="Instagram"
                              width={14}
                              height={14}
                              className="opacity-70"
                            />
                            <span>Instagram</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {contact.lastInteraction}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-700"
                    onClick={() => {
                      const phone = contact.phone.replace(/\s+/g, '')
                      window.open(`https://wa.me/${phone}`, '_blank')
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-700"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                    onClick={() => openContactDetails(contact)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {contact.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-900 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                No contacts found matching your filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-2xl">
                  {selectedContact.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedContact.name}
                    </h2>
                    <Select defaultValue={selectedContact.stage}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="follow_up">Follow-Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedContact.phone}
                    </div>
                    {selectedContact.instagram && (
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        {selectedContact.instagram}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {selectedContact.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <Button className="bg-green-600 hover:bg-green-700 text-white flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp Message
                </Button>
                <Button className="bg-pink-600 hover:bg-pink-700 text-white flex-1">
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram DM
                </Button>
                <Button variant="outline" className="flex-1">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>
                <Button variant="outline" className="flex-1">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </div>

              {/* Timeline Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Activity Timeline
                </h3>
                <div className="space-y-4">
                  {selectedContact.timeline.length > 0 ? (
                    selectedContact.timeline.map((event) => (
                      <div
                        key={event.id}
                        className="flex gap-3 items-start"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                          {event.type === 'whatsapp' && (
                            <Image
                              src="/icons/whatsapp.png"
                              alt="WhatsApp"
                              width={16}
                              height={16}
                            />
                          )}
                          {event.type === 'instagram' && (
                            <Image
                              src="/icons/instagram.png"
                              alt="Instagram"
                              width={16}
                              height={16}
                            />
                          )}
                          {event.type === 'order' && (
                            <ShoppingBag className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {event.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      No activity yet
                    </p>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notes
                  </h3>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedContact.notes.length > 0 ? (
                    selectedContact.notes.map((note, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                      >
                        {note}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      No notes yet
                    </p>
                  )}
                </div>
              </div>

              {/* Orders Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Orders
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedContact.orders} orders • ₹
                      {selectedContact.totalSpent.toLocaleString()} total
                    </p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Order
                  </Button>
                </div>
                {selectedContact.orders === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    No orders yet
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Contact form would go here...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
