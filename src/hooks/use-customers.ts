import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Customer {
  customer_id: string
  business_id: string
  tenant_id: string
  name: string | null
  phone: string
  email: string | null
  whatsapp_number: string | null
  total_orders: number
  total_spent: number
  last_order_date: string | null
  engagement_score: number
  created_at: string
  updated_at: string
}

export interface CreateCustomerDto {
  business_id: string
  tenant_id: string
  name?: string
  phone: string
  email?: string
  whatsapp_number?: string
}

export interface UpdateCustomerDto {
  name?: string
  phone?: string
  email?: string
  whatsapp_number?: string
}

export interface CustomerQueryParams {
  business_id?: string
  search?: string
  min_total_spent?: number
  max_total_spent?: number
  min_total_orders?: number
  max_total_orders?: number
  min_engagement_score?: number
  max_engagement_score?: number
  page?: number
  limit?: number
  sort_by?: 'name' | 'total_spent' | 'total_orders' | 'engagement_score' | 'last_order_date' | 'created_at'
  order?: 'asc' | 'desc'
}

export interface CustomerSegments {
  vip: number
  regular: number
  new: number
  dormant: number
}

export interface BulkUploadResult {
  success: number
  skipped: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

// ============================================
// QUERY HOOKS - Data Fetching
// ============================================

/**
 * Get all customers with filtering and pagination
 */
export function useCustomers(params?: CustomerQueryParams) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const response = await apiClient.get('/customers', { params })
      return {
        customers: response.data.data as Customer[],
        total: response.data.meta?.total || 0,
        page: response.data.meta?.page || 1,
        limit: response.data.meta?.limit || 20,
        totalPages: response.data.meta?.totalPages || 0,
      }
    },
    staleTime: 30000, // 30 seconds
    retry: 1,
  })
}

/**
 * Get single customer by ID
 */
export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ['customers', customerId],
    queryFn: async () => {
      const response = await apiClient.get(`/customers/${customerId}`)
      return response.data.data as Customer
    },
    enabled: !!customerId,
    retry: 1,
  })
}

/**
 * Get top customers (VIP/high-value)
 */
export function useTopCustomers(
  businessId: string,
  limit: number = 10,
  sortBy: 'total_spent' | 'total_orders' = 'total_spent'
) {
  return useQuery({
    queryKey: ['customers', 'top', businessId, limit, sortBy],
    queryFn: async () => {
      const response = await apiClient.get('/customers/top', {
        params: { business_id: businessId, limit, sort_by: sortBy },
      })
      return response.data.data as Customer[]
    },
    enabled: !!businessId,
    staleTime: 60000, // 1 minute
    retry: 1,
  })
}

/**
 * Get customer segments
 */
export function useCustomerSegments(businessId: string) {
  return useQuery({
    queryKey: ['customers', 'segments', businessId],
    queryFn: async () => {
      const response = await apiClient.get('/customers/segments', {
        params: { business_id: businessId },
      })
      return response.data.data as CustomerSegments
    },
    enabled: !!businessId,
    staleTime: 60000, // 1 minute
    retry: 1,
  })
}

// ============================================
// MUTATION HOOKS - Customer Operations
// ============================================

/**
 * Create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCustomerDto) => {
      const response = await apiClient.post('/customers', data)
      return response.data.data as Customer
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Customer "${data.name || data.phone}" created successfully`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create customer'
      toast.error(message)
    },
  })
}

/**
 * Update existing customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, data }: { customerId: string; data: UpdateCustomerDto }) => {
      const response = await apiClient.put(`/customers/${customerId}`, data)
      return response.data.data as Customer
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers', data.customer_id] })
      toast.success(`Customer "${data.name || data.phone}" updated successfully`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update customer'
      toast.error(message)
    },
  })
}

/**
 * Delete customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerId: string) => {
      await apiClient.delete(`/customers/${customerId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete customer'
      toast.error(message)
    },
  })
}

/**
 * Update customer engagement score
 */
export function useUpdateEngagement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, delta }: { customerId: string; delta: number }) => {
      await apiClient.patch(`/customers/${customerId}/engagement`, { delta })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers', variables.customerId] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update engagement score'
      toast.error(message)
    },
  })
}

/**
 * Bulk upload customers (CSV/Excel import)
 */
export function useBulkUploadCustomers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { business_id: string; tenant_id: string; customers: CreateCustomerDto[] }) => {
      const response = await apiClient.post('/customers/bulk', data)
      return response.data.data as BulkUploadResult
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Bulk upload completed: ${data.success} succeeded, ${data.skipped} skipped, ${data.failed} failed`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to bulk upload customers'
      toast.error(message)
    },
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get customer segment label
 */
export function getCustomerSegment(customer: Customer): 'VIP' | 'Regular' | 'New' | 'Dormant' {
  // VIP: High spending customers (>50000 or >10 orders)
  if (customer.total_spent >= 50000 || customer.total_orders >= 10) {
    return 'VIP'
  }

  // New: Customers created in last 30 days
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceCreation <= 30) {
    return 'New'
  }

  // Dormant: No orders in last 90 days
  if (customer.last_order_date) {
    const daysSinceLastOrder = Math.floor(
      (new Date().getTime() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastOrder >= 90) {
      return 'Dormant'
    }
  }

  // Regular: Everyone else
  return 'Regular'
}

/**
 * Get segment badge color
 */
export function getSegmentBadgeColor(segment: string): string {
  const colors: Record<string, string> = {
    VIP: 'bg-purple-100 text-purple-800 border-purple-200',
    Regular: 'bg-blue-100 text-blue-800 border-blue-200',
    New: 'bg-green-100 text-green-800 border-green-200',
    Dormant: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return colors[segment] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get engagement score color
 */
export function getEngagementScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  if (score >= 20) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Get engagement level label
 */
export function getEngagementLevel(score: number): string {
  if (score >= 80) return 'High'
  if (score >= 50) return 'Medium'
  if (score >= 20) return 'Low'
  return 'Very Low'
}

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove + and country code for display
  if (phone.startsWith('+91')) {
    return phone.substring(3)
  }
  if (phone.startsWith('+')) {
    return phone.substring(1)
  }
  return phone
}

/**
 * Validate phone number (E.164 format)
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'Phone number is required' }
  }

  // E.164 format: +[country code][number] (max 15 digits)
  const e164Regex = /^\+?[1-9]\d{1,14}$/
  if (!e164Regex.test(phone)) {
    return { valid: false, error: 'Phone must be in international format (e.g., +919876543210)' }
  }

  return { valid: true }
}

/**
 * Validate email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: true } // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}

/**
 * Calculate customer lifetime value (CLV)
 */
export function calculateCLV(customer: Customer): number {
  // Simple CLV: total_spent (can be enhanced with predictive models)
  return customer.total_spent
}

/**
 * Get days since last order
 */
export function getDaysSinceLastOrder(customer: Customer): number | null {
  if (!customer.last_order_date) return null

  return Math.floor(
    (new Date().getTime() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
  )
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: string | null): string {
  if (!date) return 'Never'

  const days = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

/**
 * Get customer health score (0-100)
 */
export function getCustomerHealthScore(customer: Customer): number {
  let score = 0

  // Recency (40 points)
  const daysSinceLastOrder = getDaysSinceLastOrder(customer)
  if (daysSinceLastOrder !== null) {
    if (daysSinceLastOrder <= 7) score += 40
    else if (daysSinceLastOrder <= 30) score += 30
    else if (daysSinceLastOrder <= 90) score += 20
    else if (daysSinceLastOrder <= 180) score += 10
  }

  // Frequency (30 points)
  if (customer.total_orders >= 20) score += 30
  else if (customer.total_orders >= 10) score += 25
  else if (customer.total_orders >= 5) score += 20
  else if (customer.total_orders >= 2) score += 15
  else if (customer.total_orders >= 1) score += 10

  // Monetary (30 points)
  if (customer.total_spent >= 100000) score += 30
  else if (customer.total_spent >= 50000) score += 25
  else if (customer.total_spent >= 25000) score += 20
  else if (customer.total_spent >= 10000) score += 15
  else if (customer.total_spent >= 5000) score += 10

  return Math.min(score, 100)
}

/**
 * Get average order value
 */
export function getAverageOrderValue(customer: Customer): number {
  if (customer.total_orders === 0) return 0
  return customer.total_spent / customer.total_orders
}
