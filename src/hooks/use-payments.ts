import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ============================================
// TYPES & INTERFACES
// ============================================

export type PaymentStatus =
  | 'created'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partial_refund'

export type PaymentMethod =
  | 'card'
  | 'netbanking'
  | 'wallet'
  | 'upi'
  | 'emi'
  | 'cod'

export interface Payment {
  payment_id: string
  business_id: string
  tenant_id: string
  order_id: string
  customer_id: string

  // Razorpay identifiers
  razorpay_order_id: string
  razorpay_payment_id?: string
  razorpay_signature?: string

  // Payment details
  amount: number
  currency: string
  status: PaymentStatus
  method?: PaymentMethod

  // Webhook tracking
  webhook_received_at?: string
  webhook_processed_at?: string
  webhook_attempts: number

  // Refund tracking
  refund_amount: number
  refunded_at?: string
  refund_reason?: string

  // Payment timeline
  authorized_at?: string
  captured_at?: string
  failed_at?: string
  failure_reason?: string

  // Timestamps
  created_at: string
  updated_at: string
}

export interface PaymentAnalytics {
  totalPayments: number
  totalRevenue: number
  totalRefunded: number
  netRevenue: number
  successfulPayments: number
  failedPayments: number
  successRate: number
  statusBreakdown: Record<string, number>
  methodBreakdown: Record<string, number>
}

export interface PaymentListResponse {
  data: Payment[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Request DTOs
export interface CreatePaymentDto {
  business_id: string
  tenant_id: string
  order_id: string
  customer_id: string
  amount: number
  currency?: string
  receipt?: string
  notes?: Record<string, any>
}

export interface VerifyPaymentSignatureDto {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface CreateRefundDto {
  payment_id: string
  amount?: number
  reason?: string
  notes?: Record<string, any>
}

export interface PaymentQueryDto {
  // Filters
  business_id?: string
  customer_id?: string
  order_id?: string
  status?: PaymentStatus
  method?: PaymentMethod
  razorpay_payment_id?: string
  razorpay_order_id?: string

  // Date range
  from_date?: string
  to_date?: string

  // Amount range
  min_amount?: number
  max_amount?: number

  // Pagination
  page?: number
  limit?: number

  // Sorting
  sort_by?: 'created_at' | 'amount' | 'status'
  order?: 'asc' | 'desc'
}

export interface PaymentAnalyticsQuery {
  business_id: string
  from_date?: string
  to_date?: string
}

// ============================================
// QUERY HOOKS - Data Fetching
// ============================================

/**
 * Get payments list with filters and pagination
 */
export function usePayments(filters: PaymentQueryDto) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const response = await apiClient.get('/payments', {
        params: {
          ...filters,
          page: filters.page || 1,
          limit: filters.limit || 20,
          sort_by: filters.sort_by || 'created_at',
          order: filters.order || 'desc',
        },
      })
      return response as PaymentListResponse
    },
    enabled: !!filters.business_id,
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}

/**
 * Get payment by ID
 */
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ['payments', paymentId],
    queryFn: async () => {
      const response = await apiClient.get(`/payments/${paymentId}`)
      return response.data?.data as Payment
    },
    enabled: !!paymentId,
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Get payment by order ID
 */
export function usePaymentByOrder(orderId: string) {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/payments/order/${orderId}`)
      return response.data?.data as Payment | null
    },
    enabled: !!orderId,
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Get payment analytics
 */
export function usePaymentAnalytics(query: PaymentAnalyticsQuery) {
  return useQuery({
    queryKey: ['payments', 'analytics', query],
    queryFn: async () => {
      const response = await apiClient.get('/payments/analytics', {
        params: query,
      })
      return response.data?.data as PaymentAnalytics
    },
    enabled: !!query.business_id,
    retry: 1,
    retryDelay: 1000,
    staleTime: 60000, // Consider data stale after 1 minute
  })
}

// ============================================
// MUTATION HOOKS - Payment Operations
// ============================================

/**
 * Create payment (initiate Razorpay order)
 */
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePaymentDto) => {
      const response = await apiClient.post('/payments', data)
      return response.data?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Payment initiated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create payment'
      toast.error(message)
    },
  })
}

/**
 * Verify payment signature (after Razorpay checkout)
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VerifyPaymentSignatureDto) => {
      const response = await apiClient.post('/payments/verify', data)
      return response.data?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Payment verified successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Payment verification failed'
      toast.error(message)
    },
  })
}

/**
 * Manually capture payment (for authorized payments)
 */
export function useCapturePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiClient.post(`/payments/${paymentId}/capture`)
      return response.data?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Payment captured successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to capture payment'
      toast.error(message)
    },
  })
}

/**
 * Create refund (full or partial)
 */
export function useRefundPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ paymentId, ...data }: CreateRefundDto & { paymentId: string }) => {
      const response = await apiClient.post(`/payments/${paymentId}/refund`, data)
      return response.data?.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      const message = variables.amount
        ? `Partial refund of ${formatCurrency(variables.amount)} created successfully`
        : 'Full refund created successfully'
      toast.success(message)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create refund'
      toast.error(message)
    },
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get payment status badge color
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    created: 'bg-gray-100 text-gray-800 border-gray-200',
    authorized: 'bg-blue-100 text-blue-800 border-blue-200',
    captured: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-purple-100 text-purple-800 border-purple-200',
    partial_refund: 'bg-blue-100 text-blue-800 border-blue-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get payment status label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    created: 'Created',
    authorized: 'Authorized',
    captured: 'Captured',
    failed: 'Failed',
    refunded: 'Refunded',
    partial_refund: 'Partial Refund',
  }
  return labels[status] || status
}

/**
 * Get payment method icon and label
 */
export function getPaymentMethodInfo(method?: PaymentMethod): {
  icon: string
  label: string
  color: string
} {
  if (!method) {
    return { icon: 'CreditCard', label: 'Unknown', color: 'text-gray-600' }
  }

  const methods: Record<
    PaymentMethod,
    { icon: string; label: string; color: string }
  > = {
    card: { icon: 'CreditCard', label: 'Card', color: 'text-blue-600' },
    netbanking: { icon: 'Building2', label: 'Net Banking', color: 'text-green-600' },
    wallet: { icon: 'Wallet', label: 'Wallet', color: 'text-purple-600' },
    upi: { icon: 'Smartphone', label: 'UPI', color: 'text-blue-600' },
    emi: { icon: 'Calendar', label: 'EMI', color: 'text-red-600' },
    cod: { icon: 'Banknote', label: 'Cash on Delivery', color: 'text-yellow-600' },
  }

  return methods[method] || { icon: 'CreditCard', label: method, color: 'text-gray-600' }
}

/**
 * Format currency (supports INR and USD)
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calculate available refund amount
 */
export function getAvailableRefundAmount(payment: Payment): number {
  return payment.amount - payment.refund_amount
}

/**
 * Check if payment can be refunded
 */
export function canRefund(payment: Payment): boolean {
  return payment.status === 'captured' && getAvailableRefundAmount(payment) > 0
}

/**
 * Check if payment can be captured
 */
export function canCapture(payment: Payment): boolean {
  return payment.status === 'authorized'
}

/**
 * Get payment timeline events
 */
export function getPaymentTimeline(payment: Payment): {
  event: string
  timestamp?: string
  status: 'success' | 'error' | 'pending'
}[] {
  const timeline: { event: string; timestamp?: string; status: 'success' | 'error' | 'pending' }[] = []

  timeline.push({
    event: 'Payment Created',
    timestamp: payment.created_at,
    status: 'success',
  })

  if (payment.authorized_at) {
    timeline.push({
      event: 'Payment Authorized',
      timestamp: payment.authorized_at,
      status: 'success',
    })
  }

  if (payment.captured_at) {
    timeline.push({
      event: 'Payment Captured',
      timestamp: payment.captured_at,
      status: 'success',
    })
  }

  if (payment.failed_at) {
    timeline.push({
      event: `Payment Failed: ${payment.failure_reason || 'Unknown reason'}`,
      timestamp: payment.failed_at,
      status: 'error',
    })
  }

  if (payment.refunded_at) {
    const refundType = payment.status === 'refunded' ? 'Full' : 'Partial'
    timeline.push({
      event: `${refundType} Refund Issued: ${formatCurrency(payment.refund_amount, payment.currency)}`,
      timestamp: payment.refunded_at,
      status: 'success',
    })
  }

  return timeline
}

/**
 * Get success rate color
 */
export function getSuccessRateColor(rate: number): string {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 60) return 'text-yellow-600'
  if (rate >= 40) return 'text-blue-600'
  return 'text-red-600'
}

/**
 * Format date and time
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-'

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Format relative time
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return date.toLocaleDateString()
}
