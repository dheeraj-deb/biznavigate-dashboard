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
