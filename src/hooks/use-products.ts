import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export interface Product {
  product_id: string
  id: string
  name: string
  description?: string
  price: number
  base_price?: number | string
  sku?: string
  brand?: string
  category?: string
  condition?: string
  product_type?: string
  track_inventory?: boolean
  stock_quantity?: number
  reserved_stock?: number
  low_stock_threshold?: number
  is_active?: boolean
  primary_image_url?: string
  image_urls?: string[]
  attributes?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ai_enhanced_description?: string
  ai_generated_tags?: string[]
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

function normalise(raw: any): Product {
  // Backend returns catalog_items fields: item_id, base_price
  const id = raw.product_id ?? raw.item_id ?? raw.id ?? ''
  const rawPrice = raw.price ?? raw.base_price ?? 0
  return {
    ...raw,
    product_id: id,
    id,
    price: typeof rawPrice === 'string' ? parseFloat(rawPrice) || 0 : rawPrice,
    track_inventory: raw.track_inventory ?? (raw.stock_quantity !== null && raw.stock_quantity !== undefined),
    stock_quantity: raw.stock_quantity ?? 0,
  }
}

export function useProducts(page = 1, pageSize = 20, businessId?: string) {
  return useQuery({
    queryKey: ['products', page, pageSize, businessId],
    queryFn: async () => {
      const res = await apiClient.get('/products', { params: { page, limit: pageSize, business_id: businessId } })
      const body = (res as any).data?.data ?? (res as any).data
      const items: any[] = Array.isArray(body) ? body : (body?.data ?? body?.products ?? [])
      const meta = Array.isArray(body) ? {} : (body?.meta ?? {})
      return {
        data: items.map(normalise),
        products: items.map(normalise),
        total: meta.total ?? items.length,
        page,
        limit: pageSize,
      }
    },
    staleTime: 30000,
    retry: 1,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${id}`)
      const raw = (res as any).data?.data ?? (res as any).data
      return normalise(raw)
    },
    enabled: !!id,
    retry: 1,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Product> & Record<string, unknown>) => {
      const payload = { ...data, price: data.price ?? data.base_price }
      delete payload.base_price
      const res = await apiClient.post('/products', payload)
      return normalise((res as any).data?.data ?? (res as any).data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create product'),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> & Record<string, unknown> }) => {
      const res = await apiClient.patch(`/products/${id}`, data)
      return normalise((res as any).data?.data ?? (res as any).data)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', vars.id] })
      toast.success('Product updated')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update product'),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete product'),
  })
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, adjustment }: { id: string; adjustment: number }) => {
      const res = await apiClient.patch(`/catalog/${id}/stock`, { quantity_delta: adjustment })
      return (res as any).data?.data ?? (res as any).data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update stock'),
  })
}

export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${productId}/variants`)
      const raw = (res as any).data?.data ?? (res as any).data
      return (Array.isArray(raw) ? raw : raw?.data ?? []) as any[]
    },
    enabled: !!productId,
    retry: 1,
  })
}
