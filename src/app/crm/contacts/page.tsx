'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
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
  Plus,
  Search,
  MessageCircle,
  Eye,
  Phone,
  Mail,
  ShoppingBag,
  Loader2,
  UserX,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Contact {
  customer_id: string
  name: string
  phone?: string
  whatsapp_number?: string
  email?: string
  total_orders?: number
  engagement_score?: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

interface ContactsQuery {
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

function useContacts(q: ContactsQuery) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['contacts', q],
    queryFn: async () => {
      const response = await apiClient.get<any>('/contacts', {
        params: {
          search: q.search || undefined,
          sort_by: q.sortBy,
          sort_order: q.sortOrder,
          page: q.page,
          limit: q.limit,
        },
      })
      const body = response.data as any
      const contacts: Contact[] = Array.isArray(body) ? body : (body?.data ?? [])
      const pagination: Pagination | undefined = Array.isArray(body) ? undefined : body?.pagination
      return { contacts, pagination }
    },
    enabled: !!user?.business_id,
    staleTime: 30_000,
  })
}

interface CreateContactPayload {
  phone: string
  name?: string
  email?: string
  whatsapp_number?: string
  platform_user_id?: string
}

function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateContactPayload) => {
      const response = await apiClient.post<Contact>('/contacts', data)
      return response.data as Contact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact added successfully')
    },
    onError: (error: any) => {
      if (error?.status === 409 || error?.message?.includes('409')) {
        toast.error('A contact with this phone or email already exists')
      } else {
        toast.error(error?.message || 'Failed to create contact')
      }
    },
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-violet-500 to-violet-600',
  'from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
  'from-cyan-500 to-cyan-600',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── Page ──────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', phone: '', email: '', whatsapp_number: '', platform_user_id: '' }

export default function ContactsPage() {
  const [searchQuery, setSearchQuery]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAddContact, setShowAddContact]   = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const [sortBy, setSortBy]         = useState('created_at')
  const [sortOrder, setSortOrder]   = useState<'asc' | 'desc'>('desc')
  const [page, setPage]             = useState(1)
  const LIMIT = 20

  const { data, isLoading } = useContacts({
    search: debouncedSearch,
    sortBy,
    sortOrder,
    page,
    limit: LIMIT,
  })
  const contacts = data?.contacts ?? []
  const pagination = data?.pagination

  const createMutation = useCreateContact()

  // Debounce search
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const setField = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleCreate = async () => {
    if (!form.phone.trim()) { toast.error('Phone number is required'); return }
    const { error } = await createMutation.mutateAsync({
      phone: form.phone.trim(),
      name: form.name.trim() || undefined,
      email: form.email.trim() || undefined,
      whatsapp_number: form.whatsapp_number.trim() || undefined,
      platform_user_id: form.platform_user_id.trim() || undefined,
    }).then((d) => ({ data: d, error: null })).catch((e) => ({ data: null, error: e }))

    if (!error) {
      setShowAddContact(false)
      setForm(EMPTY_FORM)
    }
  }

  const openDetails = (c: Contact) => {
    setSelectedContact(c)
    setShowDetailsModal(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {pagination ? `${pagination.total} contacts` : 'Manage your contacts'}
            </p>
          </div>
          <Button
            onClick={() => setShowAddContact(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, phone, email…"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-10 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Joined</SelectItem>
              <SelectItem value="total_spent">Total Spent</SelectItem>
              <SelectItem value="total_orders">Total Orders</SelectItem>
              <SelectItem value="last_order_date">Last Order Date</SelectItem>
              <SelectItem value="engagement_score">Engagement Score</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3"
            onClick={() => { setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc')); setPage(1) }}
          >
            {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Contacts List */}
        <div className="grid gap-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
              <UserX className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="font-medium text-gray-600 dark:text-gray-400">
                {debouncedSearch ? 'No contacts match your search' : 'No contacts yet'}
              </p>
              {!debouncedSearch && (
                <p className="text-sm text-gray-400 mt-1">Add your first contact to get started</p>
              )}
            </div>
          ) : (
            contacts.map((c) => {
              const displayPhone = c.whatsapp_number ?? c.phone
              const initials = c.name ? getInitials(c.name) : '?'
              const color = avatarColor(c.customer_id)
              const hasWhatsApp = !!c.whatsapp_number

              return (
                <div
                  key={c.customer_id}
                  className="bg-white dark:bg-gray-950 rounded-xl px-5 py-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white font-semibold text-base`}>
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {c.name || <span className="text-gray-400 italic">No name</span>}
                        </p>
                        <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                          {displayPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {displayPhone}
                              {hasWhatsApp && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-medium">
                                  WA
                                </span>
                              )}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              {c.email}
                            </span>
                          )}
                          {c.total_orders !== undefined && c.total_orders > 0 && (
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-3.5 w-3.5" />
                              {c.total_orders} order{c.total_orders !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {displayPhone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300 dark:border-gray-700"
                          onClick={() => {
                            const num = displayPhone.replace(/\D/g, '')
                            window.open(`https://wa.me/${num}`, '_blank')
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                        onClick={() => openDetails(c)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>

          {selectedContact && (() => {
            const c = selectedContact
            const displayPhone = c.whatsapp_number ?? c.phone
            const initials = c.name ? getInitials(c.name) : '?'
            const color = avatarColor(c.customer_id)
            return (
              <div className="space-y-5 pt-2">
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white font-bold text-2xl`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{c.name || '—'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {c.customer_id}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Phone', value: c.phone },
                    { label: 'WhatsApp', value: c.whatsapp_number },
                    { label: 'Email', value: c.email },
                    { label: 'Total Orders', value: c.total_orders?.toString() },
                    { label: 'Engagement Score', value: c.engagement_score?.toString() },
                  ].filter((r) => r.value).map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-gray-50 dark:bg-gray-900 px-4 py-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                {displayPhone && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      const num = displayPhone.replace(/\D/g, '')
                      window.open(`https://wa.me/${num}`, '_blank')
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send WhatsApp Message
                  </Button>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={showAddContact} onOpenChange={(open) => { setShowAddContact(open); if (!open) setForm(EMPTY_FORM) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="c-phone"
                placeholder="+919876543210"
                value={form.phone}
                onChange={setField('phone')}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input
                id="c-name"
                placeholder="John Doe"
                value={form.name}
                onChange={setField('name')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={setField('email')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-wa">
                WhatsApp Number
                <span className="ml-2 text-xs text-gray-400 font-normal">(defaults to phone if blank)</span>
              </Label>
              <Input
                id="c-wa"
                placeholder="+919876543210"
                value={form.whatsapp_number}
                onChange={setField('whatsapp_number')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-pid">
                Platform User ID
                <span className="ml-2 text-xs text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="c-pid"
                placeholder="wa-user-id"
                value={form.platform_user_id}
                onChange={setField('platform_user_id')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddContact(false); setForm(EMPTY_FORM) }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
