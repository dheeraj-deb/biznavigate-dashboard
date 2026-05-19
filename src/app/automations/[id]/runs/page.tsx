'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  PauseCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  useWorkflow,
  useWorkflowRunDetail,
  useWorkflowRuns,
  type WorkflowRunSummary,
} from '@/hooks/use-workflows'

/**
 * Per-workflow runs page. Lists the most recent workflow_executions rows for
 * this workflow, with a side panel that shows the step-by-step trace for the
 * selected execution. Driven by the new GET /workflows/:id/runs and
 * /workflows/:id/runs/:executionId endpoints.
 */
export default function WorkflowRunsPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params?.id as string

  const { data: workflow } = useWorkflow(workflowId)
  const { data: runs = [], isLoading, isError } = useWorkflowRuns(workflowId)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const activeExecutionId = selectedExecutionId ?? runs[0]?.execution_id ?? null
  const { data: detail } = useWorkflowRunDetail(workflowId, activeExecutionId)

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6">
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
              {workflow?.workflow_name ?? 'Workflow runs'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The {runs.length} most recent executions for this automation.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push(`/automations/builder/${workflowId}`)}>
            Open builder
          </Button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Couldn&rsquo;t load runs for this workflow.
            </CardContent>
          </Card>
        ) : runs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold">No runs yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This automation hasn&rsquo;t fired since it was activated.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            {/* Left — run list */}
            <div className="space-y-2">
              {runs.map((run) => (
                <RunCard
                  key={run.execution_id}
                  run={run}
                  active={run.execution_id === activeExecutionId}
                  onSelect={() => setSelectedExecutionId(run.execution_id)}
                />
              ))}
            </div>

            {/* Right — detail */}
            <Card>
              <CardContent className="p-5">
                {!detail ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Pick a run on the left to see step details.
                  </div>
                ) : (
                  <RunDetail detail={detail} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function RunCard({
  run,
  active,
  onSelect,
}: {
  run: WorkflowRunSummary
  active: boolean
  onSelect: () => void
}) {
  const status = normaliseStatus(run.status, run.waiting_for_input)
  const StatusIcon = status.icon
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border bg-card p-3 text-left transition',
        active ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/30',
      )}
    >
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('gap-1.5 text-[11px]', status.color)}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
        <span className="text-[11px] text-muted-foreground">{formatRelativeTime(run.created_at)}</span>
      </div>
      <div className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">
        {run.execution_id.slice(0, 8)}…
      </div>
      <div className="mt-1.5 text-xs">
        {run.lead_id ? (
          <span className="text-foreground">
            Lead <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">{run.lead_id.slice(0, 8)}</code>
          </span>
        ) : (
          <span className="text-muted-foreground">No lead context</span>
        )}
      </div>
    </button>
  )
}

function RunDetail({ detail }: { detail: NonNullable<ReturnType<typeof useWorkflowRunDetail>['data']> }) {
  const { execution, steps } = detail
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Execution details</h3>
        <div className="mt-2 grid gap-1.5 text-xs">
          <DetailRow label="Execution ID" value={execution.execution_id} mono />
          <DetailRow label="Status" value={execution.status ?? '—'} />
          <DetailRow label="Channel" value={execution.channel ?? '—'} />
          <DetailRow label="Lead" value={execution.lead_id ?? '—'} mono />
          <DetailRow label="Started" value={formatAbsolute(execution.created_at)} />
          <DetailRow label="Completed" value={execution.completed_at ? formatAbsolute(execution.completed_at) : '—'} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">
          Steps {steps.length > 0 && <span className="text-muted-foreground">({steps.length})</span>}
        </h3>
        {steps.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No step logs yet.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {steps.map((step) => {
              const id = step.step_id ?? `${step.execution_id}-${step.node_id}-${step.started_at}`
              const isExpanded = expanded.has(id)
              const status = normaliseStatus(step.status, false)
              const StatusIcon = status.icon
              return (
                <div key={id} className="rounded-md border border-border bg-card">
                  <button
                    onClick={() => toggle(id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left"
                  >
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <Badge variant="outline" className={cn('gap-1 text-[10px]', status.color)}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {status.label}
                    </Badge>
                    <span className="flex-1 truncate text-sm font-medium">
                      {step.node_name ?? step.node_id ?? 'Step'}
                    </span>
                    {step.duration_ms != null && (
                      <span className="text-[10px] text-muted-foreground">{step.duration_ms}ms</span>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs">
                      <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Type</div>
                      <code className="block">{step.node_type ?? '—'}</code>
                      {step.input != null && (
                        <>
                          <div className="mb-1 mt-3 text-[10px] font-semibold uppercase text-muted-foreground">Input</div>
                          <pre className="overflow-x-auto rounded bg-card p-2 text-[10px]">
                            {safeJson(step.input)}
                          </pre>
                        </>
                      )}
                      {step.output != null && (
                        <>
                          <div className="mb-1 mt-3 text-[10px] font-semibold uppercase text-muted-foreground">Output</div>
                          <pre className="overflow-x-auto rounded bg-card p-2 text-[10px]">
                            {safeJson(step.output)}
                          </pre>
                        </>
                      )}
                      {step.error && (
                        <>
                          <div className="mb-1 mt-3 text-[10px] font-semibold uppercase text-red-700">Error</div>
                          <pre className="overflow-x-auto rounded bg-red-50 p-2 text-[10px] text-red-900">
                            {step.error}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-28 flex-shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn('min-w-0 flex-1 truncate', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  )
}

function normaliseStatus(raw: string | null | undefined, waiting: boolean | null | undefined) {
  const value = String(raw ?? '').toLowerCase()
  if (waiting) return { label: 'Waiting', icon: PauseCircle, color: 'text-amber-700' }
  if (value === 'completed' || value === 'done' || value === 'success') {
    return { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-700' }
  }
  if (value === 'failed' || value === 'error') {
    return { label: 'Failed', icon: XCircle, color: 'text-red-700' }
  }
  if (value === 'dropped' || value === 'timeout') {
    return { label: 'Dropped', icon: AlertCircle, color: 'text-slate-600' }
  }
  if (value === 'running' || value === 'in_progress') {
    return { label: 'Running', icon: Loader2, color: 'text-sky-700' }
  }
  return { label: raw ?? 'Unknown', icon: Clock, color: 'text-muted-foreground' }
}

function safeJson(value: any): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatRelativeTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return date.toLocaleDateString()
}

function formatAbsolute(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleString()
}
