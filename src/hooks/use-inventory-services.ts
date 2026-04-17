/**
 * use-inventory-services.ts — shim over use-catalog.ts
 * /inventory/services is gone (501). Calls go to /catalog?item_type=accommodation|activity.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { parsePrice } from './use-catalog'
import type { CatalogItem } from './use-catalog'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ServiceAmenities {
  [category: string]: string[]
}

export interface ServiceAttributes {
  bed_type?: string
  room_size_sqft?: number
  smoking_allowed?: boolean
  pets_allowed?: boolean
  children_allowed?: boolean
  max_children?: number
  amenities?: ServiceAmenities
  highlights?: string[]
  meal_plan?: string
  [key: string]: unknown
}

export interface InventoryService {
  id: string
  businessId: string
  name: string
  type: string
  description?: string
  base_price: number
  capacity: number
  total_units: number
  check_in_time?: string
  check_out_time?: string
  cancellation_policy?: string
  tax_percentage?: number
  extra_guest_charge?: number
  max_adults?: number
  attributes: ServiceAttributes
  image_urls?: string[]
  is_active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServicePayload {
  name: string
  type: string
  description?: string
  base_price: number
  capacity: number
  total_units: number
  check_in_time?: string
  check_out_time?: string
  cancellation_policy?: string
  tax_percentage?: number
  extra_guest_charge?: number
  max_adults?: number
  attributes?: ServiceAttributes
  image_urls?: string[]
}

// ── Normalizer ────────────────────────────────────────────────────────────────

function toService(item: CatalogItem): InventoryService {
  const attrs = (item.attributes ?? {}) as Record<string, unknown>
  return {
    id: item.item_id,
    businessId: '',
    name: item.name,
    type: (attrs.type as string) ?? item.item_type,
    description: item.description,
    base_price: parsePrice(item.base_price),
    capacity: Number(attrs.capacity ?? 0),
    total_units: Number(attrs.total_units ?? 0),
    check_in_time: attrs.check_in_time as string | undefined,
    check_out_time: attrs.check_out_time as string | undefined,
    cancellation_policy: attrs.cancellation_policy as string | undefined,
    tax_percentage: attrs.tax_percentage as number | undefined,
    extra_guest_charge: attrs.extra_guest_charge as number | undefined,
    max_adults: attrs.max_adults as number | undefined,
    attributes: attrs as ServiceAttributes,
    image_urls: item.image_urls,
    is_active: item.is_active,
    createdAt: item.created_at ?? '',
    updatedAt: item.updated_at ?? '',
  }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useServices(type?: string) {
  const itemType = type === 'activity' ? 'activity' : 'accommodation'
  return useQuery({
    queryKey: ['inventory-services', type ?? 'all'],
    queryFn: async () => {
      const res = await apiClient.get('/catalog', { params: { item_type: itemType, limit: 200 } })
      const body = (res as any).data
      const items: CatalogItem[] = Array.isArray(body) ? body : (body?.data ?? [])
      return items.map(toService)
    },
    staleTime: 30 * 1000,
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['inventory-service', id],
    queryFn: async () => {
      const res = await apiClient.get(`/catalog/${id}`)
      const raw = (res as any).data
      const item: CatalogItem = raw?.data ?? raw
      return toService(item)
    },
    enabled: !!id,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateServicePayload) => {
      const { name, description, base_price, capacity, total_units, type,
              check_in_time, check_out_time, cancellation_policy,
              tax_percentage, extra_guest_charge, max_adults,
              attributes, image_urls } = payload
      const itemType = type === 'activity' ? 'activity' : 'accommodation'
      const res = await apiClient.post('/catalog', {
        item_type: itemType,
        name,
        description,
        base_price,
        image_urls,
        attributes: {
          ...attributes,
          type,
          capacity,
          total_units,
          check_in_time,
          check_out_time,
          cancellation_policy,
          tax_percentage,
          extra_guest_charge,
          max_adults,
        },
      })
      const raw = (res as any).data
      const item: CatalogItem = raw?.data ?? raw
      return toService(item)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-services'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create service')
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreateServicePayload> }) => {
      const { name, description, base_price, capacity, total_units,
              check_in_time, check_out_time, cancellation_policy,
              tax_percentage, extra_guest_charge, max_adults,
              attributes, image_urls } = payload
      const res = await apiClient.patch(`/catalog/${id}`, {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(base_price !== undefined && { base_price }),
        ...(image_urls !== undefined && { image_urls }),
        attributes: {
          ...attributes,
          ...(capacity !== undefined && { capacity }),
          ...(total_units !== undefined && { total_units }),
          ...(check_in_time !== undefined && { check_in_time }),
          ...(check_out_time !== undefined && { check_out_time }),
          ...(cancellation_policy !== undefined && { cancellation_policy }),
          ...(tax_percentage !== undefined && { tax_percentage }),
          ...(extra_guest_charge !== undefined && { extra_guest_charge }),
          ...(max_adults !== undefined && { max_adults }),
        },
      })
      const raw = (res as any).data
      const item: CatalogItem = raw?.data ?? raw
      return toService(item)
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-services'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-service', id] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update service')
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/catalog/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-services'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Service deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete service')
    },
  })
}
