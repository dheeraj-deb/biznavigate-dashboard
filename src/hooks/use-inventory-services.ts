import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────

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
  // extra fields (star rating, location, rooms, etc.)
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

// ── Hooks ────────────────────────────────────────────────────────────────────

/** GET /inventory/services?type=... */
export function useServices(type?: string) {
  return useQuery({
    queryKey: ['inventory-services', type ?? 'all'],
    queryFn: async () => {
      const params = type ? { type } : undefined
      const res = await apiClient.get('/inventory/services', { params })
      const raw = (res as any).data
      return (raw?.data ?? raw ?? []) as InventoryService[]
    },
    staleTime: 30 * 1000,
  })
}

/** GET /inventory/services/:id */
export function useService(id: string) {
  return useQuery({
    queryKey: ['inventory-service', id],
    queryFn: async () => {
      const res = await apiClient.get(`/inventory/services/${id}`)
      const raw = (res as any).data
      return (raw?.data ?? raw) as InventoryService
    },
    enabled: !!id,
  })
}

/** POST /inventory/services */
export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateServicePayload) => {
      const res = await apiClient.post('/inventory/services', payload)
      const raw = (res as any).data
      return (raw?.data ?? raw) as InventoryService
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-services'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create service')
    },
  })
}

/** PATCH /inventory/services/:id — send only changed fields; merge attributes before calling */
export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreateServicePayload> }) => {
      const res = await apiClient.patch(`/inventory/services/${id}`, payload)
      const raw = (res as any).data
      return (raw?.data ?? raw) as InventoryService
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-services'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-service', id] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update service')
    },
  })
}

/** DELETE /inventory/services/:id */
export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/inventory/services/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-services'] })
      toast.success('Service deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete service')
    },
  })
}
