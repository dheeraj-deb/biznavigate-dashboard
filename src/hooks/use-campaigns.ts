import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'paused'
export type CampaignType = 'promotional' | 'transactional' | 'announcement' | 'reminder'
export type CampaignChannel = 'whatsapp' | 'sms'

export interface Campaign {
  campaign_id: string
  campaign_name: string
  campaign_type: CampaignType
  channel: CampaignChannel
  status: CampaignStatus
  message_template: string
  total_recipients: number
  sent_count: number
  delivered_count: number
  read_count: number
  clicked_count: number
  replied_count: number
  failed_count: number
  scheduled_at?: string
  sent_at?: string
  created_at: string
  has_media?: boolean
  buttons?: string[]
  target_audience?: string[]
}

export interface CampaignFilters {
  business_id?: string
  status?: CampaignStatus | 'all'
  campaign_type?: CampaignType | 'all'
  search?: string
  page?: number
  limit?: number
}

export interface CampaignsResponse {
  data: Campaign[]
  total: number
  page: number
  limit: number
}

export function useCampaigns(filters?: CampaignFilters) {
  const { user } = useAuthStore()
  const params = {
    business_id: user?.business_id,
    ...filters,
    status: filters?.status === 'all' ? undefined : filters?.status,
    campaign_type: filters?.campaign_type === 'all' ? undefined : filters?.campaign_type,
  }

  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: async () => {
      const response = await apiClient.get('/campaigns', { params })
      return (response.data?.data || response.data) as CampaignsResponse
    },
    enabled: !!user?.business_id,
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiClient.delete(`/campaigns/${campaignId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete campaign')
    },
  })
}

export function usePauseCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiClient.patch(`/campaigns/${campaignId}/pause`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign paused')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to pause campaign')
    },
  })
}

export function useResumeCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiClient.patch(`/campaigns/${campaignId}/resume`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign resumed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resume campaign')
    },
  })
}
