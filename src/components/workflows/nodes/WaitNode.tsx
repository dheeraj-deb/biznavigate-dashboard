import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Clock } from 'lucide-react'
import { WorkflowNodeData } from '@/types/workflow.types'

export const WaitNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const duration = (data as any).duration
  const unit = (data as any).unit

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white dark:bg-gray-900 min-w-[200px] transition-all ${
        selected
          ? 'border-yellow-500 shadow-yellow-500/50'
          : 'border-yellow-400 dark:border-yellow-600'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-yellow-500 border-2 border-white dark:border-gray-900"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center flex-shrink-0">
          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="font-semibold text-xs text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
          Wait
        </div>
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {data.label}
      </div>
      {duration && unit && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {duration} {unit}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-yellow-500 border-2 border-white dark:border-gray-900"
      />
    </div>
  )
})

WaitNode.displayName = 'WaitNode'
