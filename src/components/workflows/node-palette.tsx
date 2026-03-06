'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, MessageSquare, Loader2 } from 'lucide-react'
import { useWorkflowNodes, type NodeDefinition } from '@/hooks/use-workflow-nodes'

const CATEGORY_META = {
  trigger: { label: 'Triggers', Icon: Zap, color: 'text-blue-600' },
  action: { label: 'Actions', Icon: MessageSquare, color: 'text-green-600' },
} as const

export function NodePalette() {
  const { data, isLoading, isError, error } = useWorkflowNodes()

  console.log("data", data);

  const onDragStart = (event: React.DragEvent, node: NodeDefinition) => {
    // category ('trigger' | 'action') maps to the React Flow node type used by the canvas
    event.dataTransfer.setData('application/reactflow', node.category)
    event.dataTransfer.setData(
      'application/nodedata',
      JSON.stringify({ ...node })
    )
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
        <CardTitle className="text-base">Node Library</CardTitle>
        <p className="text-xs text-gray-600 dark:text-gray-400">Drag nodes to the canvas</p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading nodes…
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-400">
            {(error as Error)?.message ?? 'Failed to load nodes'}
          </div>
        )}

        {!isLoading && !isError &&
          (['trigger', 'action'] as const).map((category) => {
            const nodes = data?.data?.grouped[category]
            if (!nodes?.length) return null
            const { label, Icon, color } = CATEGORY_META[category]

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {label}
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {nodes.map((node: NodeDefinition) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node)}
                      title={node.description}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-grab active:cursor-grabbing text-sm group"
                    >
                      <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors text-base">
                        {node.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-gray-900 dark:text-gray-100 font-medium truncate">
                          {node.label}
                        </span>
                        {node.waitForInput && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">
                            waits for reply
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

        {/* Instructions */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How to use:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Drag nodes to the canvas</li>
              <li>• Click to connect nodes</li>
              <li>• Click nodes to edit properties</li>
              <li>• Delete with backspace/delete key</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
