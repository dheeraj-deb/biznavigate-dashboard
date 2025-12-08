import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageSquare, Mail, Tag, UserPlus, FileText, Send } from 'lucide-react'
import { WorkflowNodeData } from '@/types/workflow.types'

const getActionIcon = (type: string) => {
  switch (type) {
    case 'send_whatsapp':
      return MessageSquare
    case 'send_email':
      return Mail
    case 'add_tag':
    case 'add_lead_tag':
      return Tag
    case 'assign_lead':
      return UserPlus
    case 'create_followup':
      return FileText
    default:
      return Send
  }
}

export const ActionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const Icon = getActionIcon((data as any).type || 'action')

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white dark:bg-gray-900 min-w-[200px] transition-all ${
        selected
          ? 'border-green-500 shadow-green-500/50'
          : 'border-green-400 dark:border-green-600'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-green-500 border-2 border-white dark:border-gray-900"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div className="font-semibold text-xs text-green-700 dark:text-green-400 uppercase tracking-wide">
          Action
        </div>
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {data.label}
      </div>
      {(data as any).message && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {(data as any).message}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500 border-2 border-white dark:border-gray-900"
      />
    </div>
  )
})

ActionNode.displayName = 'ActionNode'
