import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Lead } from '@/types'
import toast from 'react-hot-toast'

// Types matching backend
interface LeadFilters {
  businessId?: string
  tenantId?: string
  status?: string
  channel?: string
  source?: string
  intent_type?: string
  search?: string
  assignedTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface LeadStats {
  total_leads: number
  converted_leads: number
  conversion_rate: string
  avg_lead_score: number
  by_status: Array<{ status: string; count: number }>
  by_source: Array<{ source: string; count: number }>
  by_quality: Array<{ quality: string; count: number }>
}

// Get all leads with filters
export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const response = await apiClient.get('/leads', { params: filters })
      return response.data?.data || { data: [], meta: { total: 0 } }
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get single lead by ID
export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await apiClient.get(`/leads/${id}`)
      return response.data?.data
    },
    enabled: !!id,
  })
}

// Get lead timeline
export function useLeadTimeline(id: string) {
  return useQuery({
    queryKey: ['lead-timeline', id],
    queryFn: async () => {
      const response = await apiClient.get(`/leads/${id}/events`)
      return response.data?.data || []
    },
    enabled: !!id,
  })
}

// Get lead statistics
export function useLeadStats(filters?: any) {
  return useQuery({
    queryKey: ['lead-stats', filters],
    queryFn: async () => {
      const response = await apiClient.get('/leads/stats/overview', { params: filters })
      return response.data?.data as LeadStats
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Create new lead
export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/leads', data)
      return response.data?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      toast.success('Lead created successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create lead'
      toast.error(message)
    },
  })
}

// Update lead
export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.patch(`/leads/${id}/context`, data)
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      toast.success('Lead updated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update lead'
      toast.error(message)
    },
  })
}

// Update lead status
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await apiClient.patch(`/leads/${id}/status`, { status, notes })
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      toast.success('Lead status updated')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update status'
      toast.error(message)
    },
  })
}

// Assign lead to user
export function useAssignLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, assigned_to }: { id: string; assigned_to: string }) => {
      const response = await apiClient.patch(`/leads/${id}/assign`, { assigned_to })
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      toast.success('Lead assigned successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to assign lead'
      toast.error(message)
    },
  })
}

// Convert lead to customer — maps to PATCH /leads/:id/status { status: 'won' }
export function useConvertLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; conversion_value?: number; notes?: string }) => {
      const response = await apiClient.patch(`/leads/${id}/status`, { status: 'won', notes })
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      toast.success('Lead converted to customer!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to convert lead'
      toast.error(message)
    },
  })
}

// Delete lead
export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/leads/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      toast.success('Lead deleted successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete lead'
      toast.error(message)
    },
  })
}

// Add note to lead
export function useAddLeadNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const response = await apiClient.post(`/leads/${id}/notes`, { text })
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      toast.success('Note added')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to add note'
      toast.error(message)
    },
  })
}

// Update lead tags
export function useUpdateLeadTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const response = await apiClient.patch(`/leads/${id}/tags`, { tags })
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      toast.success('Tags updated')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update tags'
      toast.error(message)
    },
  })
}

// Create followup for lead
export function useCreateFollowup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, note, scheduled_at, assigned_to }: { id: string; note?: string; scheduled_at?: string; assigned_to?: string }) => {
      const response = await apiClient.post(`/leads/${id}/followups`, { note, scheduled_at, assigned_to })
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-followup-queue'] })
      toast.success('Follow-up scheduled')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to schedule follow-up'
      toast.error(message)
    },
  })
}

// Mark followup as done
export function useMarkFollowupDone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (followupId: string) => {
      const response = await apiClient.patch(`/leads/followups/${followupId}/done`)
      return response.data?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-followup-queue'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Follow-up marked as done')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to mark follow-up as done'
      toast.error(message)
    },
  })
}

// Dashboard: Daily Overview — GET /leads/dashboard/daily-overview
export function useDailyOverview(businessId?: string) {
  return useQuery({
    queryKey: ['dashboard-daily-overview', businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : undefined
      const response = await apiClient.get('/leads/dashboard/daily-overview', { params })
      // Handle both { data: {...} } and { data: { data: {...} } } shapes
      return response.data?.data ?? response.data
    },
    staleTime: 60000,
    retry: 1,
  })
}

// Dashboard: Needs Attention — GET /leads/dashboard/needs-attention
export function useNeedsAttention(businessId?: string) {
  return useQuery({
    queryKey: ['dashboard-needs-attention', businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : undefined
      const response = await apiClient.get('/leads/dashboard/needs-attention', { params })
      const raw = response.data?.data ?? response.data
      return (Array.isArray(raw) ? raw : raw?.leads ?? raw?.data ?? []) as any[]
    },
    staleTime: 60000,
    retry: 1,
  })
}

// Dashboard: Channel Analytics — GET /leads/dashboard/channel-analytics
export function useChannelAnalytics(businessId?: string) {
  return useQuery({
    queryKey: ['dashboard-channel-analytics', businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : undefined
      const response = await apiClient.get('/leads/dashboard/channel-analytics', { params })
      return response.data?.data ?? response.data
    },
    staleTime: 60000,
    retry: 1,
  })
}

// Dashboard: Demand Signals — GET /leads/dashboard/demand-signals
export function useDemandSignals(businessId?: string) {
  return useQuery({
    queryKey: ['dashboard-demand-signals', businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : undefined
      const response = await apiClient.get('/leads/dashboard/demand-signals', { params })
      const raw = response.data?.data ?? response.data
      return (Array.isArray(raw) ? raw : raw?.data ?? []) as any[]
    },
    staleTime: 60000,
    retry: 1,
  })
}

// Dashboard: Followup Queue — GET /leads/dashboard/followup-queue
export function useFollowupQueue(businessId?: string) {
  return useQuery({
    queryKey: ['dashboard-followup-queue', businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : undefined
      const response = await apiClient.get('/leads/dashboard/followup-queue', { params })
      const raw = response.data?.data ?? response.data
      return (Array.isArray(raw) ? raw : raw?.data ?? []) as any[]
    },
    staleTime: 30000,
    retry: 1,
  })
}

// Leads Inbox: Conversations — GET /leads/inbox/conversations
export function useLeadsInboxConversations(businessId?: string) {
  return useQuery({
    queryKey: ['leads-inbox-conversations', businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : undefined
      const response = await apiClient.get('/leads/inbox/conversations', { params })
      const raw = response.data?.data ?? response.data
      return (Array.isArray(raw) ? raw : raw?.data ?? []) as any[]
    },
    staleTime: 30000,
    retry: 1,
  })
}

// Leads Inbox: Messages — GET /leads/inbox/conversations/:id/messages
export function useLeadsInboxMessages(conversationId: string) {
  return useQuery({
    queryKey: ['leads-inbox-messages', conversationId],
    queryFn: async () => {
      const response = await apiClient.get(`/leads/inbox/conversations/${conversationId}/messages`)
      return (response.data?.data ?? []) as any[]
    },
    enabled: !!conversationId,
    staleTime: 30000,
    retry: 1,
  })
}

