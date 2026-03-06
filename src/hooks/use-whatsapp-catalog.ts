import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

export interface WhatsAppCatalogProduct {
  product_id: string;
  name: string;
  description?: string;
  price: string;
  currency: string;
  in_stock: boolean;
  in_whatsapp_catalog: boolean;
  whatsapp_catalog_id?: string;
  whatsapp_sync_status: 'not_synced' | 'pending' | 'syncing' | 'synced' | 'failed';
  whatsapp_sync_error?: string;
  whatsapp_synced_at?: string;
  product_images?: Array<{
    file_path: string;
    is_primary: boolean;
  }>;
}

export interface WhatsAppSyncStatus {
  stats: {
    synced?: number;
    pending?: number;
    failed?: number;
    syncing?: number;
    not_synced?: number;
  };
  lastSyncAt?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{
    productId: string;
    error: string;
  }>;
}

/**
 * Get all products in WhatsApp catalog
 */
export function useWhatsAppCatalog(businessId: string, enabled = true) {
  return useQuery<WhatsAppCatalogProduct[]>({
    queryKey: ['whatsapp-catalog', businessId],
    queryFn: async () => {
      const response = await apiClient.get<WhatsAppCatalogProduct[]>(
        `/whatsapp/catalog/${businessId}`
      );
      return response.data || [];
    },
    enabled: !!businessId && enabled,
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Toggle single product in catalog
 */
export function useToggleProductInCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      productId,
      inCatalog,
    }: {
      businessId: string;
      productId: string;
      inCatalog: boolean;
    }) => {
      const response = await apiClient.post(
        `/whatsapp/catalog/${businessId}/toggle`,
        { productId, inCatalog }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog', variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status', variables.businessId] });

      toast.success(
        variables.inCatalog
          ? 'Product added to WhatsApp catalog'
          : 'Product removed from WhatsApp catalog'
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update catalog');
    },
  });
}

/**
 * Bulk toggle products in catalog
 */
export function useBulkToggleCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      productIds,
      inCatalog,
    }: {
      businessId: string;
      productIds: string[];
      inCatalog: boolean;
    }) => {
      const response = await apiClient.post(
        `/whatsapp/catalog/${businessId}/bulk-toggle`,
        { productIds, inCatalog }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog', variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status', variables.businessId] });

      toast.success(
        `${variables.productIds.length} products ${variables.inCatalog ? 'added to' : 'removed from'} catalog`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to bulk update catalog');
    },
  });
}

/**
 * Sync catalog products to WhatsApp
 */
export function useSyncCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      productIds,
    }: {
      businessId: string;
      productIds?: string[];
    }) => {
      const response = await apiClient.post<SyncResult>(
        `/whatsapp/catalog/${businessId}/sync`,
        { productIds }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog', variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status', variables.businessId] });

      // Handle undefined or null data
      if (!data) {
        toast.error('Sync completed but received no response data');
        return;
      }

      const syncedCount = data.synced || 0;
      const failedCount = data.failed || 0;

      if (failedCount > 0) {
        toast.error(
          `Synced ${syncedCount} products, ${failedCount} failed. Check console for errors.`,
          { duration: 5000 }
        );
        if (data.errors) {
          console.error('Sync errors:', data.errors);
        }
      } else {
        toast.success(`Successfully synced ${syncedCount} products to WhatsApp`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync catalog to WhatsApp');
    },
  });
}

/**
 * Remove product from WhatsApp catalog
 */
export function useRemoveFromWhatsAppCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      productId,
    }: {
      businessId: string;
      productId: string;
    }) => {
      const response = await apiClient.delete(
        `/whatsapp/catalog/${businessId}/product/${productId}`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog', variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status', variables.businessId] });

      toast.success('Product removed from WhatsApp catalog');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove product from catalog');
    },
  });
}

/**
 * Get sync status statistics
 */
export function useWhatsAppCatalogStatus(businessId: string, enabled = true) {
  return useQuery<WhatsAppSyncStatus>({
    queryKey: ['whatsapp-catalog-status', businessId],
    queryFn: async () => {
      const response = await apiClient.get<WhatsAppSyncStatus>(
        `/whatsapp/catalog/${businessId}/sync-status`
      );
      return response.data || { stats: {} };
    },
    enabled: !!businessId && enabled,
    retry: 1,
    retryDelay: 1000,
    refetchInterval: 10000, // Refetch every 10 seconds while syncing
  });
}
