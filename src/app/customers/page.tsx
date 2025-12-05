'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  Search,
  Phone,
  Mail,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Star,
  Crown,
  UserPlus,
  Clock,
} from 'lucide-react'
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  getCustomerSegment,
  getSegmentBadgeColor,
  getEngagementScoreColor,
  getEngagementLevel,
  formatCurrency,
  formatPhoneNumber,
  formatRelativeTime,
  getAverageOrderValue,
  validatePhoneNumber,
  validateEmail,
  type Customer,
  type CreateCustomerDto,
  type UpdateCustomerDto,
} from '@/hooks/use-customers'
import { useAuthStore } from '@/store/auth-store'

// Fallback IDs if user is not logged in (for demo purposes)
const FALLBACK_BUSINESS_ID = 'dd8ae5a1-cab4-4041-849d-e108d74490d3'
const FALLBACK_TENANT_ID = '99aff970-f498-478d-939a-a9a2fb459902'

export default function CustomersPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  // Get business ID from user profile or use fallback
  // Note: tenant_id is not returned in auth response, so we use fallback
  // In production, this should be fetched from the business API or stored in auth response
  const businessId = user?.business_id || FALLBACK_BUSINESS_ID
  const tenantId = FALLBACK_TENANT_ID // TODO: Fetch from business API or add to auth response

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'name' | 'total_spent' | 'total_orders' | 'engagement_score' | 'last_order_date' | 'created_at'>('created_at')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp_number: '',
  })
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp_number: '',
  })

  // Fetch customers
  const { data, isLoading, error, refetch } = useCustomers({
    business_id: businessId,
    search: searchTerm,
    page,
    limit: 20,
    sort_by: sortBy,
    order,
  })

  // Mutations
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const customers = data?.customers || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  // Filter customers by segment
  const filteredCustomers = segmentFilter === 'all'
    ? customers
    : customers.filter(c => getCustomerSegment(c).toLowerCase() === segmentFilter)

  // Calculate stats
  const totalCustomers = customers.length
  const vipCustomers = customers.filter(c => getCustomerSegment(c) === 'VIP').length
  const newCustomers = customers.filter(c => getCustomerSegment(c) === 'New').length
  const avgCustomerValue = customers.length > 0
    ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length
    : 0

  // Handle create
  const handleCreate = () => {
    // Validate
    const errors = {
      name: '',
      phone: '',
      email: '',
      whatsapp_number: '',
    }

    const phoneValidation = validatePhoneNumber(formData.phone)
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error || ''
    }

    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.error || ''
    }

    if (formData.whatsapp_number) {
      const whatsappValidation = validatePhoneNumber(formData.whatsapp_number)
      if (!whatsappValidation.valid) {
        errors.whatsapp_number = whatsappValidation.error || ''
      }
    }

    setFormErrors(errors)

    if (errors.phone || errors.email || errors.whatsapp_number) {
      return
    }

    const data: CreateCustomerDto = {
      business_id: businessId,
      tenant_id: tenantId,
      phone: formData.phone,
    }

    if (formData.name) data.name = formData.name
    if (formData.email) data.email = formData.email
    if (formData.whatsapp_number) data.whatsapp_number = formData.whatsapp_number

    createCustomer.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        resetForm()
        refetch()
      },
    })
  }

  // Handle edit
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      whatsapp_number: customer.whatsapp_number || '',
    })
    setEditDialogOpen(true)
  }

  // Handle update
  const handleUpdate = () => {
    if (!selectedCustomer) return

    // Validate
    const errors = {
      name: '',
      phone: '',
      email: '',
      whatsapp_number: '',
    }

    if (formData.phone) {
      const phoneValidation = validatePhoneNumber(formData.phone)
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.error || ''
      }
    }

    if (formData.email) {
      const emailValidation = validateEmail(formData.email)
      if (!emailValidation.valid) {
        errors.email = emailValidation.error || ''
      }
    }

    if (formData.whatsapp_number) {
      const whatsappValidation = validatePhoneNumber(formData.whatsapp_number)
      if (!whatsappValidation.valid) {
        errors.whatsapp_number = whatsappValidation.error || ''
      }
    }

    setFormErrors(errors)

    if (errors.phone || errors.email || errors.whatsapp_number) {
      return
    }

    const data: UpdateCustomerDto = {}
    if (formData.name !== selectedCustomer.name) data.name = formData.name
    if (formData.phone !== selectedCustomer.phone) data.phone = formData.phone
    if (formData.email !== selectedCustomer.email) data.email = formData.email || undefined
    if (formData.whatsapp_number !== selectedCustomer.whatsapp_number) data.whatsapp_number = formData.whatsapp_number || undefined

    updateCustomer.mutate(
      { customerId: selectedCustomer.customer_id, data },
      {
        onSuccess: () => {
          setEditDialogOpen(false)
          resetForm()
          refetch()
        },
      }
    )
  }

  // Handle delete
  const handleDelete = () => {
    if (!selectedCustomer) return

    deleteCustomer.mutate(selectedCustomer.customer_id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setSelectedCustomer(null)
        refetch()
      },
    })
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      whatsapp_number: '',
    })
    setFormErrors({
      name: '',
      phone: '',
      email: '',
      whatsapp_number: '',
    })
    setSelectedCustomer(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Customers</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Manage your customer relationships and profiles</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load customers. Please ensure the backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Customers</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCustomers}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Active customers</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">VIP Customers</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-950">
                <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{vipCustomers}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">High-value customers</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">New Customers</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{newCustomers}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Customer Value</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(avgCustomerValue)}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Total spent per customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, phone, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Segment</Label>
                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="dormant">Dormant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Added</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="total_spent">Total Spent</SelectItem>
                    <SelectItem value="total_orders">Total Orders</SelectItem>
                    <SelectItem value="engagement_score">Engagement</SelectItem>
                    <SelectItem value="last_order_date">Last Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Order</Label>
                <Select value={order} onValueChange={(value: any) => setOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Customers</CardTitle>
                <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                  Showing {filteredCustomers.length} of {total} customers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {searchTerm || segmentFilter !== 'all'
                    ? 'No customers found matching your filters'
                    : 'No customers yet. Add your first customer to get started.'}
                </div>
              ) : (
                filteredCustomers.map((customer) => {
                  const segment = getCustomerSegment(customer)
                  const segmentColor = getSegmentBadgeColor(segment)
                  const engagementColor = getEngagementScoreColor(customer.engagement_score)
                  const avgOrderValue = getAverageOrderValue(customer)

                  return (
                    <div
                      key={customer.customer_id}
                      className="group flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200 bg-white dark:bg-gray-950"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {customer.name || formatPhoneNumber(customer.phone)}
                            </h3>
                            <Badge variant="outline" className={segmentColor}>
                              {segment === 'VIP' && <Crown className="mr-1 h-3 w-3" />}
                              {segment}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{formatPhoneNumber(customer.phone)}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-4 w-4 text-blue-500" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <ShoppingCart className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{customer.total_orders}</span> orders
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-600">{formatCurrency(customer.total_spent)}</span> spent
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                            <span>{formatCurrency(avgOrderValue)}</span> avg
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star className={`h-4 w-4 ${engagementColor}`} />
                            <span className={`font-medium ${engagementColor}`}>
                              {customer.engagement_score}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>Last: {formatRelativeTime(customer.last_order_date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/customers/${customer.customer_id}`)}
                          className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                          className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setDeleteDialogOpen(true)
                          }}
                          className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Customer Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Add New Customer</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    Create a new customer profile. Phone number is required.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Full Name
                  <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-500" />
                  Phone Number
                  <span className="text-xs text-blue-500 font-semibold">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value })
                    setFormErrors({ ...formErrors, phone: '' })
                  }}
                  className={`h-11 ${formErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-blue-500'}`}
                />
                {formErrors.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {formErrors.phone}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email Address
                  <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="rajesh@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setFormErrors({ ...formErrors, email: '' })
                  }}
                  className={`h-11 ${formErrors.email ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-blue-500'}`}
                />
                {formErrors.email && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {formErrors.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  WhatsApp Number
                  <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="+91 98765 43210"
                  value={formData.whatsapp_number}
                  onChange={(e) => {
                    setFormData({ ...formData, whatsapp_number: e.target.value })
                    setFormErrors({ ...formErrors, whatsapp_number: '' })
                  }}
                  className={`h-11 ${formErrors.whatsapp_number ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-blue-500'}`}
                />
                {formErrors.whatsapp_number && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {formErrors.whatsapp_number}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false)
                  resetForm()
                }}
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createCustomer.isPending}
                className="h-11 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 transition-all"
              >
                {createCustomer.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Customer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer information.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Name</Label>
                <Input
                  id="editName"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value })
                    setFormErrors({ ...formErrors, phone: '' })
                  }}
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setFormErrors({ ...formErrors, email: '' })
                  }}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editWhatsapp">WhatsApp Number</Label>
                <Input
                  id="editWhatsapp"
                  placeholder="+919876543210"
                  value={formData.whatsapp_number}
                  onChange={(e) => {
                    setFormData({ ...formData, whatsapp_number: e.target.value })
                    setFormErrors({ ...formErrors, whatsapp_number: '' })
                  }}
                />
                {formErrors.whatsapp_number && (
                  <p className="text-sm text-red-600">{formErrors.whatsapp_number}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Customer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedCustomer?.name || selectedCustomer?.phone}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setSelectedCustomer(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCustomer.isPending}
              >
                {deleteCustomer.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
