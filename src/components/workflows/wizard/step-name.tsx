'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface StepNameProps {
  workflowId: string
  draft: { workflow_name: string; description: string; nodes: any[] }
  onMetaChange: (patch: { workflow_name?: string; description?: string }) => void
  onTemplateCloned: (newWorkflowId: string) => void
}

export function StepName({ draft, onMetaChange }: StepNameProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="wf-name" className="text-sm font-medium">
          Automation name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="wf-name"
          placeholder="e.g. Booking confirmation"
          value={draft.workflow_name}
          onChange={(e) => onMetaChange({ workflow_name: e.target.value })}
          className="mt-1.5"
          autoFocus
        />
        <p className="mt-1 text-xs text-muted-foreground">Blueprints are seeded from your business type. Name any custom automation clearly.</p>
      </div>
      <div>
        <Label htmlFor="wf-desc" className="text-sm font-medium">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="wf-desc"
          placeholder="What does this automation do?"
          value={draft.description}
          onChange={(e) => onMetaChange({ description: e.target.value })}
          className="mt-1.5 min-h-20"
        />
      </div>
    </div>
  )
}
