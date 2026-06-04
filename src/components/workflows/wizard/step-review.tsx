'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useActivateWorkflow, useWorkflows } from '@/hooks/use-workflows'
import { useWorkflowNodes } from '@/hooks/use-workflow-nodes'
import type { NodeDefinition, WizardConnections, WizardNode } from './types'

interface StepReviewProps {
  workflowId: string
  workflowName: string
  description: string
  triggerNode: WizardNode | null
  stepNodes: WizardNode[]
  connections: WizardConnections
}

export function StepReview({
  workflowId,
  workflowName,
  description,
  triggerNode,
  stepNodes,
  connections,
}: StepReviewProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const activate = useActivateWorkflow()
  const { data: nodeDefsResult } = useWorkflowNodes()
  const { data: existingWorkflows = [] } = useWorkflows(user?.business_id ?? '')
  const [activated, setActivated] = useState(false)

  const defByType = useMemo(() => {
    const all = (nodeDefsResult as any)?.data?.nodes ?? (nodeDefsResult as any)?.nodes ?? []
    return new Map<string, NodeDefinition>(all.map((d: NodeDefinition) => [d.type, d]))
  }, [nodeDefsResult])

  // Detect trigger collision: another ACTIVE workflow with the same actual
  // trigger signature. Event and schedule triggers commonly have no intent, so
  // comparing only intent would mark unrelated blueprints as duplicates.
  const collisionWith = useMemo(() => {
    if (!triggerNode || !existingWorkflows.length) return null
    const triggerSignature = signatureForTrigger(triggerNode)
    return existingWorkflows.find((w) => {
      if (w.workflow_id === workflowId) return false
      if (!w.is_active) return false
      const otherTrigger = w.workflow_definitions?.nodes?.find((node: WizardNode) => node.type?.startsWith('trigger.'))
      return otherTrigger ? signatureForTrigger(otherTrigger) === triggerSignature : false
    })
  }, [existingWorkflows, triggerNode, workflowId])

  const validationIssues = useMemo(
    () => collectValidationIssues(triggerNode, stepNodes, connections, defByType),
    [triggerNode, stepNodes, connections, defByType],
  )

  const canActivate = validationIssues.length === 0
  const isActivating = activate.isPending

  const handleActivate = async () => {
    if (!canActivate || !workflowId) return
    try {
      await activate.mutateAsync({
        workflow_id: workflowId,
        workflow_name: workflowName,
        description,
        nodes: triggerNode ? [triggerNode, ...stepNodes] : stepNodes,
        connections,
      })
      setActivated(true)
    } catch {
      /* toast already shown by hook */
    }
  }

  if (activated) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-xl font-bold">Your automation is live</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Next time the trigger fires, this flow will run automatically.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.push('/automations')}>
            Back to automations
          </Button>
          <Button onClick={() => router.push(`/automations/${workflowId}/runs`)}>
            View runs
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Review your automation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Double-check everything is right, then activate.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
        <p className="mt-1 text-base font-semibold">{workflowName || 'Untitled automation'}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}

        <div className="my-3 h-px bg-border" />

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trigger</p>
        <p className="mt-1 text-sm">
          {triggerNode ? (
            <>
              <span className="font-medium">
                {defByType.get(triggerNode.type)?.label ?? triggerNode.type}
              </span>
              {triggerNode.type === 'trigger.whatsapp.intent' && triggerNode.params?.intent && (
                <span className="ml-1.5 text-muted-foreground">
                  · intent ={' '}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                    {triggerNode.params.intent}
                  </code>
                </span>
              )}
            </>
          ) : (
            <span className="text-amber-700">No trigger selected</span>
          )}
        </p>

        <div className="my-3 h-px bg-border" />

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Steps ({stepNodes.length})
        </p>
        {stepNodes.length === 0 ? (
          <p className="mt-1 text-sm text-amber-700">No steps yet</p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {stepNodes.map((node, i) => {
              const def = defByType.get(node.type)
              return (
                <li key={node.id} className="flex items-start gap-2 text-sm">
                  <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-shrink-0">{def?.icon ?? '⚙️'}</span>
                  <span className="min-w-0">
                    <span className="font-medium">{node.name || def?.label || node.type}</span>
                    {def?.waitForInput && (
                      <span className="ml-1.5 text-[10px] font-semibold uppercase text-amber-700">
                        · waits
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {/* Validation issues */}
      {validationIssues.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Fix these before activating</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {validationIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Trigger collision warning */}
      {collisionWith && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
            <div className="flex-1 text-sm text-amber-900">
              <p className="font-semibold">Heads up — another active automation has the same trigger</p>
              <p className="mt-1">
                &ldquo;{collisionWith.workflow_name}&rdquo; is already listening for this trigger. Activating
                this one will replace it as the active workflow.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          size="lg"
          onClick={handleActivate}
          disabled={!canActivate || isActivating}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isActivating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Activate automation
        </Button>
      </div>
    </div>
  )
}

function collectValidationIssues(
  trigger: WizardNode | null,
  steps: WizardNode[],
  connections: WizardConnections,
  defByType: Map<string, NodeDefinition>,
): string[] {
  const issues: string[] = []
  if (!trigger) issues.push('Pick a trigger in Step 2')
  if (trigger?.type === 'trigger.whatsapp.intent' && !trigger.params?.intent) {
    issues.push('The intent trigger needs an intent name')
  }
  if (steps.length === 0) issues.push('Add at least one step')

  // Required params per node type (we mirror what the runtime needs).
  for (const node of steps) {
    const def = defByType.get(node.type)
    if (!def) continue
    if (node.type === 'action.send_message' && !node.params?.message?.trim()) {
      issues.push(`"${node.name || def.label}" — message text is empty`)
    }
    if (node.type === 'action.send_message_withmenu') {
      if (!node.params?.message?.trim()) issues.push(`"${node.name || def.label}" — message is empty`)
      if (!Array.isArray(node.params?.menu) || node.params.menu.length === 0)
        issues.push(`"${node.name || def.label}" — needs at least one menu item`)
    }
    if (node.type === 'action.send_message_with_btns') {
      if (!Array.isArray(node.params?.buttons) || node.params.buttons.length === 0)
        issues.push(`"${node.name || def.label}" — needs at least one button`)
    }
    if (node.type === 'action.send_template' && !node.params?.template_name?.trim()) {
      issues.push(`"${node.name || def.label}" — template name is required`)
    }
  }

  // Reachability — every step should be reachable from the trigger via connections.
  if (trigger) {
    const reachable = new Set<string>([trigger.id])
    const stack = [trigger.id]
    while (stack.length) {
      const cur = stack.pop()!
      for (const e of connectionEdges(connections[cur])) {
        if (e.node && !reachable.has(e.node)) {
          reachable.add(e.node)
          stack.push(e.node)
        }
      }
    }
    for (const s of steps) {
      if (!reachable.has(s.id)) {
        issues.push(`"${s.name || s.type}" is not connected — drag it into the flow`)
      }
    }
  }

  return issues
}

function connectionEdges(value: any): Array<{ node: string; condition?: any }> {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.main)) return value.main
  return []
}

function signatureForTrigger(node: WizardNode): string {
  const params = node.params ?? {}
  if (node.type === 'trigger.whatsapp.intent') {
    return `${node.type}:${String(params.intent ?? '').trim().toLowerCase()}`
  }
  if (node.type === 'trigger.event.lead_status_changed') {
    return `${node.type}:${stableString({
      event: params.event ?? 'lead.status_changed',
      to_status: params.to_status ?? [],
      from_status: params.from_status ?? [],
    })}`
  }
  if (node.type.startsWith('trigger.event.')) {
    return `${node.type}:${params.event ?? node.type}`
  }
  if (node.type === 'trigger.schedule') {
    return `${node.type}:${stableString(params.schedule ?? params)}`
  }
  return `${node.type}:${stableString(params)}`
}

function stableString(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stableString).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${key}:${stableString(value[key])}`).join(',')}}`
  }
  return String(value ?? '')
}
