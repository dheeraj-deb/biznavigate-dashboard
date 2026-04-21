/**
 * use-whatsapp-catalog.ts — shim over /catalog
 * /whatsapp/catalog sync endpoints throw 501. Read from /catalog instead.
 * Sync / toggle mutations are no-ops that show an informational message.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { parsePrice } from './use-catalog'
import type { CatalogItem } from './use-catalog'

export interface WhatsAppCatalogProduct {
  product_id: string
  name: string
  description?: string
  price: string
  currency: string
  in_stock: boolean
  in_whatsapp_catalog: boolean
  whatsapp_catalog_id?: string
  whatsapp_sync_status: 'not_synced' | 'pending' | 'syncing' | 'synced' | 'failed'
  whatsapp_sync_error?: string
  whatsapp_synced_at?: string
  product_images?: Array<{ file_path: string; is_primary: boolean }>
}

export interface WhatsAppSyncStatus {
  stats: { synced?: number; pending?: number; failed?: number; syncing?: number; not_synced?: number }
  lastSyncAt?: string
}

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: Array<{ productId: string; error: string }>
}

function toWAProduct(item: CatalogItem): WhatsAppCatalogProduct {
  return {
    product_id: item.item_id,
    name: item.name,
    description: item.description,
    price: String(parsePrice(item.base_price)),
    currency: item.currency ?? 'INR',
    in_stock: item.stock_quantity === null || item.stock_quantity > 0,
    in_whatsapp_catalog: item.is_active,
    whatsapp_sync_status: 'not_synced',
    product_images: item.primary_image_url
      ? [{ file_path: item.primary_image_url, is_primary: true }]
      : [],
  }
}

export function useWhatsAppCatalog(businessId: string, enabled = true) {
  return useQuery<WhatsAppCatalogProduct[]>({
    queryKey: ['whatsapp-catalog', businessId],
    queryFn: async () => {
      const response = await apiClient.get('/catalog', { params: { businessId, limit: 200 } })
      const body = (response as any).data?.data ?? (response as any).data
      const items: CatalogItem[] = Array.isArray(body) ? body : (body?.data ?? [])
      return items.map(toWAProduct)
    },
    enabled: !!businessId && enabled,
    retry: 1,
  })
}

// Sync is not supported — no-op
export function useSyncCatalog() {
  return useMutation({
    mutationFn: async (_: { businessId: string; productIds?: string[] }): Promise<SyncResult> => {
      toast('WhatsApp catalog sync is managed automatically', { icon: 'ℹ️' })
      return { success: true, synced: 0, failed: 0, errors: [] }
    },
  })
}

// Toggle is not supported — no-op
export function useToggleProductInCatalog() {
  return useMutation({
    mutationFn: async (_: { businessId: string; productId: string; inCatalog: boolean }) => {
      toast('Use the catalog page to manage items', { icon: 'ℹ️' })
    },
  })
}

// Bulk toggle is not supported — no-op
export function useBulkToggleCatalog() {
  return useMutation({
    mutationFn: async (_: { businessId: string; productIds: string[]; inCatalog: boolean }) => {
      toast('Use the catalog page to manage items', { icon: 'ℹ️' })
    },
  })
}

// Remove is not supported — no-op
export function useRemoveFromWhatsAppCatalog() {
  return useMutation({
    mutationFn: async (_: { businessId: string; productId: string }) => {
      toast('Use the catalog page to manage items', { icon: 'ℹ️' })
    },
  })
}

export function useWhatsAppCatalogStatus(businessId: string, enabled = true) {
  return useQuery<WhatsAppSyncStatus>({
    queryKey: ['whatsapp-catalog-status', businessId],
    queryFn: async (): Promise<WhatsAppSyncStatus> => ({ stats: {} }),
    enabled: !!businessId && enabled,
  })
}
