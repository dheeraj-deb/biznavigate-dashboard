import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { parsePrice } from './use-catalog'

export interface WhatsAppCatalogProduct {
  product_id: string
  item_id?: string
  name: string
  description?: string
  price: string
  currency: string
  in_stock: boolean
  in_whatsapp_catalog: boolean
  whatsapp_catalog_id?: string | null
  whatsapp_retailer_id?: string | null
  whatsapp_sync_status: 'not_synced' | 'pending' | 'syncing' | 'synced' | 'failed' | 'linked' | 'local_only'
  whatsapp_sync_error?: string
  whatsapp_synced_at?: string | null
  product_images?: Array<{ file_path: string; is_primary: boolean }>
}

export interface WhatsAppSyncStatus {
  stats: Record<string, number>
  totalProducts?: number
  synced?: number
  pending?: number
  failed?: number
  lastSync?: string | null
  lastSyncAt?: string | null
}

export interface WhatsAppCatalogPreview {
  hasCatalog: boolean
  catalogId: string | null
  count: number
  message?: string
  products: Array<{
    external_product_id: string
    retailer_id?: string
    name?: string
    price?: string | number
    currency?: string
    availability?: string
    image_url?: string
  }>
}

export interface ImportResult {
  success: boolean
  catalogId: string
  fetched: number
  created: number
  linked: number
  skipped: number
  imported: Array<{ item_id: string; name: string; action: string }>
}

export interface SyncResult {
  success: boolean
  synced?: number
  failed?: number
  errors?: Array<{ productId: string; error: string }>
}

function normalizeProduct(item: any): WhatsAppCatalogProduct {
  const price = parsePrice(item.base_price)
  return {
    product_id: item.item_id,
    item_id: item.item_id,
    name: item.name,
    description: item.description,
    price: String(price),
    currency: item.currency ?? 'INR',
    in_stock: item.stock_quantity === null || item.stock_quantity === undefined || item.stock_quantity > 0,
    in_whatsapp_catalog: !!item.in_whatsapp_catalog,
    whatsapp_catalog_id: item.whatsapp_catalog_id ?? null,
    whatsapp_retailer_id: item.whatsapp_retailer_id ?? null,
    whatsapp_sync_status: item.whatsapp_sync_status ?? 'not_synced',
    whatsapp_synced_at: item.whatsapp_synced_at ?? null,
    product_images: item.primary_image_url
      ? [{ file_path: item.primary_image_url, is_primary: true }]
      : [],
  }
}

export function useWhatsAppCatalog(_businessId?: string, enabled = true) {
  return useQuery<WhatsAppCatalogProduct[]>({
    queryKey: ['whatsapp-catalog'],
    queryFn: async () => {
      const response = await apiClient.get('/whatsapp/catalog')
      const body = (response as any).data ?? response
      const items = Array.isArray(body) ? body : (body?.data ?? [])
      return items.map(normalizeProduct)
    },
    enabled,
    retry: 1,
  })
}

export function useWhatsAppCatalogPreview(enabled = true) {
  return useQuery<WhatsAppCatalogPreview>({
    queryKey: ['whatsapp-catalog-preview'],
    queryFn: async () => {
      const response = await apiClient.get('/whatsapp/catalog/import/preview', { params: { limit: 100 } })
      return (response as any).data ?? response
    },
    enabled,
    retry: 1,
  })
}

export function useImportWhatsAppCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload?: { limit?: number }): Promise<ImportResult> => {
      const response = await apiClient.post('/whatsapp/catalog/import', { limit: payload?.limit ?? 100 })
      return (response as any).data ?? response
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-preview'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success(`Imported ${result.created} products and linked ${result.linked}`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not import WhatsApp catalog')
    },
  })
}

export function useSyncCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_?: { businessId?: string; productIds?: string[] }): Promise<SyncResult> => {
      const response = await apiClient.post('/whatsapp/catalog/sync', {})
      return (response as any).data ?? response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
      toast.success('WhatsApp catalog sync started')
    },
    onError: (error: any) => {
      toast(error?.response?.data?.message || 'WhatsApp write sync is not available yet', { icon: 'i' })
    },
  })
}

export function useToggleProductInCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { businessId?: string; productId: string; inCatalog: boolean }) => {
      const response = await apiClient.post('/whatsapp/catalog/toggle', {
        productId: payload.productId,
        inCatalog: payload.inCatalog,
      })
      return (response as any).data ?? response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
    },
  })
}

export function useBulkToggleCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { businessId?: string; productIds: string[]; inCatalog: boolean }) => {
      const response = await apiClient.post('/whatsapp/catalog/bulk-toggle', {
        productIds: payload.productIds,
        inCatalog: payload.inCatalog,
      })
      return (response as any).data ?? response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
    },
  })
}

export function useRemoveFromWhatsAppCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { businessId?: string; productId: string }) => {
      const response = await apiClient.delete(`/whatsapp/catalog/product/${payload.productId}`)
      return (response as any).data ?? response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
    },
  })
}

export function useWhatsAppCatalogStatus(_businessId?: string, enabled = true) {
  return useQuery<WhatsAppSyncStatus>({
    queryKey: ['whatsapp-catalog-status'],
    queryFn: async () => {
      const response = await apiClient.get('/whatsapp/catalog/sync-status')
      return (response as any).data ?? response
    },
    enabled,
  })
}
