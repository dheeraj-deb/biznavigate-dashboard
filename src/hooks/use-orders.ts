import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// Order filters interface
interface OrderFilters {
  business_id?: string
  status?: string
  payment_status?: string
  page?: number
  limit?: number
  search?: string
  from_date?: string
  to_date?: string
  customer_id?: string
}

// Order statistics interface
interface OrderStats {
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_revenue: number
  average_order_value: number
}

function normalizeStatus(value: unknown) {
  return typeof value === 'string' ? value.toLowerCase() : value
}

function normalizeOrder(raw: any) {
  const customer = raw?.customer || raw?.customers
  const customerName =
    raw?.customer_name ||
    customer?.name ||
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') ||
    undefined
  const customerPhone =
    raw?.customer_phone ||
    customer?.phone ||
    customer?.whatsapp_number ||
    raw?.shipping_phone ||
    undefined

  return {
    ...raw,
    id: raw?.id || raw?.order_id || raw?.product_order_id,
    orderNumber: raw?.orderNumber || raw?.order_number,
    total: raw?.total ?? raw?.total_amount,
    status: normalizeStatus(raw?.status),
    payment_status: normalizeStatus(raw?.payment_status ?? raw?.paymentStatus),
    paymentStatus: normalizeStatus(raw?.paymentStatus ?? raw?.payment_status),
    customer_name: customerName,
    customer_phone: customerPhone,
    customer: customer || customerName || customerPhone
      ? {
          ...customer,
          name: customerName,
          firstName: customer?.firstName || customerName || customerPhone || 'Customer',
          lastName: customer?.lastName || '',
          phone: customerPhone,
        }
      : undefined,
  }
}

function normalizeOrdersResponse(response: any, filters?: OrderFilters) {
  const payload = response?.data ?? response
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.orders)
        ? payload.orders
        : []
  const meta = response?.meta ?? payload?.meta ?? {}
  const pagination = meta?.pagination ?? {}
  const total = Number(meta.total ?? pagination.total ?? payload?.total ?? rows.length)
  const limit = Number(meta.limit ?? pagination.limit ?? payload?.limit ?? filters?.limit ?? 20)
  const page = Number(meta.page ?? pagination.page ?? payload?.page ?? filters?.page ?? 1)

  return {
    data: rows.map(normalizeOrder),
    total,
    page,
    limit,
    totalPages: Number(meta.totalPages ?? meta.total_pages ?? pagination.total_pages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)))),
  }
}

// Get all orders with filters
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const response = await apiClient.get('/orders', { params: filters })
      return normalizeOrdersResponse(response, filters)
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get single order by ID
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${id}`)
      return normalizeOrder(response.data?.data ?? response.data)
    },
    enabled: !!id,
  })
}

// Get order statistics
export function useOrderStats(businessId?: string) {
  return useQuery({
    queryKey: ['order-stats', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/stats/${businessId}`)
      return response.data as OrderStats
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Create new order
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/orders', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast.success('Order created successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create order'
      toast.error(message)
    },
  })
}

// Update order
export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/orders/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast.success('Order updated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update order'
      toast.error(message)
    },
  })
}

// Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.patch(`/orders/${id}/status`, { status: String(status).toLowerCase() })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast.success('Order status updated')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update status'
      toast.error(message)
    },
  })
}

// Update order payment status
export function useUpdateOrderPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      payment_method,
      payment_reference,
      notes,
    }: {
      id: string
      payment_status?: string
      payment_method: string
      payment_reference?: string
      notes?: string
    }) => {
      const response = await apiClient.patch(`/orders/${id}/payment`, {
        payment_method,
        payment_reference,
        notes,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-payment-desk'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Payment status updated')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update payment'
      toast.error(message)
    },
  })
}

// Update order shipping
export function useUpdateOrderShipping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.patch(`/orders/${id}/shipping`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      toast.success('Shipping info updated')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update shipping'
      toast.error(message)
    },
  })
}

// Delete order (if needed)
export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/orders/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast.success('Order deleted successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete order'
      toast.error(message)
    },
  })
}
