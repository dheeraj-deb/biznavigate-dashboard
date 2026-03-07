'use client'

import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Pause,
  Play,
  RefreshCw,
  Rocket,
  Users,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { useGetCampaign, useLaunchCampaign, usePauseCampaign, useResumeCampaign, type CampaignStatus } from '@/hooks/use-campaigns'
import { formatDate } from '@/lib/utils'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// ── Status config ─────────────────────────────────────────────────────────────

const statusConfig: Record<CampaignStatus, { label: string; color: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',     dot: 'bg-gray-400' },
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',     dot: 'bg-blue-500' },
  RUNNING:   { label: 'Sending…',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400', dot: 'bg-yellow-500' },
  PAUSED:    { label: 'Paused',    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400', dot: 'bg-orange-500' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',  dot: 'bg-green-500' },
  FAILED:    { label: 'Failed',    color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',         dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',     dot: 'bg-gray-400' },
}

const VARIABLE_SOURCE_LABELS: Record<string, string> = {
  'contact.name':        'Contact Name',
  'contact.phone':       'Contact Phone',
  'system.current_date': 'Current Date',
  'system.current_time': 'Current Time',
}

const FIELD_LABELS: Record<string, string> = {
  engagement_score: 'Engagement Score',
  total_orders:     'Total Orders',
  total_spent:      'Total Spent',
  last_order_date:  'Last Order Date',
  name:             'Name',
  phone:            'Phone',
}

const OP_LABELS: Record<string, string> = {
  eq: '=', ne: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤', contains: 'contains',
}

function pct(a: number, b: number) {
  if (!b) return '—'
  return `${Math.round((a / b) * 100)}%`
}

// ── Analytics card ─────────────────────────────────────────────────────────────

function AnalyticsCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            {sub && <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const queryClient = useQueryClient()

  const { data: campaign, isLoading } = useGetCampaign(id)
  const launchMutation  = useLaunchCampaign()
  const pauseMutation   = usePauseCampaign()
  const resumeMutation  = useResumeCampaign()

  // Poll every 8s while RUNNING
  useEffect(() => {
    if (campaign?.status !== 'RUNNING') return
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    }, 8000)
    return () => clearInterval(interval)
  }, [campaign?.status, id, queryClient])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <AlertCircle className="h-8 w-8 text-gray-400" />
          <p className="text-gray-500">Campaign not found</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/crm/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const status = statusConfig[campaign.status] ?? statusConfig.DRAFT
  const analytics = campaign.analytics ?? { total: 0, pending: 0, sent: 0, failed: 0, delivery_rate: 0, read_rate: 0 }
  const canLaunch  = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED'
  const canPause   = campaign.status === 'RUNNING'
  const canResume  = campaign.status === 'PAUSED'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/crm/campaigns')} className="mt-0.5">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.name}</h1>
                <Badge className={`${status.color} flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </Badge>
                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {campaign.type === 'ONE_TIME' ? 'One-Time' : 'Recurring'}
                </Badge>
              </div>
              {campaign.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{campaign.description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['campaign', id] })}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {canLaunch && (
              <Button
                size="sm"
                onClick={() => launchMutation.mutate(campaign._id)}
                disabled={launchMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {launchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                Launch Campaign
              </Button>
            )}
            {canPause && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => pauseMutation.mutate(campaign._id)}
                disabled={pauseMutation.isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            {canResume && (
              <Button
                size="sm"
                onClick={() => resumeMutation.mutate(campaign._id)}
                disabled={resumeMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
          </div>
        </div>

        {/* Analytics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <AnalyticsCard label="Total"     value={analytics.total}     icon={Users}        color="bg-gray-500" />
          <AnalyticsCard label="Pending"   value={analytics.pending}   icon={Clock}        color="bg-gray-400" />
          <AnalyticsCard label="Sent"      value={analytics.sent}      icon={Mail}         color="bg-blue-500" />
          <AnalyticsCard label="Delivery %" value={analytics.delivery_rate} icon={CheckCircle2} color="bg-green-500" />
          <AnalyticsCard label="Read %"     value={analytics.read_rate}     icon={CheckCircle2} color="bg-emerald-600" />
          <AnalyticsCard label="Failed"    value={analytics.failed}    icon={XCircle}      color="bg-red-500" />
        </div>

        {/* Progress bar when running */}
        {campaign.status === 'RUNNING' && analytics.total > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Send Progress</span>
              <span>{analytics.sent + analytics.failed} / {analytics.total} processed</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${pct(analytics.sent + analytics.failed, analytics.total)}` }}
              />
            </div>
          </div>
        )}

        {/* Detail cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campaign Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Template ID</span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[55%]">
                  {campaign.templateId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Language</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 uppercase">
                  {campaign.templateLanguage}
                </span>
              </div>
              {campaign.schedule?.sendAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Send At</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {new Date(campaign.schedule.sendAt).toLocaleString()}
                  </span>
                </div>
              )}
              {campaign.schedule?.timezone && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Timezone</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {campaign.schedule.timezone}
                  </span>
                </div>
              )}
              {campaign.schedule?.cronExpression && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cron</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                    {campaign.schedule.cronExpression}
                  </span>
                </div>
              )}
              {campaign.schedule?.endsAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Ends At</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {new Date(campaign.schedule.endsAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Created</span>
                <span className="text-gray-600 dark:text-gray-400">{formatDate(campaign.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Variable Mappings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Variable Mappings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!campaign.variableMappings || campaign.variableMappings.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-xs">No variable mappings — template has no variables.</p>
              ) : (
                campaign.variableMappings.map((m) => (
                  <div key={m.variableIndex} className="flex justify-between items-center">
                    <span className="font-mono text-gray-600 dark:text-gray-400">{`{{${m.variableIndex + 1}}}`}</span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {VARIABLE_SOURCE_LABELS[m.source] ?? m.source}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Audience</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {campaign.explicitPhoneNumbers && campaign.explicitPhoneNumbers.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {campaign.explicitPhoneNumbers.length} specific phone number{campaign.explicitPhoneNumbers.length !== 1 ? 's' : ''}
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {campaign.explicitPhoneNumbers.map((p) => (
                    <p key={p} className="font-mono text-xs text-gray-600 dark:text-gray-400">{p}</p>
                  ))}
                </div>
              </div>
            ) : campaign.audienceFilter ? (
              <div className="space-y-2">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Filter — match <strong>{campaign.audienceFilter.operator}</strong> of:
                </p>
                {campaign.audienceFilter.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                      {FIELD_LABELS[c.field] ?? c.field}
                    </span>
                    <span className="font-mono text-gray-500">{OP_LABELS[c.operator] ?? c.operator}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{String(c.value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-xs">No audience configuration.</p>
            )}
          </CardContent>
        </Card>

        {/* Recipients note */}
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Per-recipient analytics coming soon
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Individual recipient status (PENDING → SENT → DELIVERED → READ) will be available
                once the <code className="font-mono">/campaigns/:id/analytics</code> endpoint is exposed.
                Delivered/Read status is updated asynchronously via WhatsApp webhooks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
