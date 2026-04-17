import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ItemType = 'physical_product' | 'accommodation' | 'activity' | 'service'

export interface AttributeFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'select' | 'time' | 'tags'
  required?: boolean
  label: string
  options?: string[]
}

export interface CatalogConfig {
  allowed_item_types: ItemType[]
  item_type_labels: Record<ItemType, string>
  attribute_schemas: Record<ItemType, Record<string, AttributeFieldSchema>>
}

export interface CatalogVariant {
  variant_id: string
  name: string
  sku?: string
  price: number
  stock_quantity: number
  options: Record<string, string>
  is_active: boolean
}

export interface CatalogItem {
  item_id: string
  item_type: ItemType
  name: string
  description?: string
  category?: string
  base_price: string | number
  compare_price?: string | number
  currency: string
  stock_quantity: number | null
  primary_image_url?: string
  image_urls?: string[]
  attributes: Record<string, unknown>
  ai_tags?: string[]
  is_active: boolean
  variants: CatalogVariant[]
  // Legacy aliases — populated by normalisation shims
  price?: number
  sku?: string
  track_inventory?: boolean
  product_type?: string
  metadata?: Record<string, unknown>
  ai_enhanced_description?: string
  product_id?: string
  id?: string
  stockQuantity?: number
  reserved_stock?: number
  created_at?: string
  updated_at?: string
  ai_generated_tags?: string[]
}

export interface CatalogFilters {
  businessId?: string
  item_type?: ItemType | string
  category?: string
  search?: string
  page?: number
  limit?: number
}

export interface AvailabilitySlot {
  date: string
  total_slots: number
  booked_slots: number
  available_slots: number
  price: number | null
  is_blocked: boolean
  effective_price: number
}

export interface OrderItem {
  item_id: string
  item_name: string
  check_in?: string
  check_out?: string
  nights?: number
  guest_name?: string
  phone?: string
  num_guests?: number
  age?: number | null
  address?: string | null
  pin_code?: string | null
}

export interface CatalogOrder {
  order_id: string
  order_type: string
  total_amount: string | number
  payment_status: string
  delivery_status: string
  created_at: string
  items: OrderItem[]
}

// ── Catalog Config ─────────────────────────────────────────────────────────────

export function useCatalogConfig(businessId?: string) {
  return useQuery({
    queryKey: ['catalog-config', businessId],
    queryFn: async () => {
      const response = await apiClient.get('/catalog/config', { params: { businessId } })
      return ((response as any).data?.data ?? (response as any).data) as CatalogConfig
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!businessId,
  })
}

// ── Catalog Items ─────────────────────────────────────────────────────────────

export function useCatalog(filters: CatalogFilters) {
  return useQuery({
    queryKey: ['catalog', filters],
    queryFn: async () => {
      const response = await apiClient.get('/catalog', { params: filters })
      const body = (response as any).data?.data ?? (response as any).data
      const items: CatalogItem[] = Array.isArray(body) ? body : (body?.data ?? [])
      const meta = body?.meta ?? { total: items.length, page: 1, limit: 20, totalPages: 1 }
      return { data: items, meta }
    },
    enabled: !!filters.businessId,
    staleTime: 30000,
    retry: 1,
  })
}

export function useCatalogItem(itemId: string) {
  return useQuery({
    queryKey: ['catalog-item', itemId],
    queryFn: async () => {
      const response = await apiClient.get(`/catalog/${itemId}`)
      return ((response as any).data?.data ?? (response as any).data) as CatalogItem
    },
    enabled: !!itemId,
  })
}

export function useCatalogCategories(businessId?: string) {
  return useQuery({
    queryKey: ['catalog-categories', businessId],
    queryFn: async () => {
      const response = await apiClient.get('/catalog', { params: { businessId, limit: 200 } })
      const body = (response as any).data?.data ?? (response as any).data
      const items: CatalogItem[] = Array.isArray(body) ? body : (body?.data ?? [])
      const cats = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[]
      return cats.sort()
    },
    enabled: !!businessId,
    staleTime: 60000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Partial<CatalogItem>, 'item_id' | 'variants'>) => {
      const response = await apiClient.post('/catalog', data)
      return ((response as any).data?.data ?? (response as any).data) as CatalogItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-categories'] })
      toast.success('Item created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to create item')
    },
  })
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<CatalogItem> }) => {
      const response = await apiClient.patch(`/catalog/${itemId}`, data)
      return ((response as any).data?.data ?? (response as any).data) as CatalogItem
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-categories'] })
      toast.success('Item updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update item')
    },
  })
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(`/catalog/${itemId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-categories'] })
      toast.success('Item deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete item')
    },
  })
}

export function useUpdateCatalogStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiClient.patch(`/catalog/${itemId}/stock`, { quantity })
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-item', itemId] })
      toast.success('Stock updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update stock')
    },
  })
}

// ── Variants ──────────────────────────────────────────────────────────────────

export function useCatalogVariants(itemId: string) {
  return useQuery({
    queryKey: ['catalog-variants', itemId],
    queryFn: async () => {
      const response = await apiClient.get(`/catalog/${itemId}/variants`)
      const raw = (response as any).data?.data ?? (response as any).data
      return (Array.isArray(raw) ? raw : []) as CatalogVariant[]
    },
    enabled: !!itemId,
  })
}

export function useCreateVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Omit<CatalogVariant, 'variant_id' | 'is_active'> }) => {
      const response = await apiClient.post(`/catalog/${itemId}/variants`, data)
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-variants', itemId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-item', itemId] })
      toast.success('Variant added')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to add variant')
    },
  })
}

export function useUpdateVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ variantId, data }: { variantId: string; itemId: string; data: Partial<CatalogVariant> }) => {
      const response = await apiClient.patch(`/catalog/variants/${variantId}`, data)
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-variants', itemId] })
      toast.success('Variant updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update variant')
    },
  })
}

export function useDeleteVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ variantId }: { variantId: string; itemId: string }) => {
      await apiClient.delete(`/catalog/variants/${variantId}`)
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-variants', itemId] })
      toast.success('Variant deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete variant')
    },
  })
}

// ── Availability ──────────────────────────────────────────────────────────────

export function useCatalogAvailability(itemId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['catalog-availability', itemId, from, to],
    queryFn: async () => {
      const response = await apiClient.get(`/catalog/${itemId}/availability`, { params: { from, to } })
      const raw = (response as any).data?.data ?? (response as any).data
      return (Array.isArray(raw) ? raw : []) as AvailabilitySlot[]
    },
    enabled: !!itemId && !!from && !!to,
    staleTime: 30000,
  })
}

export function useSetAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, dates, total_slots, price_override }: {
      itemId: string; dates: string[]; total_slots: number; price_override?: number
    }) => {
      const response = await apiClient.post(`/catalog/${itemId}/availability`, { dates, total_slots, price_override })
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-availability', itemId] })
      toast.success('Availability updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update availability')
    },
  })
}

export function useBlockAvailabilityDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, date }: { itemId: string; date: string }) => {
      const response = await apiClient.patch(`/catalog/${itemId}/availability/block`, { date })
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-availability', itemId] })
      toast.success('Date blocked')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to block date')
    },
  })
}

// ── Orders (bookings) ─────────────────────────────────────────────────────────

export function useCatalogOrders(businessId?: string, orderType = 'accommodation') {
  return useQuery({
    queryKey: ['catalog-orders', businessId, orderType],
    queryFn: async () => {
      const response = await apiClient.get('/orders', { params: { businessId, order_type: orderType } })
      const raw = (response as any).data?.data ?? (response as any).data
      return (Array.isArray(raw) ? raw : raw?.data ?? []) as CatalogOrder[]
    },
    enabled: !!businessId,
    staleTime: 30000,
    retry: 1,
  })
}

export function useCatalogOrder(orderId: string) {
  return useQuery({
    queryKey: ['catalog-order', orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderId}`)
      return ((response as any).data?.data ?? (response as any).data) as CatalogOrder
    },
    enabled: !!orderId,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient.patch(`/orders/${orderId}`, { payment_status: 'cancelled' })
      return (response as any).data?.data ?? (response as any).data
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-orders'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-order', orderId] })
      toast.success('Booking cancelled')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to cancel booking')
    },
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parsePrice(v: string | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : parseFloat(v) || 0
}

export function isInStock(item: CatalogItem): boolean {
  return item.stock_quantity === null || item.stock_quantity > 0
}
