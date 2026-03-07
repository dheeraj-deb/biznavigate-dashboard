import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type CampaignType = 'ONE_TIME' | 'RECURRING'

export type VariableSource =
  | 'contact.name'
  | 'contact.phone'
  | 'system.current_date'
  | 'system.current_time'

export interface VariableMapping {
  variableIndex: number // 0-based: variableIndex 0 → {{1}} in template
  source: VariableSource
}

export type AudienceField =
  | 'engagement_score'
  | 'total_orders'
  | 'total_spent'
  | 'last_order_date'
  | 'name'
  | 'phone'

export type AudienceOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'

export interface AudienceCondition {
  field: AudienceField
  operator: AudienceOperator
  value: string | number
}

export interface AudienceFilter {
  operator: 'AND' | 'OR'
  conditions: AudienceCondition[]
}

export interface CampaignSchedule {
  sendAt?: string
  timezone?: string
  cronExpression?: string
  endsAt?: string
}

export interface Campaign {
  _id: string
  name: string
  description?: string
  type: CampaignType
  status: CampaignStatus
  templateId: string
  templateLanguage: string
  variableMappings?: VariableMapping[]
  audienceFilter?: AudienceFilter
  explicitPhoneNumbers?: string[]
  schedule?: CampaignSchedule
  analytics?: {
    total: number
    pending: number
    sent: number
    failed: number
    delivery_rate: number  // pre-computed percentage, e.g. 87.5
    read_rate: number      // pre-computed percentage, e.g. 62.5
  }
  createdAt: string
  updatedAt: string
}

export interface CreateCampaignPayload {
  name: string
  description?: string
  type: CampaignType
  templateId: string
  templateLanguage: string
  variableMappings?: VariableMapping[]
  audienceFilter?: AudienceFilter
  explicitPhoneNumbers?: string[]
  schedule?: CampaignSchedule
}

export interface CampaignFilters {
  status?: CampaignStatus | 'all'
  type?: CampaignType | 'all'
  search?: string
  page?: number
  limit?: number
}

export interface CampaignsResponse {
  data: Campaign[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useCampaigns(filters?: CampaignFilters) {
  const { user } = useAuthStore()
  const params = {
    ...filters,
    status: filters?.status === 'all' ? undefined : filters?.status,
    type: filters?.type === 'all' ? undefined : filters?.type,
  }

  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: async () => {
      const response = await apiClient.get('/campaigns', { params })
      const body = response.data as any
      const list: Campaign[] = Array.isArray(body) ? body : (body?.data ?? [])
      const pagination = Array.isArray(body)
        ? { total: list.length, page: 1, limit: 20, totalPages: 1 }
        : (body?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 })
      return { data: list, pagination } as CampaignsResponse
    },
    enabled: !!user?.business_id,
  })
}

export function useGetCampaign(id: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await apiClient.get(`/campaigns/${id}`)
      const body = response.data as any
      return (body?.data || body) as Campaign
    },
    enabled: !!user?.business_id && !!id,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateCampaignPayload) => {
      const response = await apiClient.post('/campaigns', data)
      const body = response.data as any
      return (body?.data || body) as Campaign
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign created as draft')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create campaign')
    },
  })
}

export function useLaunchCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/campaigns/${id}/launch`)
      return response.data as { message: string; totalRecipients: number; sendAt: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign'] })
      toast.success(`Launched — ${data.totalRecipients.toLocaleString()} recipients queued`)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to launch campaign')
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/campaigns/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign deleted')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete campaign')
    },
  })
}

export function usePauseCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/campaigns/${id}/pause`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign paused')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to pause campaign')
    },
  })
}

export function useResumeCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/campaigns/${id}/resume`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign resumed')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to resume campaign')
    },
  })
}
