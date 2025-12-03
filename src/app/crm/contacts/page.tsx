'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  MoreVertical,
  MessageSquare,
  User,
  Users,
  Star,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type ContactType = 'new' | 'active' | 'inactive' | 'vip'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  position?: string
  type: ContactType
  tags: string[]
  notes?: string
  lastContactedAt?: Date
  createdAt: Date
  source?: string
  dealValue?: number
}

const mockContacts: Contact[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@acme.com',
    phone: '+91 98765 43210',
    company: 'Acme Corporation',
    position: 'CEO',
    type: 'vip',
    tags: ['Enterprise', 'Decision Maker'],
    notes: 'Interested in enterprise plan. Follow up next week.',
    lastContactedAt: new Date('2024-11-28'),
    createdAt: new Date('2024-01-15'),
    source: 'WhatsApp',
    dealValue: 500000,
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@techsolutions.com',
    phone: '+91 98765 43211',
    company: 'Tech Solutions Inc.',
    position: 'CTO',
    type: 'active',
    tags: ['Tech', 'Mid-Size'],
    notes: 'Evaluating multiple vendors.',
    lastContactedAt: new Date('2024-11-30'),
    createdAt: new Date('2024-02-20'),
    source: 'Instagram',
    dealValue: 250000,
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.j@startupx.io',
    phone: '+91 98765 43212',
    company: 'StartupX',
    position: 'Founder',
    type: 'new',
    tags: ['Startup'],
    notes: 'Just reached out. Interested in basic plan.',
    createdAt: new Date('2024-11-25'),
    source: 'WhatsApp',
    dealValue: 50000,
  },
  {
    id: '4',
    firstName: 'Alice',
    lastName: 'Brown',
    email: 'alice.brown@datacorp.com',
    phone: '+91 98765 43213',
    company: 'DataCorp',
    position: 'VP of Sales',
    type: 'active',
    tags: ['Enterprise', 'Analytics'],
    notes: 'In negotiation phase.',
    lastContactedAt: new Date('2024-11-29'),
    createdAt: new Date('2024-03-05'),
    source: 'Instagram',
    dealValue: 400000,
  },
  {
    id: '5',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@retailco.com',
    phone: '+91 98765 43214',
    company: 'RetailCo',
    position: 'Manager',
    type: 'inactive',
    tags: ['Retail'],
    notes: 'No response in 3 months.',
    lastContactedAt: new Date('2024-08-15'),
    createdAt: new Date('2024-05-10'),
    source: 'WhatsApp',
    dealValue: 75000,
  },
  {
    id: '6',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.w@consultingpro.com',
    phone: '+91 98765 43215',
    company: 'Consulting Pro',
    position: 'Partner',
    type: 'vip',
    tags: ['VIP', 'Consulting'],
    notes: 'Long-term client. Very satisfied.',
    lastContactedAt: new Date('2024-12-01'),
    createdAt: new Date('2023-12-20'),
    source: 'Referral',
    dealValue: 1000000,
  },
  {
    id: '7',
    firstName: 'David',
    lastName: 'Martinez',
    email: 'david.m@ecommhub.com',
    phone: '+91 98765 43216',
    company: 'EcommHub',
    position: 'Director',
    type: 'new',
    tags: ['E-commerce'],
    notes: 'Showed interest in demo.',
    createdAt: new Date('2024-11-28'),
    source: 'Instagram',
    dealValue: 120000,
  },
  {
    id: '8',
    firstName: 'Emily',
    lastName: 'Taylor',
    email: 'emily.t@financeplus.com',
    phone: '+91 98765 43217',
    company: 'FinancePlus',
    position: 'CFO',
    type: 'active',
    tags: ['Finance', 'Decision Maker'],
    notes: 'Budget approval pending.',
    lastContactedAt: new Date('2024-11-27'),
    createdAt: new Date('2024-10-15'),
    source: 'WhatsApp',
    dealValue: 350000,
  },
]

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<ContactType | 'all'>('all')
  const [contacts, setContacts] = useState<Contact[]>(mockContacts)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    type: 'new' as ContactType,
    tags: '',
    notes: '',
    source: 'WhatsApp',
    dealValue: '',
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      type: 'new',
      tags: '',
      notes: '',
      source: 'WhatsApp',
      dealValue: '',
    })
  }

  // Calculate stats
  const stats = {
    all: contacts.length,
    new: contacts.filter(c => c.type === 'new').length,
    active: contacts.filter(c => c.type === 'active').length,
    inactive: contacts.filter(c => c.type === 'inactive').length,
    vip: contacts.filter(c => c.type === 'vip').length,
  }

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = selectedTab === 'all' || contact.type === selectedTab

    return matchesSearch && matchesTab
  })

  // Add contact
  const handleAddContact = () => {
    if (!formData.firstName || !formData.email || !formData.phone) {
      return
    }

    const newContact: Contact = {
      id: (contacts.length + 1).toString(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      position: formData.position,
      type: formData.type,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      notes: formData.notes,
      source: formData.source,
      dealValue: formData.dealValue ? parseFloat(formData.dealValue) : undefined,
      createdAt: new Date(),
    }

    setContacts(prev => [newContact, ...prev])
    setShowAddDialog(false)
    resetForm()
  }

  // Edit contact
  const handleEditContact = () => {
    if (!selectedContact || !formData.firstName || !formData.email || !formData.phone) {
      return
    }

    setContacts(prev =>
      prev.map(c =>
        c.id === selectedContact.id
          ? {
              ...c,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              company: formData.company,
              position: formData.position,
              type: formData.type,
              tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
              notes: formData.notes,
              source: formData.source,
              dealValue: formData.dealValue ? parseFloat(formData.dealValue) : undefined,
            }
          : c
      )
    )

    setShowEditDialog(false)
    setSelectedContact(null)
    resetForm()
  }

  // Delete contact
  const handleDeleteContact = () => {
    if (contactToDelete) {
      setContacts(prev => prev.filter(c => c.id !== contactToDelete))
      setShowDeleteDialog(false)
      setContactToDelete(null)
    }
  }

  // Open edit dialog
  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact)
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company || '',
      position: contact.position || '',
      type: contact.type,
      tags: contact.tags.join(', '),
      notes: contact.notes || '',
      source: contact.source || 'WhatsApp',
      dealValue: contact.dealValue?.toString() || '',
    })
    setShowEditDialog(true)
  }

  // Quick actions
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\s+/g, '')
    window.open(`https://wa.me/${formattedPhone}`, '_blank')
  }

  // Get type badge style
  const getTypeBadge = (type: ContactType) => {
    switch (type) {
      case 'new':
        return { label: 'New', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' }
      case 'active':
        return { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' }
      case 'inactive':
        return { label: 'Inactive', className: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300' }
      case 'vip':
        return { label: 'VIP', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' }
      default:
        return { label: type, className: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300' }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Contacts</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Manage your customer and prospect contacts</p>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contacts</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.all}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Repeated Buyers</p>
                  <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                  <p className="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.inactive}</p>
                </div>
                <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-950">
                  <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VIP</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.vip}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
                  <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Contacts</CardTitle>
                <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                  View and manage your contact database
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[300px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as ContactType | 'all')}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
                <TabsTrigger value="new">New ({stats.new})</TabsTrigger>
                <TabsTrigger value="active">Repeated Buyers ({stats.active})</TabsTrigger>
                <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
                <TabsTrigger value="vip">VIP ({stats.vip})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredContacts.map((contact) => {
                    const fullName = `${contact.firstName} ${contact.lastName}`.trim()
                    const initials = `${contact.firstName[0]}${contact.lastName[0] || ''}`.toUpperCase()
                    const typeBadge = getTypeBadge(contact.type)

                    return (
                      <Card key={contact.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-medium text-white">
                                {initials}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{fullName}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{contact.position || 'Contact'}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCall(contact.phone)}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  Call
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleWhatsApp(contact.phone)}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEmail(contact.email)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setContactToDelete(contact.id)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="mt-4">
                            <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                          </div>

                          <div className="mt-4 space-y-2">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <a href={`mailto:${contact.email}`} className="hover:underline truncate">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <a href={`tel:${contact.phone}`} className="hover:underline">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                            {contact.company && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{contact.company}</span>
                              </div>
                            )}
                            {contact.dealValue && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span>₹{contact.dealValue.toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          {contact.tags && contact.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {contact.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                            Added {formatDate(contact.createdAt)}
                            {contact.lastContactedAt && (
                              <span className="ml-2">• Last contact {formatDate(contact.lastContactedAt)}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {filteredContacts.length === 0 && (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">No contacts found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>Create a new contact in your database</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Acme Corporation"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  placeholder="CEO"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Contact Type *</Label>
                <Select value={formData.type} onValueChange={(value: ContactType) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealValue">Deal Value (₹)</Label>
                <Input
                  id="dealValue"
                  type="number"
                  placeholder="50000"
                  value={formData.dealValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealValue: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="Enterprise, Decision Maker"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this contact..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={!formData.firstName || !formData.email || !formData.phone}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  placeholder="Acme Corporation"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  placeholder="CEO"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Contact Type *</Label>
                <Select value={formData.type} onValueChange={(value: ContactType) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dealValue">Deal Value (₹)</Label>
                <Input
                  id="edit-dealValue"
                  type="number"
                  placeholder="50000"
                  value={formData.dealValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealValue: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                placeholder="Enterprise, Decision Maker"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional notes about this contact..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false)
              setSelectedContact(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleEditContact}
              disabled={!formData.firstName || !formData.email || !formData.phone}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              Update Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false)
              setContactToDelete(null)
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteContact}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
