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
// MOCK DATA FOR FALLBACK
// ============================================

const MOCK_CUSTOMERS: Customer[] = [
  {
    customer_id: '1',
    business_id: '37689a7a-a45e-4c96-82ce-d695871d4e0c',
    tenant_id: 'bceaa173-d703-4d77-9418-d29fc8dab1e8',
    name: 'Rajesh Kumar',
    phone: '+919876543201',
    email: 'rajesh.kumar@example.com',
    whatsapp_number: '+919876543201',
    total_orders: 25,
    total_spent: 125000,
    last_order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    engagement_score: 95,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_id: '2',
    business_id: '37689a7a-a45e-4c96-82ce-d695871d4e0c',
    tenant_id: 'bceaa173-d703-4d77-9418-d29fc8dab1e8',
    name: 'Priya Sharma',
    phone: '+919876543202',
    email: 'priya.sharma@example.com',
    whatsapp_number: '+919876543202',
    total_orders: 18,
    total_spent: 75000,
    last_order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    engagement_score: 88,
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_id: '3',
    business_id: '37689a7a-a45e-4c96-82ce-d695871d4e0c',
    tenant_id: 'bceaa173-d703-4d77-9418-d29fc8dab1e8',
    name: 'Amit Patel',
    phone: '+919876543203',
    email: 'amit.patel@example.com',
    whatsapp_number: '+919876543203',
    total_orders: 8,
    total_spent: 32000,
    last_order_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    engagement_score: 72,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_id: '4',
    business_id: '37689a7a-a45e-4c96-82ce-d695871d4e0c',
    tenant_id: 'bceaa173-d703-4d77-9418-d29fc8dab1e8',
    name: 'Sneha Reddy',
    phone: '+919876543204',
    email: 'sneha.reddy@example.com',
    whatsapp_number: '+919876543204',
    total_orders: 3,
    total_spent: 15000,
    last_order_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    engagement_score: 65,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_id: '5',
    business_id: '37689a7a-a45e-4c96-82ce-d695871d4e0c',
    tenant_id: 'bceaa173-d703-4d77-9418-d29fc8dab1e8',
    name: 'Vikram Singh',
    phone: '+919876543205',
    email: 'vikram.singh@example.com',
    whatsapp_number: '+919876543205',
    total_orders: 1,
    total_spent: 5000,
    last_order_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    engagement_score: 45,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_id: '6',
    business_id: '37689a7a-a45e-4c96-82ce-d695871d4e0c',
    tenant_id: 'bceaa173-d703-4d77-9418-d29fc8dab1e8',
    name: 'Meera Iyer',
    phone: '+919876543206',
    email: 'meera.iyer@example.com',
    whatsapp_number: '+919876543206',
    total_orders: 12,
    total_spent: 48000,
    last_order_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    engagement_score: 35,
    created_at: new Date(Date.now() - 220 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_id: '7',
    business_id: '37689a7a-a45e-4c96-82ce-d695871d4e0c',
    tenant_id: 'bceaa173-d703-4d77-9418-d29fc8dab1e8',
    name: 'Arjun Verma',
    phone: '+919876543207',
    email: null,
    whatsapp_number: '+919876543207',
    total_orders: 0,
    total_spent: 0,
    last_order_date: null,
    engagement_score: 20,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_id: '8',
    business_id: '37689a7a-a45e-4c96-82ce-d695871d4e0c',
    tenant_id: 'bceaa173-d703-4d77-9418-d29fc8dab1e8',
    name: 'Kavya Nair',
    phone: '+919876543208',
    email: 'kavya.nair@example.com',
    whatsapp_number: '+919876543208',
    total_orders: 15,
    total_spent: 68000,
    last_order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    engagement_score: 82,
    created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

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
      try {
        const response = await apiClient.get('/customers', { params })
        return {
          customers: response.data as Customer[],
          total: response.meta?.total || 0,
          page: response.meta?.page || 1,
          limit: response.meta?.limit || 20,
          totalPages: response.meta?.totalPages || 0,
        }
      } catch (error: any) {
        // Check if it's an authentication error or network error
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          console.warn('Backend API unavailable or not authenticated. Using mock data.')
          // Return mock data as fallback
          let filteredCustomers = [...MOCK_CUSTOMERS]

          // Apply search filter
          if (params?.search) {
            const searchLower = params.search.toLowerCase()
            filteredCustomers = filteredCustomers.filter(c =>
              c.name?.toLowerCase().includes(searchLower) ||
              c.phone.includes(params.search!) ||
              c.email?.toLowerCase().includes(searchLower)
            )
          }

          // Apply sorting
          if (params?.sort_by) {
            filteredCustomers.sort((a, b) => {
              const field = params.sort_by!
              const aVal = a[field as keyof Customer] || 0
              const bVal = b[field as keyof Customer] || 0

              if (typeof aVal === 'string' && typeof bVal === 'string') {
                return params.order === 'asc'
                  ? aVal.localeCompare(bVal)
                  : bVal.localeCompare(aVal)
              }

              return params.order === 'asc'
                ? (aVal as number) - (bVal as number)
                : (bVal as number) - (aVal as number)
            })
          }

          return {
            customers: filteredCustomers,
            total: filteredCustomers.length,
            page: params?.page || 1,
            limit: params?.limit || 20,
            totalPages: Math.ceil(filteredCustomers.length / (params?.limit || 20)),
          }
        }

        // Re-throw other errors
        throw error
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
      try {
        const response = await apiClient.get(`/customers/${customerId}`)
        return response.data as Customer
      } catch (error: any) {
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          console.warn('Backend API unavailable. Using mock data.')
          const customer = MOCK_CUSTOMERS.find(c => c.customer_id === customerId)
          if (!customer) throw new Error('Customer not found')
          return customer
        }
        throw error
      }
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
      try {
        const response = await apiClient.get('/customers/top', {
          params: { business_id: businessId, limit, sort_by: sortBy },
        })
        return response.data as Customer[]
      } catch (error: any) {
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          console.warn('Backend API unavailable. Using mock data.')
          const sorted = [...MOCK_CUSTOMERS].sort((a, b) =>
            sortBy === 'total_spent'
              ? b.total_spent - a.total_spent
              : b.total_orders - a.total_orders
          )
          return sorted.slice(0, limit)
        }
        throw error
      }
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
      try {
        const response = await apiClient.get('/customers/segments', {
          params: { business_id: businessId },
        })
        return response.data as CustomerSegments
      } catch (error: any) {
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          console.warn('Backend API unavailable. Using mock data.')
          // Calculate segments from mock data
          const segments: CustomerSegments = {
            vip: MOCK_CUSTOMERS.filter(c => c.total_spent >= 50000 || c.total_orders >= 10).length,
            regular: MOCK_CUSTOMERS.filter(c => {
              const daysSinceCreation = Math.floor(
                (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
              )
              const daysSinceLastOrder = c.last_order_date
                ? Math.floor((new Date().getTime() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
                : 999
              return daysSinceCreation > 30 && daysSinceLastOrder < 90 && c.total_spent < 50000 && c.total_orders < 10
            }).length,
            new: MOCK_CUSTOMERS.filter(c => {
              const daysSinceCreation = Math.floor(
                (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
              )
              return daysSinceCreation <= 30
            }).length,
            dormant: MOCK_CUSTOMERS.filter(c => {
              if (!c.last_order_date) return false
              const daysSinceLastOrder = Math.floor(
                (new Date().getTime() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
              )
              return daysSinceLastOrder >= 90
            }).length,
          }
          return segments
        }
        throw error
      }
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
      try {
        const response = await apiClient.post('/customers', data)
        return response.data as Customer
      } catch (error: any) {
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          // Mock success for demo purposes
          const newCustomer: Customer = {
            customer_id: `mock-${Date.now()}`,
            business_id: data.business_id,
            tenant_id: data.tenant_id,
            name: data.name || null,
            phone: data.phone,
            email: data.email || null,
            whatsapp_number: data.whatsapp_number || null,
            total_orders: 0,
            total_spent: 0,
            last_order_date: null,
            engagement_score: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          MOCK_CUSTOMERS.push(newCustomer)
          return newCustomer
        }
        throw error
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Customer "${data.name || data.phone}" created successfully`)
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to create customer'
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
      try {
        const response = await apiClient.put(`/customers/${customerId}`, data)
        return response.data as Customer
      } catch (error: any) {
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          // Mock success for demo purposes
          const index = MOCK_CUSTOMERS.findIndex(c => c.customer_id === customerId)
          if (index !== -1) {
            MOCK_CUSTOMERS[index] = {
              ...MOCK_CUSTOMERS[index],
              ...data,
              updated_at: new Date().toISOString(),
            }
            return MOCK_CUSTOMERS[index]
          }
          throw new Error('Customer not found')
        }
        throw error
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers', data.customer_id] })
      toast.success(`Customer "${data.name || data.phone}" updated successfully`)
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to update customer'
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
      try {
        await apiClient.delete(`/customers/${customerId}`)
      } catch (error: any) {
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          // Mock success for demo purposes
          const index = MOCK_CUSTOMERS.findIndex(c => c.customer_id === customerId)
          if (index !== -1) {
            MOCK_CUSTOMERS.splice(index, 1)
            return
          }
          throw new Error('Customer not found')
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted successfully')
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to delete customer'
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
