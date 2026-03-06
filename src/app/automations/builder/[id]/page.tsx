'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import {
  Save,
  Play,
  ArrowLeft,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react'
import { WorkflowCanvas } from '@/components/workflows/workflow-canvas'
import { NodePalette } from '@/components/workflows/node-palette'
import { NodeProperties } from '@/components/workflows/node-properties'
import type { Node, Edge } from 'reactflow'
import { MarkerType } from 'reactflow'
import type { WorkflowNodeData } from '@/types/workflow.types'
import { getLayoutedElements } from '@/lib/workflow-layout'
import { Maximize2 } from 'lucide-react'
import { useWorkflow } from '@/hooks/use-workflows'
import { useWorkflowNodes } from '@/hooks/use-workflow-nodes'

export default function WorkflowBuilderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const workflowId = params?.id as string
  const prompt = searchParams.get('prompt')
  const { user } = useAuthStore()

  const [workflowMeta, setWorkflowMeta] = useState({
    name: 'New Workflow',
    description: '',
    status: 'draft',
  })
  const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [workflowDefinition, setWorkflowDefinition] = useState<object | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Fetch existing workflow if id is present
  const { data: existingWorkflow, isLoading: isLoadingWorkflow } = useWorkflow(workflowId)
  const { data: nodeDefsResult, isLoading: isLoadingNodes } = useWorkflowNodes()

  const nodeDefs = (nodeDefsResult as any)?.data?.nodes ?? []

  // Convert backend workflow to React Flow nodes/edges once both are loaded
  useEffect(() => {
    if (initialized) return
    if (!existingWorkflow || nodeDefs.length === 0) return

    console.log("existingWorkflow", existingWorkflow)

    // Update workflow meta
    setWorkflowMeta({
      name: existingWorkflow.workflow_name,
      description: existingWorkflow.description ?? '',
      status: existingWorkflow.is_active ? 'active' : 'draft',
    })

    const backendNodes: any[] = existingWorkflow.workflow_definition?.nodes ?? []
    const backendConnections: Record<string, any> = existingWorkflow.workflow_definition?.connections ?? {}

    // Convert backend nodes → React Flow nodes
    const rfNodes: Node<WorkflowNodeData>[] = backendNodes.map((bn: any, idx: number) => {
      const nodeDef = nodeDefs.find((d: any) => d.type === bn.type)
      // Derive React Flow node type from the dot-prefixed backend type (e.g. "trigger.whatsapp.intent" → "trigger")
      const rfType = nodeDef?.category ?? (bn.type.startsWith('trigger') ? 'trigger' : 'action')
      return {
        id: bn.id,
        type: rfType,
        position: bn.position ?? { x: idx * 200, y: idx * 100 },
        data: {
          type: bn.type,
          label: nodeDef?.label ?? bn.name ?? bn.type,
          icon: nodeDef?.icon ?? '⚡',
          description: nodeDef?.description ?? '',
          waitForInput: nodeDef?.waitForInput ?? false,
          output_variable: nodeDef?.output_variable ?? null,
          schema: nodeDef?.params ?? [],
          params: bn.params ?? {},
        } as any,
      }
    })

    // Convert backend connections → React Flow edges
    // connections format: { [sourceId]: { main: [{ to, condition? }] } }
    // For interactive nodes, condition.value holds the item handle ID (e.g. "option_1")
    const rfEdges: Edge[] = []
    Object.entries(backendConnections).forEach(([sourceId, handleMap]: [string, any]) => {
      const targets: any[] = handleMap?.main ?? []
      targets.forEach(({ to, condition }: { to: string; condition?: any }) => {
        if (!to) return
        // Interactive node edges carry condition.value as the per-item sourceHandle
        const sourceHandle = condition?.value ?? 'default'
        rfEdges.push({
          id: `e${sourceId}-${sourceHandle}-${to}`,
          source: sourceId,
          target: to,
          sourceHandle,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        })
      })
    })

    setNodes(rfNodes)
    setEdges(rfEdges)
    setInitialized(true)
  }, [existingWorkflow, nodeDefs, initialized])

  const INTERACTIVE_KEYS = ['menu', 'options', 'buttons', 'items']

  const buildDefinition = (currentNodes: Node<WorkflowNodeData>[], currentEdges: Edge[]) => {
    // Build a lookup: sourceNodeId → { handleId → targetNodeId }
    const handleTargetMap: Record<string, Record<string, string>> = {}
    currentEdges.forEach(e => {
      const handle = e.sourceHandle ?? 'default'
      if (!handleTargetMap[e.source]) handleTargetMap[e.source] = {}
      handleTargetMap[e.source][handle] = e.target
    })

    console.log("currentnode", currentNodes);
    console.log("currentEdges", currentEdges)

    const connections: Record<string, { main: any[] }> = {}

    currentNodes.forEach(node => {
      const d = node.data as any
      const params: Record<string, any> = (!Array.isArray(d.params) && d.params) ? d.params : {}
      const interactiveKey = INTERACTIVE_KEYS.find(k => Array.isArray(params[k]) && params[k].length > 0)
      const nodeHandles = handleTargetMap[node.id] ?? {}

      if (interactiveKey) {
        // Interactive node: each connected item becomes a main entry with condition
        const connectedItems = (params[interactiveKey] as any[])
          .filter(item => nodeHandles[item.id] != null)
          .map(item => ({
            to: nodeHandles[item.id],
            condition: { operator: 'equals', variable: 'user_input', value: item.id },
          }))
        if (connectedItems.length > 0) {
          connections[node.id] = { main: connectedItems }
        }
      } else {
        // Standard node: main contains simple { to } entries from outgoing edges
        const targets = currentEdges
          .filter(e => e.source === node.id)
          .map(e => ({ to: e.target }))
        if (targets.length > 0) {
          connections[node.id] = { main: targets }
        }
      }
    })

    // Terminal nodes (targeted but never a source) get main: []
    const sourceIds = new Set(currentEdges.map(e => e.source))
    currentEdges.forEach(e => {
      if (!sourceIds.has(e.target) && !connections[e.target]) {
        connections[e.target] = { main: [] }
      }
    })

    console.dir(connections, { depth: null })

    return {
      name: workflowMeta.name,
      nodes: currentNodes.map((n) => {
        const d = n.data as any
        return {
          id: n.id,
          type: d.type as string,
          name: d.label as string,
          position: n.position,
          params: (!Array.isArray(d.params) && d.params) ? d.params : {},
          ...(d.output_variable != null && { output_variable: d.output_variable }),
        }
      }),
      connections,
    }
  }

  const buildPayload = (is_active: boolean) => {
    const def = workflowDefinition
      ? (workflowDefinition as any)
      : buildDefinition(nodes, edges)
    return {
      workflow_id: workflowId,
      workflow_name: workflowMeta.name,
      business_id: user?.business_id ?? '',
      nodes: def.nodes,
      connections: def.connections,
      description: workflowMeta.description || undefined,
      is_active,
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await apiClient.post('/workflows', buildPayload(false))
    } finally {
      setIsSaving(false)
    }
  }

  const handleActivate = async () => {
    setIsActivating(true)
    try {
      await apiClient.post('/workflows', buildPayload(true))
      router.push('/automations')
    } finally {
      setIsActivating(false)
    }
  }

  const handleAutoLayout = () => {
    const layouted = getLayoutedElements(nodes, edges)
    setNodes(layouted.nodes)
    setEdges(layouted.edges)
  }

  const isLoading = isLoadingWorkflow || isLoadingNodes

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/automations')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {workflowMeta.name}
              </h1>
              {workflowMeta.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {workflowMeta.description}
                </p>
              )}
            </div>
            <Badge
              className={
                workflowMeta.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }
            >
              {workflowMeta.status}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleAutoLayout}>
              <Maximize2 className="h-4 w-4 mr-2" />
              Auto Layout
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            {workflowMeta.status === 'draft' && (
              <Button
                onClick={handleActivate}
                disabled={isActivating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate Workflow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* AI Generation Banner (if from prompt) */}
        {prompt && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  AI Generated Workflow
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  Based on your description: "{prompt}"
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  ✓ Review the workflow below • ✓ Edit nodes as needed • ✓ Click "Activate" when ready
                </p>
              </div>
              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading workflow…
          </div>
        )}

        {/* Builder Layout */}
        {!isLoading && (
          <div className="flex-1 flex gap-4 mt-4 min-h-0">
            {/* Left Sidebar - Node Palette */}
            <div className="w-64 flex-shrink-0 overflow-y-auto">
              <NodePalette />
            </div>

            {/* Center - Canvas */}
            <div className="flex-1 min-w-0">
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={setNodes}
                onEdgesChange={(newEdges) => {
                  setEdges(newEdges)
                  const def = buildDefinition(nodes, newEdges)
                  setWorkflowDefinition(def)
                }}
                onNodeSelect={(node) => {
                  // Triggers are self-contained — no properties needed
                  if (node?.type === 'trigger') return
                  setSelectedNode(node)
                }}
              />
            </div>

            {/* Right Sidebar - Properties */}
            {selectedNode && (
              <div className="w-80 flex-shrink-0 overflow-y-auto">
                <NodeProperties
                  node={selectedNode}
                  onUpdate={(updatedNode) => {
                    console.log("updateNode", updatedNode);
                    const updatedNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
                    setNodes(updatedNodes)
                    setSelectedNode(updatedNode)
                    const def = buildDefinition(updatedNodes, edges)
                    setWorkflowDefinition(def)
                  }}
                  onClose={() => setSelectedNode(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
