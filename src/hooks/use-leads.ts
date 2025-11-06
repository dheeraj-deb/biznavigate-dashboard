import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Lead, PaginatedResponse } from '@/types'
import toast from 'react-hot-toast'

export function useLeads(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['leads', page, pageSize],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Lead>>(
        `/leads?page=${page}&pageSize=${pageSize}`
      )
      return response.data
    },
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await apiClient.get<Lead>(`/leads/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const response = await apiClient.post<Lead>('/leads', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create lead')
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const response = await apiClient.put<Lead>(`/leads/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] })
      toast.success('Lead updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update lead')
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
      toast.success('Lead deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete lead')
    },
  })
}
