import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// Order filters interface
interface OrderFilters {
  status?: string
  payment_status?: string
  page?: number
  limit?: number
  search?: string
  from_date?: string
  to_date?: string
}

// Order statistics interface
interface OrderStats {
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_revenue: number
  average_order_value: number
}

// Get all orders with filters
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const response = await apiClient.get('/orders', { params: filters })
      console.log('Fetched Orders:', response)
      return response || { data: [], total: 0, page: 1, limit: 20 }
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
      return response.data
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
      const response = await apiClient.patch(`/orders/${id}/status`, { status })
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
    mutationFn: async ({ id, payment_status, payment_method }: { id: string; payment_status: string; payment_method: string }) => {
      const response = await apiClient.patch(`/orders/${id}/payment`, { payment_status, payment_method })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
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
