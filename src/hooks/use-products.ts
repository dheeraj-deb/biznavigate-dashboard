/**
 * use-products.ts — shim over use-catalog.ts
 * /products is gone (501). All calls go to /catalog.
 */
import { useQueryClient } from '@tanstack/react-query'
import {
  useCatalog,
  useCatalogItem,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeleteCatalogItem,
  parsePrice,
  type CatalogItem,
} from './use-catalog'

export function useProducts(page = 1, pageSize = 10, businessId?: string) {
  const result = useCatalog({ businessId, page, limit: pageSize, item_type: 'physical_product' })
  // Normalise CatalogItem → legacy Product shape so pages keep working
  const data = result.data
    ? {
        data: result.data.data.map(item => ({
          ...item,
          product_id: item.item_id,
          id: item.item_id,
          price: parsePrice(item.base_price),
          track_inventory: item.stock_quantity !== null,
        })),
        products: result.data.data.map(item => ({
          ...item,
          product_id: item.item_id,
          id: item.item_id,
          price: parsePrice(item.base_price),
          track_inventory: item.stock_quantity !== null,
        })),
        total: result.data.meta.total,
        page,
        limit: pageSize,
      }
    : undefined
  return { ...result, data }
}

export function useProduct(id: string) {
  const result = useCatalogItem(id)
  const data = result.data
    ? {
        ...result.data,
        product_id: result.data.item_id,
        id: result.data.item_id,
        price: parsePrice(result.data.base_price),
        track_inventory: result.data.stock_quantity !== null,
      }
    : undefined
  return { ...result, data }
}

export function useCreateProduct() {
  const inner = useCreateCatalogItem()
  return {
    ...inner,
    mutate: (data: any, opts?: any) =>
      inner.mutate({ ...data, item_type: data.item_type ?? 'physical_product', base_price: data.base_price ?? data.price }, opts),
    mutateAsync: (data: any, opts?: any) =>
      inner.mutateAsync({ ...data, item_type: data.item_type ?? 'physical_product', base_price: data.base_price ?? data.price }, opts),
  }
}

export function useUpdateProduct() {
  const inner = useUpdateCatalogItem()
  return {
    ...inner,
    mutate: (vars: { id: string; data: Partial<CatalogItem> }, opts?: any) =>
      inner.mutate({ itemId: vars.id, data: vars.data }, opts),
    mutateAsync: (vars: { id: string; data: Partial<CatalogItem> }, opts?: any) =>
      inner.mutateAsync({ itemId: vars.id, data: vars.data }, opts),
  }
}

export function useDeleteProduct() {
  const inner = useDeleteCatalogItem()
  return {
    ...inner,
    mutate: (id: string, opts?: any) => inner.mutate(id, opts),
    mutateAsync: (id: string, opts?: any) => inner.mutateAsync(id, opts),
  }
}
