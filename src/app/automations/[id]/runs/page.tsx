'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Play,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const mockWorkflow = {
  workflow_id: '1',
  name: 'Instagram Lead Follow-up',
  status: 'active',
}

const mockInstances = [
  {
    instance_id: '1',
    status: 'completed',
    trigger_data: {
      lead_id: 'lead-123',
      lead_name: 'John Doe',
      lead_phone: '+91 98765 43210',
      source: 'instagram',
    },
    started_at: '2025-12-07T10:30:00Z',
    completed_at: '2025-12-07T12:32:15Z',
    duration_ms: 7335000,
    logs: [
      {
        log_id: '1',
        node_id: 'trigger-1',
        node_name: 'New Lead from Instagram',
        node_type: 'trigger',
        status: 'completed',
        executed_at: '2025-12-07T10:30:00Z',
        duration_ms: 50,
      },
      {
        log_id: '2',
        node_id: 'action-1',
        node_name: 'Send WhatsApp Message',
        node_type: 'action',
        status: 'completed',
        executed_at: '2025-12-07T10:30:01Z',
        duration_ms: 1200,
        output_data: { message_id: 'wamid.123456', status: 'sent' },
      },
      {
        log_id: '3',
        node_id: 'wait-1',
        node_name: 'Wait 2 Hours',
        node_type: 'wait',
        status: 'completed',
        executed_at: '2025-12-07T10:30:02Z',
        duration_ms: 7200000,
      },
      {
        log_id: '4',
        node_id: 'condition-1',
        node_name: 'Did they reply?',
        node_type: 'condition',
        status: 'completed',
        executed_at: '2025-12-07T12:30:02Z',
        duration_ms: 100,
        output_data: { result: false, branch: 'no' },
      },
      {
        log_id: '5',
        node_id: 'action-2',
        node_name: 'Assign to Sales Team',
        node_type: 'action',
        status: 'completed',
        executed_at: '2025-12-07T12:30:03Z',
        duration_ms: 800,
      },
      {
        log_id: '6',
        node_id: 'action-3',
        node_name: 'Create Follow-up Task',
        node_type: 'action',
        status: 'completed',
        executed_at: '2025-12-07T12:30:04Z',
        duration_ms: 1100,
      },
    ],
  },
  {
    instance_id: '2',
    status: 'failed',
    trigger_data: {
      lead_id: 'lead-124',
      lead_name: 'Sarah Smith',
      lead_phone: '+91 98765 11111',
      source: 'instagram',
    },
    started_at: '2025-12-07T09:15:00Z',
    completed_at: '2025-12-07T09:15:05Z',
    duration_ms: 5000,
    error_message: 'Failed to send WhatsApp message: Invalid phone number',
    error_node_id: 'action-1',
    logs: [
      {
        log_id: '7',
        node_id: 'trigger-1',
        node_name: 'New Lead from Instagram',
        node_type: 'trigger',
        status: 'completed',
        executed_at: '2025-12-07T09:15:00Z',
        duration_ms: 45,
      },
      {
        log_id: '8',
        node_id: 'action-1',
        node_name: 'Send WhatsApp Message',
        node_type: 'action',
        status: 'failed',
        executed_at: '2025-12-07T09:15:01Z',
        duration_ms: 3000,
        error: 'Invalid phone number format',
      },
    ],
  },
  {
    instance_id: '3',
    status: 'running',
    trigger_data: {
      lead_id: 'lead-125',
      lead_name: 'Mike Johnson',
      lead_phone: '+91 98765 22222',
      source: 'instagram',
    },
    started_at: '2025-12-07T11:00:00Z',
    completed_at: null,
    duration_ms: null,
    current_node_id: 'wait-1',
    logs: [
      {
        log_id: '9',
        node_id: 'trigger-1',
        node_name: 'New Lead from Instagram',
        node_type: 'trigger',
        status: 'completed',
        executed_at: '2025-12-07T11:00:00Z',
        duration_ms: 40,
      },
      {
        log_id: '10',
        node_id: 'action-1',
        node_name: 'Send WhatsApp Message',
        node_type: 'action',
        status: 'completed',
        executed_at: '2025-12-07T11:00:01Z',
        duration_ms: 1150,
      },
      {
        log_id: '11',
        node_id: 'wait-1',
        node_name: 'Wait 2 Hours',
        node_type: 'wait',
        status: 'started',
        executed_at: '2025-12-07T11:00:02Z',
        duration_ms: null,
      },
    ],
  },
]

const statusConfig = {
  running: {
    label: 'Running',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    icon: Loader2,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: XCircle,
  },
  waiting: {
    label: 'Waiting',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
    icon: Clock,
  },
}

const nodeStatusConfig = {
  started: {
    label: 'Started',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    icon: Play,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    icon: XCircle,
  },
  skipped: {
    label: 'Skipped',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: ChevronRight,
  },
}

export default function WorkflowRunsPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string

  const [expandedInstances, setExpandedInstances] = useState<string[]>([])

  const toggleInstance = (instanceId: string) => {
    setExpandedInstances((prev) =>
      prev.includes(instanceId)
        ? prev.filter((id) => id !== instanceId)
        : [...prev, instanceId]
    )
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/automations')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {mockWorkflow.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Activity Log & Execution History
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Runs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {mockInstances.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {mockInstances.filter((i) => i.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Running</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {mockInstances.filter((i) => i.status === 'running').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {mockInstances.filter((i) => i.status === 'failed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Instances List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Runs
          </h2>

          {mockInstances.map((instance) => {
            const statusCfg = statusConfig[instance.status as keyof typeof statusConfig]
            const StatusIcon = statusCfg.icon
            const isExpanded = expandedInstances.includes(instance.instance_id)

            return (
              <Card key={instance.instance_id}>
                <CardContent className="pt-6">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleInstance(instance.instance_id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={cn('text-xs', statusCfg.color)}>
                          <StatusIcon
                            className={cn(
                              'h-3 w-3 mr-1',
                              instance.status === 'running' && 'animate-spin'
                            )}
                          />
                          {statusCfg.label}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {instance.trigger_data.lead_name}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {instance.trigger_data.lead_phone}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          <Clock className="h-3 w-3 inline mr-1" />
                          Started {formatDateTime(instance.started_at)}
                        </span>
                        {instance.duration_ms && (
                          <span>Duration: {formatDuration(instance.duration_ms)}</span>
                        )}
                        {instance.current_node_id && (
                          <span className="text-blue-600 dark:text-blue-400">
                            Currently at: {instance.logs.find(l => l.node_id === instance.current_node_id)?.node_name}
                          </span>
                        )}
                      </div>

                      {instance.error_message && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{instance.error_message}</span>
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Execution Logs */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Execution Steps
                      </h4>
                      <div className="space-y-2">
                        {instance.logs.map((log, index) => {
                          const nodeCfg = nodeStatusConfig[log.status as keyof typeof nodeStatusConfig]
                          const NodeIcon = nodeCfg.icon

                          return (
                            <div
                              key={log.log_id}
                              className="flex items-start gap-3 p-3 rounded bg-gray-50 dark:bg-gray-900"
                            >
                              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-800 flex-shrink-0">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                  {index + 1}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {log.node_name}
                                  </span>
                                  <Badge className={cn('text-xs', nodeCfg.color)}>
                                    <NodeIcon className="h-3 w-3 mr-1" />
                                    {nodeCfg.label}
                                  </Badge>
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    {log.node_type}
                                  </span>
                                </div>

                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <p>Executed at: {formatDateTime(log.executed_at)}</p>
                                  {log.duration_ms !== null && (
                                    <p>Duration: {formatDuration(log.duration_ms)}</p>
                                  )}
                                  {'output_data' in log && log.output_data && (
                                    <details className="mt-2">
                                      <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                                        View output data
                                      </summary>
                                      <pre className="mt-1 p-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(log.output_data, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                  {'error' in log && log.error && (
                                    <p className="text-red-600 dark:text-red-400">
                                      Error: {log.error}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
