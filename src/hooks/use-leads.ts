import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Lead } from '@/types'
import toast from 'react-hot-toast'

interface LeadFilters {
  status?: string
  channel?: string
  source?: string
  intent_type?: string
  search?: string
  assigned_to?: string
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: any) {
  return res.data?.data ?? res.data
}

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const response = await apiClient.get('/leads', { params: filters })
      return response.data || { data: [], meta: { total: 0 } }
    },
    retry: 1,
    retryDelay: 1000,
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await apiClient.get(`/leads/${id}`)
      return unwrap(response) as Lead
    },
    enabled: !!id,
  })
}

export function useLeadTimeline(id: string) {
  return useQuery({
    queryKey: ['lead-timeline', id],
    queryFn: async () => {
      const response = await apiClient.get(`/leads/${id}/events`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (unwrap(response) ?? []) as any[]
    },
    enabled: !!id,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLeadStats(filters?: any) {
  return useQuery({
    queryKey: ['lead-stats', filters],
    queryFn: async () => {
      const response = await apiClient.get('/leads/dashboard', { params: filters })
      return unwrap(response) as LeadStats
    },
    retry: 1,
    retryDelay: 1000,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/leads', data)
      return unwrap(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      toast.success('Lead created successfully')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to create lead')
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.patch(`/leads/${id}`, data)
      return unwrap(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      toast.success('Lead updated successfully')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update lead')
    },
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string; notes?: string }) => {
      // Status update goes through PATCH /leads/:id
      const response = await apiClient.patch(`/leads/${id}`, { status })
      return unwrap(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      toast.success('Lead status updated')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update status')
    },
  })
}

export function useAssignLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, assigned_to }: { id: string; assigned_to: string }) => {
      const response = await apiClient.patch(`/leads/${id}`, { assigned_to })
      return unwrap(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      toast.success('Lead assigned successfully')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to assign lead')
    },
  })
}

export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; conversion_value?: number; notes?: string }) => {
      const response = await apiClient.patch(`/leads/${id}`, { status: 'converted' })
      return unwrap(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      toast.success('Lead converted!')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to convert lead')
    },
  })
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete lead')
    },
  })
}

// Notes are timeline events — POST /leads/:id/events { type: 'note', description }
export function useAddLeadNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const response = await apiClient.post(`/leads/${id}/events`, { type: 'note', description: text })
      return unwrap(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      toast.success('Note added')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to add note')
    },
  })
}

export function useCreateFollowup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note, scheduled_at, assigned_to }: { id: string; note?: string; scheduled_at?: string; assigned_to?: string }) => {
      const response = await apiClient.post(`/leads/${id}/followups`, { note, scheduled_at, assigned_to })
      return unwrap(response)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-followup-queue'] })
      toast.success('Follow-up scheduled')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to schedule follow-up')
    },
  })
}

// PATCH /leads/:leadId/followups/:followupId/done
export function useMarkFollowupDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, followupId }: { leadId: string; followupId: string }) => {
      const response = await apiClient.patch(`/leads/${leadId}/followups/${followupId}/done`)
      return unwrap(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-followup-queue'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Follow-up marked as done')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to mark follow-up as done')
    },
  })
}

export function useResortWorklist(days = 14) {
  return useQuery({
    queryKey: ['dashboard-resort-worklist', days],
    queryFn: async () => {
      const response = await apiClient.get('/leads/dashboard/resort-worklist', { params: { days } })
      const raw = response.data?.data ?? response.data
      return raw?.data ?? raw ?? {
        booking_link_sent: [],
        demand_missed: [],
        upcoming_bookings: [],
        property_options: [],
        counts: { booking_link_sent: 0, demand_missed: 0, upcoming_bookings: 0 },
      }
    },
    staleTime: 60000,
    retry: 1,
  })
}

// ── Dashboard sub-hooks ───────────────────────────────────────────────────────

export function useResortReminderReadiness(days = 14) {
  return useQuery({
    queryKey: ['dashboard-resort-reminders', days],
    queryFn: async () => {
      const response = await apiClient.get('/leads/dashboard/resort-reminders', { params: { days } })
      const raw = response.data?.data ?? response.data
      return raw?.data ?? raw ?? {
        ready: [],
        stopped: [],
        missing_details: [],
        counts: { ready: 0, stopped: 0, missing_details: 0, total: 0 },
        rule: 'Booking reminders are shown only after live occupancy is checked.',
        checked_at: null,
      }
    },
    staleTime: 30000,
    retry: 1,
  })
}

export function useDailyOverview() {
  return useQuery({
    queryKey: ['dashboard-daily-overview'],
    queryFn: async () => {
      const response = await apiClient.get('/leads/dashboard/daily-overview')
      return response.data?.data ?? response.data
    },
    staleTime: 60000,
    retry: 1,
  })
}

export function useNeedsAttention() {
  return useQuery({
    queryKey: ['dashboard-needs-attention'],
    queryFn: async () => {
      const response = await apiClient.get('/leads/dashboard/needs-attention')
      const raw = response.data?.data ?? response.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Array.isArray(raw) ? raw : raw?.leads ?? raw?.data ?? []) as any[]
    },
    staleTime: 60000,
    retry: 1,
  })
}

export function useChannelAnalytics() {
  return useQuery({
    queryKey: ['dashboard-channel-analytics'],
    queryFn: async () => {
      const response = await apiClient.get('/leads/dashboard/channel-analytics')
      return response.data?.data ?? response.data
    },
    staleTime: 60000,
    retry: 1,
  })
}

export function useDemandSignals() {
  return useQuery({
    queryKey: ['dashboard-demand-signals'],
    queryFn: async () => {
      const response = await apiClient.get('/leads/dashboard/demand-signals')
      const raw = response.data?.data ?? response.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Array.isArray(raw) ? raw : raw?.data ?? []) as any[]
    },
    staleTime: 60000,
    retry: 1,
  })
}

export function useFollowupQueue() {
  return useQuery({
    queryKey: ['dashboard-followup-queue'],
    queryFn: async () => {
      const response = await apiClient.get('/leads/dashboard/followup-queue')
      const raw = response.data?.data ?? response.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Array.isArray(raw) ? raw : raw?.data ?? []) as any[]
    },
    staleTime: 30000,
    retry: 1,
  })
}

// ── Inbox hooks (correct path: /inbox/conversations) ─────────────────────────

export function useLeadsInboxConversations() {
  return useQuery({
    queryKey: ['leads-inbox-conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/inbox/conversations')
      const raw = response.data?.data ?? response.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Array.isArray(raw) ? raw : raw?.data ?? []) as any[]
    },
    staleTime: 30000,
    retry: 1,
  })
}

export function useLeadsInboxMessages(conversationId: string) {
  return useQuery({
    queryKey: ['leads-inbox-messages', conversationId],
    queryFn: async () => {
      const response = await apiClient.get(`/inbox/conversations/${conversationId}/messages`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (unwrap(response) ?? []) as any[]
    },
    enabled: !!conversationId,
    staleTime: 30000,
    retry: 1,
  })
}
