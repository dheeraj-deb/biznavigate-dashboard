'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import {
  Save,
  Play,
  ArrowLeft,
  Sparkles,
  Settings,
  Zap,
  Check,
  Loader2,
} from 'lucide-react'
import { WorkflowCanvas } from '@/components/workflows/workflow-canvas'
import { NodePalette } from '@/components/workflows/node-palette'
import { NodeProperties } from '@/components/workflows/node-properties'
import type { Node, Edge } from 'reactflow'
import type { WorkflowNodeData } from '@/types/workflow.types'
import { getLayoutedElements } from '@/lib/workflow-layout'
import { Maximize2 } from 'lucide-react'

// Mock AI-generated workflow based on prompt
const generateMockWorkflow = (prompt: string) => {
  // Simple detection based on keywords
  const isInstagramLead = prompt.toLowerCase().includes('instagram')
  const isOrderDelivery = prompt.toLowerCase().includes('order') && prompt.toLowerCase().includes('deliver')

  if (isInstagramLead) {
    return {
      name: 'Instagram Lead Follow-up',
      description: 'Automated follow-up for Instagram leads',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: {
            label: 'New Lead from Instagram',
            type: 'lead_created',
            filters: { source: 'instagram' },
          },
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 250, y: 180 },
          data: {
            label: 'Send WhatsApp Message',
            type: 'send_whatsapp',
            template_id: 'product_catalog',
            message: 'Hi {{name}}! Thanks for your interest. Here\'s our product catalog...',
          },
        },
        {
          id: 'wait-1',
          type: 'wait',
          position: { x: 250, y: 310 },
          data: {
            label: 'Wait 2 Hours',
            duration: 2,
            unit: 'hours',
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 250, y: 440 },
          data: {
            label: 'Did they reply?',
            conditions: [{ field: 'last_activity_at', operator: 'is_null', value: null }],
            logic: 'AND',
          },
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 100, y: 600 },
          data: {
            label: 'Assign to Sales Team',
            type: 'assign_lead',
            assignment_type: 'team',
            team_id: 'sales',
          },
        },
        {
          id: 'action-3',
          type: 'action',
          position: { x: 100, y: 730 },
          data: {
            label: 'Create Follow-up Task',
            type: 'create_followup',
            scheduled_at: 'tomorrow',
            note: 'Follow up on Instagram lead',
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 400, y: 600 },
          data: {
            label: 'End',
          },
        },
      ] as Node<WorkflowNodeData>[],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'action-1' },
        { id: 'e2', source: 'action-1', target: 'wait-1' },
        { id: 'e3', source: 'wait-1', target: 'condition-1' },
        { id: 'e4', source: 'condition-1', target: 'action-2', sourceHandle: 'yes' },
        { id: 'e5', source: 'action-2', target: 'action-3' },
        { id: 'e6', source: 'condition-1', target: 'end-1', sourceHandle: 'no' },
      ] as Edge[],
    }
  }

  // Default simple workflow
  return {
    name: 'New Automation',
    description: 'AI-generated workflow',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: {
          label: 'Workflow Trigger',
          type: 'manual',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 250, y: 200 },
        data: {
          label: 'End',
        },
      },
    ] as Node<WorkflowNodeData>[],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'end-1' },
    ] as Edge[],
  }
}

export default function WorkflowBuilderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const workflowId = params.id as string
  const prompt = searchParams.get('prompt')

  const [workflow, setWorkflow] = useState<any>(null)
  const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isActivating, setIsActivating] = useState(false)

  useEffect(() => {
    // Load or generate workflow
    if (prompt) {
      // AI-generated workflow from prompt
      const generated = generateMockWorkflow(prompt)
      setWorkflow({
        workflow_id: workflowId,
        name: generated.name,
        description: generated.description,
        status: 'draft',
        user_prompt: prompt,
      })
      // Apply auto-layout
      const layouted = getLayoutedElements(generated.nodes, generated.edges)
      setNodes(layouted.nodes)
      setEdges(layouted.edges)
    } else {
      // Load existing workflow (mock data)
      setWorkflow({
        workflow_id: workflowId,
        name: 'Instagram Lead Follow-up',
        description: 'Automated follow-up for Instagram leads',
        status: 'active',
      })
      const generated = generateMockWorkflow('instagram lead')
      // Apply auto-layout
      const layouted = getLayoutedElements(generated.nodes, generated.edges)
      setNodes(layouted.nodes)
      setEdges(layouted.edges)
    }
  }, [workflowId, prompt])

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const handleActivate = async () => {
    setIsActivating(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsActivating(false)
    router.push('/automations')
  }

  const handleAutoLayout = () => {
    const layouted = getLayoutedElements(nodes, edges)
    setNodes(layouted.nodes)
    setEdges(layouted.edges)
  }

  if (!workflow) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

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
                {workflow.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {workflow.description}
              </p>
            </div>
            <Badge
              className={
                workflow.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }
            >
              {workflow.status}
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
            {workflow.status === 'draft' && (
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

        {/* Builder Layout */}
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
              onEdgesChange={setEdges}
              onNodeSelect={setSelectedNode}
            />
          </div>

          {/* Right Sidebar - Properties */}
          {selectedNode && (
            <div className="w-80 flex-shrink-0 overflow-y-auto">
              <NodeProperties
                node={selectedNode}
                onUpdate={(updatedNode) => {
                  setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n))
                  setSelectedNode(updatedNode)
                }}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
