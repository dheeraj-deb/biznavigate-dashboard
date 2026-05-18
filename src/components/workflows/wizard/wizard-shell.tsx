'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Settings2,
  Workflow as WorkflowIcon,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useWorkflowDraft } from './use-workflow-draft'
import { StepName } from './step-name'
import { StepTrigger } from './step-trigger'
import { StepSteps } from './step-steps'
import { StepReview } from './step-review'
import type { WorkflowStepId } from './types'

interface WizardShellProps {
  workflowId: string
}

const STEPS: Array<{ id: WorkflowStepId; title: string; subtitle: string; icon: typeof FileText }> = [
  { id: 'name', title: 'Name & template', subtitle: 'Start from scratch or a template', icon: FileText },
  { id: 'trigger', title: 'Trigger', subtitle: 'When should this run?', icon: Zap },
  { id: 'steps', title: 'Steps', subtitle: 'What should happen?', icon: Settings2 },
  { id: 'review', title: 'Review & activate', subtitle: 'Double-check and turn it on', icon: CheckCircle2 },
]

export function WizardShell({ workflowId }: WizardShellProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WorkflowStepId>('name')
  const draft = useWorkflowDraft({ workflowId })

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  const canAdvance = useMemo(() => {
    if (currentStep === 'name') return draft.draft.workflow_name.trim().length >= 2
    if (currentStep === 'trigger') return !!draft.triggerNode
    if (currentStep === 'steps') return draft.stepNodes.length > 0
    return true
  }, [currentStep, draft.draft.workflow_name, draft.triggerNode, draft.stepNodes.length])

  const handleNext = () => {
    const next = STEPS[stepIndex + 1]
    if (next) setCurrentStep(next.id)
  }
  const handleBack = () => {
    const prev = STEPS[stepIndex - 1]
    if (prev) setCurrentStep(prev.id)
    else router.push('/automations')
  }

  if (draft.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/automations')}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All automations
          </button>
          <h1 className="text-2xl font-bold tracking-tight">
            {draft.draft.workflow_name || 'New automation'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{STEPS[stepIndex].subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <SaveStatusBadge status={draft.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/automations/builder/${workflowId}?view=diagram`)}
            title="Open in canvas view"
          >
            <WorkflowIcon className="mr-1.5 h-3.5 w-3.5" />
            View as diagram
          </Button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="outline" className="font-medium">
            Step {stepIndex + 1} of {STEPS.length}
          </Badge>
          <span className="text-xs text-muted-foreground">{STEPS[stepIndex].title}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step pills (clickable for completed steps) */}
        <div className="mt-4 flex gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isPast = i < stepIndex
            return (
              <button
                key={step.id}
                onClick={() => (isPast || isActive ? setCurrentStep(step.id) : undefined)}
                disabled={!isPast && !isActive}
                className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                  isActive
                    ? 'border-primary/30 bg-primary/5 text-foreground'
                    : isPast
                    ? 'border-border bg-card text-foreground hover:bg-muted'
                    : 'border-dashed border-border bg-transparent text-muted-foreground'
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-md ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isPast
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPast ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden truncate font-medium sm:inline">{step.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6">
          {currentStep === 'name' && (
            <StepName
              workflowId={workflowId}
              draft={draft.draft}
              onMetaChange={draft.setMeta}
              onTemplateCloned={(newWorkflowId) => {
                // Cloned templates create a new workflow id; navigate to it.
                router.replace(`/automations/builder/${newWorkflowId}`)
              }}
            />
          )}
          {currentStep === 'trigger' && (
            <StepTrigger
              triggerNode={draft.triggerNode}
              onSelectTrigger={(type, params) => draft.setTrigger(type, params)}
            />
          )}
          {currentStep === 'steps' && (
            <StepSteps
              triggerNode={draft.triggerNode}
              stepNodes={draft.stepNodes}
              connections={draft.draft.connections}
              onAddStep={draft.addStep}
              onUpdateStep={draft.updateStep}
              onRemoveStep={draft.removeStep}
              onReorder={draft.reorderSteps}
              onSetBranches={draft.setBranches}
            />
          )}
          {currentStep === 'review' && (
            <StepReview
              workflowId={workflowId}
              workflowName={draft.draft.workflow_name}
              description={draft.draft.description}
              triggerNode={draft.triggerNode}
              stepNodes={draft.stepNodes}
              connections={draft.draft.connections}
            />
          )}
        </CardContent>
      </Card>

      {/* Footer nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {stepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>
        {currentStep !== 'review' && (
          <Button onClick={handleNext} disabled={!canAdvance}>
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function SaveStatusBadge({ status }: { status: 'idle' | 'dirty' | 'saving' | 'saved' }) {
  if (status === 'idle') return null
  if (status === 'saving') {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </Badge>
    )
  }
  if (status === 'saved') {
    return (
      <Badge variant="outline" className="gap-1.5 border-emerald-200 text-emerald-700">
        <Check className="h-3 w-3" />
        Saved
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1.5 text-amber-700">
      Unsaved changes
    </Badge>
  )
}

