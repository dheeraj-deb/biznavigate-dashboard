'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  Loader2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Globe,
  Send,
  Trash2,
  Pencil,
  Copy,
  ChevronRight,
} from 'lucide-react'
import {
  useGetFlow,
  useSubmitFlow,
  usePublishFlow,
  useDeprecateFlow,
  useSyncFlow,
  useDeleteFlow,
  type FlowStatus,
  type FlowCategory,
} from '@/hooks/use-whatsapp-flows'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

// ── Config ────────────────────────────────────────────────────────────────────

const statusConfig: Record<FlowStatus, { label: string; color: string; dot: string }> = {
  DRAFT:      { label: 'Draft',      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',         dot: 'bg-gray-400' },
  PUBLISHED:  { label: 'Published',  color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',     dot: 'bg-green-500' },
  DEPRECATED: { label: 'Deprecated', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400', dot: 'bg-orange-500' },
  BLOCKED:    { label: 'Blocked',    color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',             dot: 'bg-red-500' },
}

const categoryLabels: Record<FlowCategory, string> = {
  SIGN_UP:            'Sign Up',
  SIGN_IN:            'Sign In',
  APPOINTMENT_BOOKING:'Appointment Booking',
  LEAD_GENERATION:    'Lead Generation',
  CONTACT_US:         'Contact Us',
  CUSTOMER_SUPPORT:   'Customer Support',
  SURVEY:             'Survey',
  OTHER:              'Other',
}

// ── Status lifecycle bar ──────────────────────────────────────────────────────

const LIFECYCLE_STEPS: { status: FlowStatus | 'DRAFT_SUBMITTED'; label: string }[] = [
  { status: 'DRAFT',           label: 'Draft' },
  { status: 'DRAFT_SUBMITTED', label: 'Submitted' },
  { status: 'PUBLISHED',       label: 'Published' },
  { status: 'DEPRECATED',      label: 'Deprecated' },
]

function LifecycleBar({ status, hasMetaId }: { status: FlowStatus; hasMetaId: boolean }) {
  const currentStep =
    status === 'DRAFT' && !hasMetaId ? 0
    : status === 'DRAFT' && hasMetaId ? 1
    : status === 'PUBLISHED' ? 2
    : status === 'DEPRECATED' ? 3
    : -1 // BLOCKED — off the normal path

  if (status === 'BLOCKED') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
        <XCircle className="h-4 w-4" />
        <span>Flow is blocked by Meta — sync to get details</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {LIFECYCLE_STEPS.map((step, i) => {
        const isPast    = i < currentStep
        const isCurrent = i === currentStep
        return (
          <div key={step.label} className="flex items-center gap-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isCurrent
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                  : isPast
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {isPast && <CheckCircle2 className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
              {step.label}
            </span>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FlowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState<'details' | 'json'>('details')

  const { data: flow, isLoading } = useGetFlow(id)

  const submitMutation    = useSubmitFlow()
  const publishMutation   = usePublishFlow()
  const deprecateMutation = useDeprecateFlow()
  const syncMutation      = useSyncFlow()
  const deleteMutation    = useDeleteFlow()

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!flow) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <AlertCircle className="h-8 w-8 text-gray-400" />
          <p className="text-gray-500">Flow not found</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/settings/whatsapp-flows')}>
            Back to Flows
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const status     = statusConfig[flow.status] ?? statusConfig.DRAFT
  const hasMetaId  = !!flow.metaFlowId
  const canEdit    = flow.status === 'DRAFT'
  const canSubmit  = flow.status === 'DRAFT' && !hasMetaId
  const canPublish = flow.status === 'DRAFT' && hasMetaId
  const canDeprecate = flow.status === 'PUBLISHED'
  const canSync    = hasMetaId && (flow.status === 'DRAFT' || flow.status === 'PUBLISHED' || flow.status === 'BLOCKED')
  const canDelete  = flow.status === 'DEPRECATED' || flow.status === 'BLOCKED' || flow.status === 'DRAFT'

  const copyMetaId = () => {
    if (!flow.metaFlowId) return
    navigator.clipboard.writeText(flow.metaFlowId)
    toast.success('Meta Flow ID copied')
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(flow._id)
    router.push('/settings/whatsapp-flows')
  }

  const isPending = submitMutation.isPending || publishMutation.isPending || deprecateMutation.isPending || syncMutation.isPending || deleteMutation.isPending

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings/whatsapp-flows')} className="mt-0.5">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{flow.name}</h1>
                <Badge className={`${status.color} flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </Badge>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                  {categoryLabels[flow.category] ?? flow.category}
                </span>
              </div>
              <div className="mt-2">
                <LifecycleBar status={flow.status} hasMetaId={hasMetaId} />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/settings/whatsapp-flows/${id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canSubmit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => submitMutation.mutate(flow._id)}
                disabled={isPending}
              >
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submit to Meta
              </Button>
            )}
            {canPublish && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => publishMutation.mutate(flow._id)}
                disabled={isPending}
              >
                {publishMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
                Publish
              </Button>
            )}
            {canDeprecate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => deprecateMutation.mutate(flow._id)}
                disabled={isPending}
              >
                {deprecateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                Deprecate
              </Button>
            )}
            {canSync && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncMutation.mutate(flow._id)}
                disabled={isPending}
              >
                {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={handleDelete}
                disabled={isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Meta Flow ID chip */}
        {flow.metaFlowId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Meta Flow ID</span>
            <button
              onClick={copyMetaId}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-mono text-gray-700 dark:text-gray-300"
            >
              {flow.metaFlowId}
              <Copy className="h-3 w-3 text-gray-400" />
            </button>
            <span className="text-xs text-gray-400">(use this ID in workflow nodes)</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {(['details', 'json'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'json' ? 'Flow JSON' : 'Details'}
            </button>
          ))}
        </div>

        {/* Tab: Details */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Flow Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Name</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{flow.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Category</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {categoryLabels[flow.category] ?? flow.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                {flow.endpointUri && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Endpoint URI</span>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">{flow.endpointUri}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Created</span>
                  <span className="text-gray-600 dark:text-gray-400">{formatDate(flow.createdAt)}</span>
                </div>
                {flow.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Updated</span>
                    <span className="text-gray-600 dark:text-gray-400">{formatDate(flow.updatedAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next steps card */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                {flow.status === 'DRAFT' && !hasMetaId && (
                  <>
                    <p>1. Review your Flow JSON above.</p>
                    <p>2. Click <strong>Submit to Meta</strong> — Meta validates the JSON and registers the flow.</p>
                    <p>3. Once submitted, click <strong>Publish</strong> to make it live.</p>
                  </>
                )}
                {flow.status === 'DRAFT' && hasMetaId && (
                  <>
                    <p>Flow is submitted to Meta.</p>
                    <p>Click <strong>Publish</strong> to make it live and ready to use in workflows.</p>
                  </>
                )}
                {flow.status === 'PUBLISHED' && (
                  <>
                    <p>Flow is live. Use the <strong>Meta Flow ID</strong> above in your workflow &quot;Send Flow&quot; nodes.</p>
                    <p>Click <strong>Deprecate</strong> when you no longer want to send this flow.</p>
                  </>
                )}
                {flow.status === 'DEPRECATED' && (
                  <p>This flow is deprecated and can no longer be sent. You can safely delete it.</p>
                )}
                {flow.status === 'BLOCKED' && (
                  <p>This flow is blocked by Meta. Click <strong>Sync</strong> to get the latest status and reason.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Flow JSON */}
        {activeTab === 'json' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Flow JSON (read-only)</CardTitle>
            </CardHeader>
            <CardContent>
              {flow.flowJson ? (
                <pre className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 font-mono text-xs text-gray-900 dark:text-gray-100 overflow-auto max-h-[600px]">
                  {JSON.stringify(flow.flowJson, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-gray-400">No Flow JSON stored locally.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
