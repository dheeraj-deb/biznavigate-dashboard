'use client'

import { useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  applyEdgeChanges,
  useNodesState,
  useEdgesState,
  NodeTypes,
  MarkerType,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { WorkflowNodeData } from '@/types/workflow.types'
import { TriggerNode } from './nodes/TriggerNode'
import { ActionNode } from './nodes/ActionNode'
import { ConditionNode } from './nodes/ConditionNode'
import { WaitNode } from './nodes/WaitNode'
import { EndNode } from './nodes/EndNode'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useWorkflowNodes } from '@/hooks/use-workflow-nodes'

interface WorkflowCanvasProps {
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
  onNodesChange: (nodes: Node<WorkflowNodeData>[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onNodeSelect: (node: Node<WorkflowNodeData> | null) => void
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  wait: WaitNode,
  end: EndNode,
}

export function WorkflowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Sync nodes from parent:
  // - Initial load (canvas empty): replace entirely with parent nodes
  // - Subsequent updates (e.g. Apply): only sync `data`, preserve position/selection
  useEffect(() => {
    if (initialNodes.length === 0) return
    setNodes((current) => {
      if (current.length === 0) return initialNodes
      return current.map((n) => {
        const parent = initialNodes.find((p) => p.id === n.id)
        return parent ? { ...n, data: parent.data } : n
      })
    })
  }, [initialNodes])

  // Sync edges from parent on initial load
  useEffect(() => {
    if (initialEdges.length === 0) return
    setEdges((current) => {
      if (current.length === 0) return initialEdges
      return current
    })
  }, [initialEdges])
  const { data, isLoading, isError, error } = useWorkflowNodes()

  // Update parent when nodes change
  const onNodesChangeWrapper = useCallback(
    (changes: any) => {
      handleNodesChange(changes)
      // Notify parent after a short delay to ensure state is updated
      setTimeout(() => {
        onNodesChange(nodes)
      }, 0)
    },
    [handleNodesChange, nodes, onNodesChange]
  )

  // Update parent when edges change (deletions, selections, etc.)
  const onEdgesChangeWrapper = useCallback(
    (changes: any) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds)
        onEdgesChange(next)
        return next
      })
    },
    [setEdges, onEdgesChange]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `e${connection.source}-${connection.sourceHandle ?? 'default'}-${connection.target}`,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      }
      setEdges((eds) => {
        const next = addEdge(newEdge, eds)
        onEdgesChange(next)
        return next
      })
    },
    [setEdges, onEdgesChange]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
      onNodeSelect(node)
    },
    [onNodeSelect]
  )

  const onPaneClick = useCallback(() => {
    onNodeSelect(null)
  }, [onNodeSelect])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      }

      const nodeData = JSON.parse(event.dataTransfer.getData('application/nodedata'))

      console.log("ndoeData", nodeData);

      console.log("type", type)

      const newNode: Node<WorkflowNodeData> = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: nodeData,
      }

      setNodes((nds) => [...nds, newNode])
      setTimeout(() => {
        onNodesChange([...nodes, newNode])
      }, 0)
      onNodeSelect(newNode);
    },
    [setNodes, nodes, onNodesChange]
  )

  return (
    <div ref={reactFlowWrapper} className="h-full w-full bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWrapper}
        onEdgesChange={onEdgesChangeWrapper}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Background
          color="#94a3b8"
          gap={16}
          size={1}
          className="dark:opacity-30"
        />
        <Controls className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800" />
        <MiniMap
          className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800"
          nodeColor={(node) => {
            switch (node.type) {
              case 'trigger':
                return '#3b82f6'
              case 'action':
                return '#10b981'
              case 'condition':
                return '#8b5cf6'
              case 'wait':
                return '#f59e0b'
              case 'end':
                return '#6b7280'
              default:
                return '#94a3b8'
            }
          }}
        />
        <Panel position="top-right" className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 m-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="font-semibold mb-1">Tips:</p>
            <p>• Click nodes to edit</p>
            <p>• Drag to connect</p>
            <p>• Scroll to zoom</p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
