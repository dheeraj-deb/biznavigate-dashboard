import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface NodeParamConstraints {
  min?: number
  max?: number
  pattern?: string
  enum?: string[]
}

export interface NodeParamDefinition {
  key: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'select'
  items?: NodeParamDefinition[]
  constraints?: NodeParamConstraints
}

export interface NodeDefinition {
  type: string
  category: 'trigger' | 'action'
  label: string
  description: string
  icon: string
  waitForInput: boolean
  params: NodeParamDefinition[]
}

interface NodeDefinitionsResponse {
  total: number
  nodes: NodeDefinition[]
  grouped: {
    trigger?: NodeDefinition[]
    action?: NodeDefinition[]
  }
}

export interface WorkflowVariable {
  path: string
  label: string
  example: string
}

export interface WorkflowVariablesResponse {
  system: WorkflowVariable[]
  node_outputs: WorkflowVariable[]
}

/** GET /workflows/variables — optionally filtered by node types */
export function useWorkflowVariables(nodeTypes?: string[]) {
  return useQuery({
    queryKey: ['workflow-variables', nodeTypes ?? []],
    queryFn: async () => {
      const params = nodeTypes?.length ? { nodeTypes: nodeTypes.join(',') } : undefined
      const response = await apiClient.get('/workflows/variables', { params })
      return response.data as WorkflowVariablesResponse
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useWorkflowNodes() {
  return useQuery({
    queryKey: ['workflow-nodes'],
    queryFn: async () => {
      // This endpoint returns { total, nodes, grouped } directly
      const response = await apiClient.get('/workflows/nodes')
      return response as unknown as { data: NodeDefinitionsResponse }
    },
    staleTime: Infinity, // node definitions don't change at runtime
    retry: 1,
    retryDelay: 1000,
  })
}
