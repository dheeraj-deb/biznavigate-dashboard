import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export interface WorkflowDefinitionMeta {
  workflow_id: string
  workflow_name: string
  workflow_key: string
  intent_name: string
  description: string | null
  version: string
  is_active: boolean
  created_at: string
  updated_at: string
  nodes: any[]
  connections: Record<string, any>
}

export interface WorkflowDetail {
  workflow_id: string
  workflow_key: string
  workflow_name: string
  version: string
  business_type: string
  intent_name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  workflow_definition: {
    nodes: any[]
    connections: Record<string, any>
  }
}

export interface WorkflowSummary {
  id: string
  workflow_id: string
  workflow_name: string
  description: string | null
  business_id: string
  tenant_id: string
  intent_name: string
  is_active: boolean
  created_at: string
  updated_at: string
  workflow_definitions: WorkflowDefinitionMeta
}

export function useWorkflows(businessId: string) {
  return useQuery({
    queryKey: ['workflows', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/workflows/business/${businessId}`)
      return (response.data ?? []) as WorkflowSummary[]
    },
    enabled: !!businessId,
  })
}

export function useInitiateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { workflow_name: string; business_id: string; description?: string }) => {
      const response = await apiClient.post('/workflows/initiate', data)
      return (response.data?.data || response.data) as { workflow_id: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create workflow')
    },
  })
}

export function useWorkflow(workflowId: string) {
  return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const response = await apiClient.get(`/workflows/${workflowId}`)
      return response.data as WorkflowDetail
    },
    enabled: !!workflowId && workflowId !== 'new',
  })
}

// ─── Wizard-specific hooks ──────────────────────────────────────────────────

export interface WorkflowTemplateSummary {
  id: string
  name: string
  description: string
  icon: string
  category: 'engagement' | 'commerce' | 'support' | 'reactivation'
  business_types: string[]
}

export function useWorkflowTemplates(businessType?: string) {
  return useQuery({
    queryKey: ['workflow-templates', businessType ?? null],
    queryFn: async () => {
      const params = businessType ? { businessType } : undefined
      const response = await apiClient.get('/workflows/templates', { params })
      return (response.data ?? []) as WorkflowTemplateSummary[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCloneTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { templateId: string; business_id: string; workflow_name?: string }) => {
      const { templateId, ...body } = data
      const response = await apiClient.post(`/workflows/templates/${templateId}/clone`, body)
      return (response.data?.data || response.data) as { workflow_id: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Could not clone template')
    },
  })
}

/**
 * Wizard autosave mutation. Sends the full draft to PUT /workflows; the backend
 * warn-logs validation issues on drafts instead of throwing. Activation is a
 * separate concern via useActivateWorkflow.
 */
export function useSaveWorkflowDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      workflow_id: string
      workflow_name: string
      description?: string
      nodes: any[]
      connections: Record<string, any>
    }) => {
      const response = await apiClient.put('/workflows', { ...data, is_active: false })
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', variables.workflow_id] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Could not save draft')
    },
  })
}

export function useActivateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      workflow_id: string
      workflow_name: string
      description?: string
      nodes: any[]
      connections: Record<string, any>
    }) => {
      const response = await apiClient.put('/workflows', { ...data, is_active: true })
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', variables.workflow_id] })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: any) => {
      const errors = error?.response?.data?.errors
      if (Array.isArray(errors) && errors.length) {
        toast.error(`Cannot activate: ${errors[0].message}`)
      } else {
        toast.error(error?.response?.data?.message || error.message || 'Could not activate workflow')
      }
    },
  })
}
