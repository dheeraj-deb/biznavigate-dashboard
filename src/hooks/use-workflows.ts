import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export interface WorkflowDefinitionMeta {
  workflow_id: string
  workflow_name: string
  workflow_key?: string
  intent_name?: string
  blueprint_key?: string
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
  workflow_key?: string
  workflow_name: string
  version: string
  business_type: string
  intent_name?: string
  blueprint_key?: string
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
  _id?: string
  workflow_id: string
  workflow_name?: string
  description: string | null
  business_id: string
  tenant_id: string
  intent_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
  blueprint_key?: string
  workflow_definition?: WorkflowDefinitionMeta | null
  workflow_definitions: WorkflowDefinitionMeta
}

export function normalizeWorkflowConnections(connections?: Record<string, any> | null): Record<string, any> {
  if (!connections || typeof connections !== 'object') return {}
  return Object.fromEntries(
    Object.entries(connections).map(([source, value]) => {
      if (Array.isArray(value)) return [source, { main: value }]
      if (Array.isArray(value?.main)) return [source, value]
      return [source, { main: [] }]
    }),
  )
}

function normalizeWorkflowDefinition(definition: any): WorkflowDefinitionMeta | null {
  if (!definition) return null
  const workflowDefinition = definition.workflow_definition ?? definition
  return {
    ...definition,
    nodes: workflowDefinition.nodes ?? definition.nodes ?? [],
    connections: normalizeWorkflowConnections(workflowDefinition.connections ?? definition.connections),
  }
}

function normalizeWorkflowSummary(row: any): WorkflowSummary {
  const definition = normalizeWorkflowDefinition(row.workflow_definitions ?? row.workflow_definition ?? null)
  return {
    ...row,
    id: row.id ?? row._id,
    workflow_id: row.workflow_id,
    workflow_name: row.workflow_name ?? definition?.workflow_name,
    description: row.description ?? definition?.description ?? null,
    intent_name: row.intent_name ?? definition?.intent_name,
    is_active: row.is_active ?? definition?.is_active ?? false,
    created_at: row.created_at ?? definition?.created_at,
    updated_at: row.updated_at ?? definition?.updated_at,
    blueprint_key: row.blueprint_key ?? definition?.blueprint_key,
    workflow_definition: definition,
    workflow_definitions: definition,
  }
}

export function useWorkflows(businessId: string) {
  return useQuery({
    queryKey: ['workflows', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/workflows/business/${businessId}`)
      return ((response.data ?? []) as any[]).map(normalizeWorkflowSummary)
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
      const detail = response.data as WorkflowDetail
      return {
        ...detail,
        workflow_definition: {
          nodes: detail.workflow_definition?.nodes ?? [],
          connections: normalizeWorkflowConnections(detail.workflow_definition?.connections),
        },
      } as WorkflowDetail
    },
    enabled: !!workflowId && workflowId !== 'new',
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

/**
 * Toggle a workflow's active flag from the list page. The backend validates
 * before activating and syncs the BullMQ schedule.
 */
export function useToggleWorkflowActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { workflow_id: string; is_active: boolean }) => {
      const response = await apiClient.post(`/workflows/${data.workflow_id}/toggle`, {
        is_active: data.is_active,
      })
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflow', variables.workflow_id] })
      toast.success(variables.is_active ? 'Automation activated' : 'Automation deactivated')
    },
    onError: (error: any) => {
      const errors = error?.response?.data?.errors
      if (Array.isArray(errors) && errors.length) {
        toast.error(`Cannot activate: ${errors[0].message}`)
      } else {
        toast.error(error?.response?.data?.message || error.message || 'Could not update workflow')
      }
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (workflow_id: string) => {
      const response = await apiClient.delete(`/workflows/${workflow_id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Automation deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Could not delete workflow')
    },
  })
}

// ─── Workflow runs ──────────────────────────────────────────────────────────

export interface WorkflowRunSummary {
  execution_id: string
  status: string
  waiting_for_input: boolean | null
  current_node_id: string | null
  lead_id: string | null
  channel: string | null
  chat_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export function useWorkflowRuns(workflowId: string, limit = 50) {
  return useQuery({
    queryKey: ['workflow-runs', workflowId, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/workflows/${workflowId}/runs`, { params: { limit } })
      return (response.data ?? []) as WorkflowRunSummary[]
    },
    enabled: !!workflowId,
  })
}

export interface WorkflowRunStep {
  step_id?: string
  execution_id: string
  workflow_id: string
  node_id: string | null
  node_type: string | null
  node_name: string | null
  status: string
  input: any
  output: any
  error?: string | null
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
}

export interface WorkflowRunDetail {
  execution: any
  steps: WorkflowRunStep[]
}

export function useWorkflowRunDetail(workflowId: string, executionId: string | null) {
  return useQuery({
    queryKey: ['workflow-run', workflowId, executionId],
    queryFn: async () => {
      const response = await apiClient.get(`/workflows/${workflowId}/runs/${executionId}`)
      return response.data as WorkflowRunDetail
    },
    enabled: !!workflowId && !!executionId,
  })
}
