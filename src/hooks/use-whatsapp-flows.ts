import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FlowStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'BLOCKED'
export type FlowCategory =
  | 'SIGN_UP'
  | 'SIGN_IN'
  | 'APPOINTMENT_BOOKING'
  | 'LEAD_GENERATION'
  | 'CONTACT_US'
  | 'CUSTOMER_SUPPORT'
  | 'SURVEY'
  | 'OTHER'

export interface WhatsAppFlow {
  _id: string
  businessId: string
  name: string
  category: FlowCategory
  status: FlowStatus
  flowJson?: Record<string, any>
  endpointUri?: string
  metaFlowId: string | null
  createdAt: string
  updatedAt?: string
}

export interface FlowFilters {
  status?: FlowStatus | 'all'
  category?: FlowCategory | 'all'
  search?: string
  page?: number
  limit?: number
}

export interface FlowsResponse {
  data: WhatsAppFlow[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateFlowPayload {
  name: string
  category: FlowCategory
  flowJson?: Record<string, any>
  endpointUri?: string
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useWhatsAppFlows(filters?: FlowFilters) {
  const { user } = useAuthStore()
  const params = {
    ...filters,
    status: filters?.status === 'all' ? undefined : filters?.status,
    category: filters?.category === 'all' ? undefined : filters?.category,
  }

  return useQuery({
    queryKey: ['whatsapp-flows', params],
    queryFn: async () => {
      const response = await apiClient.get('/whatsapp/flows', { params })
      const body = response.data as any
      const list: WhatsAppFlow[] = Array.isArray(body) ? body : (body?.data ?? [])
      const pagination = Array.isArray(body)
        ? { total: list.length, page: 1, limit: 20, totalPages: 1 }
        : (body?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 })
      return { data: list, pagination } as FlowsResponse
    },
    enabled: !!user?.business_id,
  })
}

export function useGetFlow(id: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['whatsapp-flow', id],
    queryFn: async () => {
      const response = await apiClient.get(`/whatsapp/flows/${id}`)
      return (response.data?.data ?? response.data) as WhatsAppFlow
    },
    enabled: !!user?.business_id && !!id,
  })
}

/** POST /whatsapp/flows — creates a DRAFT */
export function useCreateFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFlowPayload) => {
      const response = await apiClient.post('/whatsapp/flows', data)
      return (response.data?.data ?? response.data) as WhatsAppFlow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] })
      toast.success('Flow saved as draft')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create flow')
    },
  })
}

/** PATCH /whatsapp/flows/:id — update DRAFT (cannot update PUBLISHED) */
export function useUpdateFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateFlowPayload> }) => {
      const response = await apiClient.patch(`/whatsapp/flows/${id}`, data)
      return (response.data?.data ?? response.data) as WhatsAppFlow
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow', id] })
      toast.success('Flow updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update flow')
    },
  })
}

/** POST /whatsapp/flows/:id/submit — creates on Meta, uploads Flow JSON */
export function useSubmitFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/whatsapp/flows/${id}/submit`)
      return response.data as { message: string; metaFlowId: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow'] })
      toast.success(`Submitted to Meta — ID: ${data.metaFlowId}. Now publish to make it live.`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit flow to Meta')
    },
  })
}

/** POST /whatsapp/flows/:id/publish — makes the flow live */
export function usePublishFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/whatsapp/flows/${id}/publish`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow'] })
      toast.success('Flow is now live!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish flow')
    },
  })
}

/** POST /whatsapp/flows/:id/deprecate — stops the flow from being sent */
export function useDeprecateFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/whatsapp/flows/${id}/deprecate`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow'] })
      toast.success('Flow deprecated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deprecate flow')
    },
  })
}

/** POST /whatsapp/flows/:id/sync — pull latest status from Meta */
export function useSyncFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/whatsapp/flows/${id}/sync`)
      return response.data as { status: FlowStatus }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flow'] })
      toast.success(`Status synced: ${data.status}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync status')
    },
  })
}

/** DELETE /whatsapp/flows/:id */
export function useDeleteFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/whatsapp/flows/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] })
      toast.success('Flow deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete flow')
    },
  })
}
