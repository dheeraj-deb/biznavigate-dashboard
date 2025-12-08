'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Zap,
  MessageSquare,
  Mail,
  Tag,
  UserPlus,
  Clock,
  GitBranch,
  CheckCircle,
  FileText,
  ShoppingCart,
  Calendar,
  Instagram,
} from 'lucide-react'

const nodeCategories = [
  {
    id: 'triggers',
    name: 'Triggers',
    icon: Zap,
    color: 'text-blue-600',
    nodes: [
      {
        type: 'trigger',
        label: 'New Lead',
        icon: UserPlus,
        data: { label: 'New Lead Created', type: 'lead_created' },
      },
      {
        type: 'trigger',
        label: 'Order Placed',
        icon: ShoppingCart,
        data: { label: 'Order Placed', type: 'order_placed' },
      },
      {
        type: 'trigger',
        label: 'Scheduled Time',
        icon: Calendar,
        data: { label: 'Scheduled Trigger', type: 'scheduled_time' },
      },
      {
        type: 'trigger',
        label: 'WhatsApp Message',
        icon: MessageSquare,
        data: { label: 'WhatsApp Message Received', type: 'whatsapp_message_received' },
      },
      {
        type: 'trigger',
        label: 'Instagram Comment',
        icon: Instagram,
        data: { label: 'Instagram Comment', type: 'instagram_comment' },
      },
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    icon: Zap,
    color: 'text-green-600',
    nodes: [
      {
        type: 'action',
        label: 'Send WhatsApp',
        icon: MessageSquare,
        data: {
          label: 'Send WhatsApp Message',
          type: 'send_whatsapp',
          message: 'Hi {{name}}! ',
        },
      },
      {
        type: 'action',
        label: 'Send Email',
        icon: Mail,
        data: {
          label: 'Send Email',
          type: 'send_email',
          subject: 'Email Subject',
          body: 'Email content',
        },
      },
      {
        type: 'action',
        label: 'Add Tag',
        icon: Tag,
        data: {
          label: 'Add Lead Tag',
          type: 'add_lead_tag',
          tags: [],
        },
      },
      {
        type: 'action',
        label: 'Assign Lead',
        icon: UserPlus,
        data: {
          label: 'Assign Lead to User',
          type: 'assign_lead',
          assignment_type: 'user',
        },
      },
      {
        type: 'action',
        label: 'Create Follow-up',
        icon: FileText,
        data: {
          label: 'Create Follow-up Task',
          type: 'create_followup',
          scheduled_at: 'tomorrow',
        },
      },
    ],
  },
  {
    id: 'logic',
    name: 'Logic',
    icon: GitBranch,
    color: 'text-purple-600',
    nodes: [
      {
        type: 'condition',
        label: 'Condition',
        icon: GitBranch,
        data: {
          label: 'If/Then Condition',
          conditions: [{ field: 'status', operator: 'equals', value: 'new' }],
          logic: 'AND',
        },
      },
      {
        type: 'wait',
        label: 'Wait',
        icon: Clock,
        data: {
          label: 'Wait/Delay',
          duration: 1,
          unit: 'hours',
        },
      },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: CheckCircle,
    color: 'text-gray-600',
    nodes: [
      {
        type: 'end',
        label: 'End',
        icon: CheckCircle,
        data: {
          label: 'End Workflow',
        },
      },
    ],
  },
]

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('application/nodedata', JSON.stringify(nodeData))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
        <CardTitle className="text-base">Node Library</CardTitle>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Drag nodes to the canvas
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {nodeCategories.map((category) => {
          const CategoryIcon = category.icon
          return (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-2">
                <CategoryIcon className={`h-4 w-4 ${category.color}`} />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {category.name}
                </h3>
              </div>
              <div className="space-y-1.5">
                {category.nodes.map((node) => {
                  const NodeIcon = node.icon
                  return (
                    <div
                      key={`${node.type}-${node.label}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type, node.data)}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-grab active:cursor-grabbing text-sm group"
                    >
                      <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors">
                        <NodeIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {node.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Instructions */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 How to use:
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
