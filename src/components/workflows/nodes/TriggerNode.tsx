import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Zap } from 'lucide-react'
import { WorkflowNodeData } from '@/types/workflow.types'

export const TriggerNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white dark:bg-gray-900 min-w-[200px] transition-all ${
        selected
          ? 'border-blue-500 shadow-blue-500/50'
          : 'border-blue-400 dark:border-blue-600'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="font-semibold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wide">
          Trigger
        </div>
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {data.label}
      </div>
      {(data as any).filters && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {Object.entries((data as any).filters).map(([key, value]) => (
            <div key={key}>
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-900"
      />
    </div>
  )
})

TriggerNode.displayName = 'TriggerNode'
