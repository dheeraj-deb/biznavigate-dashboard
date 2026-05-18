'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, FileText } from 'lucide-react'
import { useCloneTemplate, useWorkflowTemplates } from '@/hooks/use-workflows'

interface StepNameProps {
  workflowId: string
  draft: { workflow_name: string; description: string; nodes: any[] }
  onMetaChange: (patch: { workflow_name?: string; description?: string }) => void
  onTemplateCloned: (newWorkflowId: string) => void
}

export function StepName({ workflowId, draft, onMetaChange, onTemplateCloned }: StepNameProps) {
  const { user } = useAuthStore()
  const businessType = (user as any)?.business_type as string | undefined
  const { data: templates = [], isLoading: isLoadingTemplates } = useWorkflowTemplates(businessType)
  const cloneMutation = useCloneTemplate()
  const [cloning, setCloning] = useState<string | null>(null)

  // If the draft already has non-trigger nodes, the user has past Step 1 work
  // and we should NOT offer templates (they'd overwrite). We only show templates
  // when the workflow is truly empty.
  const isEmpty = draft.nodes.length === 0

  const handleClone = async (templateId: string) => {
    if (!user?.business_id) return
    setCloning(templateId)
    try {
      const result = await cloneMutation.mutateAsync({
        templateId,
        business_id: user.business_id,
        workflow_name: draft.workflow_name?.trim() || undefined,
      })
      if (result?.workflow_id) {
        onTemplateCloned(result.workflow_id)
      }
    } finally {
      setCloning(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Name + description */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="wf-name" className="text-sm font-medium">
            Automation name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="wf-name"
            placeholder="e.g. Welcome new customers"
            value={draft.workflow_name}
            onChange={(e) => onMetaChange({ workflow_name: e.target.value })}
            className="mt-1.5"
            autoFocus
          />
          <p className="mt-1 text-xs text-muted-foreground">A short label so you can find this later.</p>
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

      {/* Templates */}
      {isEmpty && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Start from a template</h3>
            <span className="text-xs text-muted-foreground">(or skip to build from scratch)</span>
          </div>

          {isLoadingTemplates ? (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No templates available for your business type yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleClone(t.id)}
                  disabled={cloning !== null}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-muted text-lg">
                    {t.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold group-hover:text-primary">{t.name}</h4>
                      {cloning === t.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Or continue with a blank automation
            </Button>
          </div>
        </div>
      )}

      {!isEmpty && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            This automation already has steps. Template selection is only available for empty workflows — to start over, delete this automation and create a new one.
          </p>
        </div>
      )}
    </div>
  )
}
