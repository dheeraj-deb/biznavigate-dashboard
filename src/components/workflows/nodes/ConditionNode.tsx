import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { GitBranch } from 'lucide-react'
import { WorkflowNodeData } from '@/types/workflow.types'

export const ConditionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white dark:bg-gray-900 min-w-[200px] transition-all ${
        selected
          ? 'border-purple-500 shadow-purple-500/50'
          : 'border-purple-400 dark:border-purple-600'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 border-2 border-white dark:border-gray-900"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center flex-shrink-0">
          <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="font-semibold text-xs text-purple-700 dark:text-purple-400 uppercase tracking-wide">
          Condition
        </div>
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {data.label}
      </div>
      {(data as any).conditions && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {(data as any).conditions.length} condition(s)
        </div>
      )}
      {/* Yes/True handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="w-3 h-3 !bg-green-500 border-2 border-white dark:border-gray-900"
        style={{ left: '30%' }}
      />
      {/* No/False handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="w-3 h-3 !bg-red-500 border-2 border-white dark:border-gray-900"
        style={{ left: '70%' }}
      />
      <div className="flex justify-between mt-2 text-xs font-medium">
        <span className="text-green-600 dark:text-green-400" style={{ marginLeft: '10%' }}>
          Yes
        </span>
        <span className="text-red-600 dark:text-red-400" style={{ marginRight: '10%' }}>
          No
        </span>
      </div>
    </div>
  )
})

ConditionNode.displayName = 'ConditionNode'
