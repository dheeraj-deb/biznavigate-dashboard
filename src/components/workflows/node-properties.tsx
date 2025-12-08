'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import type { Node } from 'reactflow'
import type { WorkflowNodeData } from '@/types/workflow.types'

interface NodePropertiesProps {
  node: Node<WorkflowNodeData>
  onUpdate: (node: Node<WorkflowNodeData>) => void
  onClose: () => void
}

export function NodeProperties({ node, onUpdate, onClose }: NodePropertiesProps) {
  const handleUpdate = (field: string, value: any) => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        [field]: value,
      },
    }
    onUpdate(updatedNode)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Node Properties</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {node.type} node
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={node.data.label || ''}
            onChange={(e) => handleUpdate('label', e.target.value)}
            placeholder="Node label"
          />
        </div>

        {/* Type-specific fields */}
        {node.type === 'action' && (node.data as any).type === 'send_whatsapp' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={(node.data as any).message || ''}
                onChange={(e) => handleUpdate('message', e.target.value)}
                placeholder="WhatsApp message content"
                rows={4}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Use variables like {'{'}
                {'{'}name{'}'} {'}'}, {'{'}
                {'{'}phone{'}'} {'}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">Send To</Label>
              <Input
                id="to"
                value={(node.data as any).to || ''}
                onChange={(e) => handleUpdate('to', e.target.value)}
                placeholder="{{lead.phone_number}}"
              />
            </div>
          </>
        )}

        {node.type === 'wait' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="number"
                value={(node.data as any).duration || ''}
                onChange={(e) => handleUpdate('duration', parseInt(e.target.value))}
                placeholder="2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <select
                id="unit"
                value={(node.data as any).unit || 'hours'}
                onChange={(e) => handleUpdate('unit', e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </>
        )}

        {node.type === 'condition' && (
          <div className="space-y-2">
            <Label>Condition</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure the if/then logic for this node
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs">
              <pre className="text-gray-700 dark:text-gray-300">
                {JSON.stringify((node.data as any).conditions, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={node.data.description || ''}
            onChange={(e) => handleUpdate('description', e.target.value)}
            placeholder="Add notes about this node"
            rows={3}
          />
        </div>

        {/* Info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Node ID:</strong> {node.id}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
