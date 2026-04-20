import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  cart_item_id: string
  item_id: string
  variant_id?: string
  quantity: number
  unit_price: number
  total_price: number
  item?: {
    name: string
    primary_image_url?: string
    base_price: string | number
  }
}

export interface Cart {
  cart_id: string
  lead_id: string
  business_id: string
  items: CartItem[]
  total_amount: number
  currency: string
  created_at: string
  updated_at: string
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useCart(leadId?: string, businessId?: string) {
  return useQuery({
    queryKey: ['cart', leadId, businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/cart/${leadId}/${businessId}`)
      const raw = (response as any).data?.data ?? (response as any).data
      return raw as Cart
    },
    enabled: !!leadId && !!businessId,
    staleTime: 30000,
    retry: 1,
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      lead_id: string
      business_id: string
      item_id: string
      variant_id?: string
      quantity: number
    }) => {
      const response = await apiClient.post('/cart/add', payload)
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cart', vars.lead_id, vars.business_id] })
      toast.success('Added to cart')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to add to cart')
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cartItemId, quantity, leadId, businessId }: {
      cartItemId: string
      quantity: number
      leadId?: string
      businessId?: string
    }) => {
      const response = await apiClient.put(`/cart/item/${cartItemId}`, { quantity })
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cart', vars.leadId, vars.businessId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update cart')
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cartItemId, leadId, businessId }: {
      cartItemId: string
      leadId?: string
      businessId?: string
    }) => {
      await apiClient.delete(`/cart/item/${cartItemId}`)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cart', vars.leadId, vars.businessId] })
      toast.success('Item removed')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to remove item')
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cartId, leadId, businessId }: {
      cartId: string
      leadId?: string
      businessId?: string
    }) => {
      await apiClient.delete(`/cart/${cartId}`)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cart', vars.leadId, vars.businessId] })
      toast.success('Cart cleared')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to clear cart')
    },
  })
}

export function useCartCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cartId, paymentMethod, leadId, businessId }: {
      cartId: string
      paymentMethod: string
      leadId?: string
      businessId?: string
    }) => {
      const response = await apiClient.post('/cart/checkout', { cart_id: cartId, payment_method: paymentMethod })
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cart', vars.leadId, vars.businessId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order placed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Checkout failed')
    },
  })
}
