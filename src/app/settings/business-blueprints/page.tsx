'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Boxes,
  CalendarClock,
  Edit,
  Loader2,
  MessageSquareText,
  Network,
  PencilRuler,
  Workflow,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { PipelineSettingsDialog } from '@/components/crm/pipeline-settings-dialog'
import { usePipelines } from '@/hooks/use-pipelines'
import { useWorkflows } from '@/hooks/use-workflows'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

const groupLabels: Record<string, string> = {
  real_estate: 'Group A',
  used_cars: 'Group A',
  hospitality: 'Group B',
  events: 'Group B',
  products: 'Group C',
  retail: 'Group C',
  healthcare: 'Group D',
  professional_services: 'Group D',
  crm_automation: 'Group D',
  education: 'Group D',
}

function triggerLabel(type?: string | null) {
  switch (type) {
    case 'trigger.event.lead_status_changed':
      return 'Lead status change'
    case 'trigger.event.booking_created':
      return 'Booking created'
    case 'trigger.event.booking_cancelled':
      return 'Booking cancelled'
    case 'trigger.event.booking_link_sent':
      return 'Booking link sent'
    case 'trigger.event.room_available':
      return 'Room available'
    case 'trigger.event.booking_followup_due':
      return 'Booking follow-up due'
    case 'trigger.event.booking_checkin_reminder_due':
      return 'Check-in reminder due'
    case 'trigger.event.booking_review_request_due':
      return 'Review request due'
    case 'trigger.event.order_placed':
      return 'Order placed'
    case 'trigger.event.order_status_changed':
      return 'Order status change'
    case 'trigger.event.payment_received':
    case 'trigger.event.payment_captured':
      return 'Payment received'
    case 'trigger.event.payment_waiting':
      return 'Payment waiting'
    case 'trigger.event.inventory_price_changed':
      return 'Inventory price change'
    case 'trigger.event.inventory_item_added':
      return 'Inventory item added'
    case 'trigger.event.inventory_restocked':
      return 'Inventory restocked'
    case 'trigger.event.stock_held':
      return 'Stock held'
    case 'trigger.event.slot_opened':
      return 'Slot opened'
    case 'trigger.event.credit_due':
      return 'Credit due'
    case 'trigger.event.dead_stock_offer':
      return 'Dead-stock offer'
    case 'trigger.event.vehicle_details_shared':
      return 'Vehicle details shared'
    case 'trigger.event.vehicle_visit_slots_available':
      return 'Vehicle visit slots available'
    case 'trigger.schedule':
      return 'Schedule'
    case 'trigger.whatsapp':
      return 'WhatsApp message'
    case 'trigger.whatsapp.intent':
      return 'WhatsApp intent'
    default:
      return 'Workflow trigger'
  }
}

function firstTrigger(workflow: any) {
  const nodes = workflow.workflow_definitions?.nodes ?? workflow.workflow_definition?.nodes ?? []
  if (!Array.isArray(nodes)) return null
  return nodes.find((node: any) => typeof node?.type === 'string' && node.type.startsWith('trigger.'))
}

export default function BusinessBlueprintsPage() {
  const { user } = useAuthStore()
  const businessId = user?.business_id ?? ''
  const businessType = user?.business_type ?? ''
  const [pipelineOpen, setPipelineOpen] = useState(false)

  const pipelines = usePipelines()
  const workflows = useWorkflows(businessId)
  const queryClient = useQueryClient()
  const seedBlueprints = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/businesses/settings/blueprints/seed')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Business blueprints seeded')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Could not seed blueprints')
    },
  })
  const applyTemplateBlueprints = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/whatsapp/templates/apply-system-blueprints')
      return response.data
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-stats'] })
      const submitted = Number(result?.submitted ?? 0)
      const skipped = Number(result?.skipped ?? 0)
      toast.success(
        submitted
          ? `${submitted} WhatsApp templates submitted to Meta`
          : skipped
            ? 'Blueprint WhatsApp templates are already in sync'
            : 'Blueprint WhatsApp templates checked',
      )
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Could not apply WhatsApp template blueprints')
    },
  })

  const defaultPipeline = useMemo(
    () => pipelines.data?.find((pipeline) => pipeline.is_default) ?? pipelines.data?.[0],
    [pipelines.data],
  )
  const blueprintWorkflows = useMemo(
    () => (workflows.data ?? []).filter((workflow) => workflow.blueprint_key),
    [workflows.data],
  )
  const groupLabel = groupLabels[businessType] ?? 'Business group'
  const loading = pipelines.isLoading || workflows.isLoading

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Blueprints</h1>
            <p className="text-muted-foreground">
              Edit the pipeline and workflow automations seeded for this business type.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Boxes className="h-3.5 w-3.5" />
              {businessType || 'business'}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Network className="h-3.5 w-3.5" />
              {groupLabel}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={seedBlueprints.isPending}
              onClick={() => seedBlueprints.mutate()}
            >
              {seedBlueprints.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Seed blueprints
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={applyTemplateBlueprints.isPending}
              onClick={() => applyTemplateBlueprints.mutate()}
            >
              {applyTemplateBlueprints.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sync WhatsApp templates
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading blueprints...
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PencilRuler className="h-5 w-5" />
                  CRM Pipeline
                </CardTitle>
                <CardDescription>
                  Stages used by leads from this business blueprint.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {defaultPipeline ? (
                  <>
                    <div>
                      <div className="font-medium">{defaultPipeline.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {(defaultPipeline.stages ?? []).length} stages
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(defaultPipeline.stages ?? []).slice(0, 8).map((stage) => (
                        <Badge key={stage.stage_id} variant="outline">
                          {stage.name}
                        </Badge>
                      ))}
                    </div>
                    <Button onClick={() => setPipelineOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit pipeline
                    </Button>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No pipeline is available for this business yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Workflow Blueprints
                </CardTitle>
                <CardDescription>
                  Automations seeded for this buying pattern. Each opens in the workflow builder.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blueprintWorkflows.length ? (
                  <div className="space-y-3">
                    {blueprintWorkflows.map((workflow) => {
                      const trigger = firstTrigger(workflow)
                      return (
                        <div
                          key={workflow.workflow_id}
                          className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="font-medium">{workflow.workflow_name}</div>
                            {workflow.description && (
                              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {workflow.description}
                              </div>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5" />
                                {triggerLabel(trigger?.type)}
                              </Badge>
                              <Badge variant={workflow.is_active ? 'default' : 'outline'}>
                                {workflow.is_active ? 'Active' : 'Draft'}
                              </Badge>
                            </div>
                          </div>
                          <Button asChild variant="outline" className="shrink-0">
                            <Link href={`/automations/builder/${workflow.workflow_id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit blueprint
                            </Link>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No workflow blueprints are available yet. Complete onboarding with MongoDB connected to seed workflow blueprints.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5" />
                  WhatsApp Template Blueprints
                </CardTitle>
                <CardDescription>
                  Default Meta templates matched to this business type for campaign and reminder workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Workflow template nodes only send after Meta approval. Re-sync after connecting WhatsApp or changing business type.
                </div>
                <Button
                  variant="outline"
                  disabled={applyTemplateBlueprints.isPending}
                  onClick={() => applyTemplateBlueprints.mutate()}
                >
                  {applyTemplateBlueprints.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Apply templates
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <PipelineSettingsDialog
        open={pipelineOpen}
        onOpenChange={setPipelineOpen}
        initialPipelineId={defaultPipeline?.pipeline_id}
      />
    </DashboardLayout>
  )
}
