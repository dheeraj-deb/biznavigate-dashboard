import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Lead } from '@/types'
import toast from 'react-hot-toast'

// Types matching backend
interface LeadFilters {
  status?: string
  source?: string
  quality?: string
  page?: number
  limit?: number
  search?: string
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
      const response = await apiClient.get('/api/v1/leads', { params: filters })
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
      const response = await apiClient.get(`/api/v1/leads/${id}`)
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
      const response = await apiClient.get(`/api/v1/leads/${id}/timeline`)
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
      const response = await apiClient.get('/api/v1/leads/stats/overview', { params: filters })
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
      const response = await apiClient.post('/api/v1/leads', data)
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
      const response = await apiClient.patch(`/api/v1/leads/${id}`, data)
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
      const response = await apiClient.patch(`/api/v1/leads/${id}/status`, { status, notes })
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
      const response = await apiClient.post(`/api/v1/leads/${id}/assign`, { assigned_to })
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

// Convert lead to customer
export function useConvertLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, conversion_value, notes }: { id: string; conversion_value?: number; notes?: string }) => {
      const response = await apiClient.post(`/api/v1/leads/${id}/convert`, { conversion_value, notes })
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
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
      await apiClient.delete(`/api/v1/leads/${id}`)
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

// Bulk import leads
export function useBulkImportLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { leads: any[] }) => {
      const response = await apiClient.post('/api/v1/leads/bulk-import', data)
      return response.data?.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      toast.success(`Imported ${data?.success || 0} leads successfully`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Bulk import failed'
      toast.error(message)
    },
  })
}
