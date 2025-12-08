import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { CheckCircle } from 'lucide-react'
import { WorkflowNodeData } from '@/types/workflow.types'

export const EndNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white dark:bg-gray-900 min-w-[160px] transition-all ${
        selected
          ? 'border-gray-500 shadow-gray-500/50'
          : 'border-gray-400 dark:border-gray-600'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-500 border-2 border-white dark:border-gray-900"
      />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="font-semibold text-xs text-gray-700 dark:text-gray-400 uppercase tracking-wide">
          End
        </div>
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {data.label}
      </div>
    </div>
  )
})

EndNode.displayName = 'EndNode'
