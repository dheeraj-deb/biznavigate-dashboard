'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Copy,
  Edit,
  MoreVertical,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateWorkflowDialog } from '@/components/workflows/create-workflow-dialog'

// Mock data
const mockWorkflows = [
  {
    workflow_id: '1',
    name: 'Instagram Lead Follow-up',
    description: 'Automatically send WhatsApp message to new Instagram leads and create follow-up tasks',
    status: 'active' as const,
    trigger_type: 'lead_created',
    stats: {
      total_runs: 127,
      successful: 121,
      failed: 6,
      avg_duration_ms: 3200,
    },
    last_run_at: '2025-12-07T10:30:00Z',
    created_at: '2025-12-01T08:00:00Z',
  },
  {
    workflow_id: '2',
    name: 'Order Follow-up Sequence',
    description: 'Send review request 3 days after order delivery, tag happy customers',
    status: 'active' as const,
    trigger_type: 'order_delivered',
    stats: {
      total_runs: 45,
      successful: 45,
      failed: 0,
      avg_duration_ms: 2800,
    },
    last_run_at: '2025-12-07T09:15:00Z',
    created_at: '2025-11-28T14:30:00Z',
  },
  {
    workflow_id: '3',
    name: 'Inactive Customer Re-engagement',
    description: 'Send discount code to customers who haven\'t ordered in 60 days',
    status: 'paused' as const,
    trigger_type: 'scheduled_time',
    stats: {
      total_runs: 12,
      successful: 10,
      failed: 2,
      avg_duration_ms: 8500,
    },
    last_run_at: '2025-12-05T10:00:00Z',
    created_at: '2025-11-20T16:00:00Z',
  },
  {
    workflow_id: '4',
    name: 'New Lead Welcome Sequence',
    description: 'Send welcome message, wait 2 hours, then assign to sales if no reply',
    status: 'draft' as const,
    trigger_type: 'lead_created',
    stats: {
      total_runs: 0,
      successful: 0,
      failed: 0,
      avg_duration_ms: 0,
    },
    last_run_at: null,
    created_at: '2025-12-06T18:00:00Z',
  },
]

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    icon: Play,
  },
  paused: {
    label: 'Paused',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
    icon: Pause,
  },
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: FileText,
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500',
    icon: Trash2,
  },
}

const triggerTypeLabels = {
  lead_created: 'New Lead',
  lead_status_changed: 'Lead Status Changed',
  lead_tagged: 'Lead Tagged',
  order_placed: 'Order Placed',
  order_delivered: 'Order Delivered',
  scheduled_time: 'Scheduled',
  whatsapp_message_received: 'WhatsApp Message',
  instagram_comment: 'Instagram Comment',
  manual: 'Manual',
}

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState(mockWorkflows)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all')

  const filteredWorkflows = workflows.filter((w) => {
    if (filter === 'all') return true
    return w.status === filter
  })

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === 'active').length,
    total_runs: workflows.reduce((sum, w) => sum + w.stats.total_runs, 0),
    success_rate:
      workflows.reduce((sum, w) => sum + w.stats.successful, 0) /
      Math.max(workflows.reduce((sum, w) => sum + w.stats.total_runs, 0), 1),
  }

  const handleToggleStatus = (workflowId: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.workflow_id === workflowId
          ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
          : w
      )
    )
  }

  const handleDelete = (workflowId: string) => {
    setWorkflows(workflows.filter((w) => w.workflow_id !== workflowId))
  }

  const handleDuplicate = (workflowId: string) => {
    const workflow = workflows.find((w) => w.workflow_id === workflowId)
    if (workflow) {
      const newWorkflow = {
        ...workflow,
        workflow_id: String(Date.now()),
        name: `${workflow.name} (Copy)`,
        status: 'draft' as const,
        stats: {
          total_runs: 0,
          successful: 0,
          failed: 0,
          avg_duration_ms: 0,
        },
        last_run_at: null,
        created_at: new Date().toISOString(),
      }
      setWorkflows([...workflows, newWorkflow])
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Automations
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Create intelligent workflows with AI in seconds
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Create Automation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Workflows
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.total}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.active}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Runs
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.total_runs}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Success Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(stats.success_rate * 100)}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({workflows.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active ({workflows.filter((w) => w.status === 'active').length})
          </Button>
          <Button
            variant={filter === 'paused' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('paused')}
          >
            Paused ({workflows.filter((w) => w.status === 'paused').length})
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('draft')}
          >
            Draft ({workflows.filter((w) => w.status === 'draft').length})
          </Button>
        </div>

        {/* Workflows List */}
        {filteredWorkflows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No workflows found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
                {filter === 'all'
                  ? 'Get started by creating your first automation workflow with AI'
                  : `No ${filter} workflows found`}
              </p>
              {filter === 'all' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Workflow
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredWorkflows.map((workflow) => {
              const statusCfg = statusConfig[workflow.status]
              const StatusIcon = statusCfg.icon
              const successRate =
                workflow.stats.total_runs > 0
                  ? (workflow.stats.successful / workflow.stats.total_runs) * 100
                  : 0

              return (
                <Card
                  key={workflow.workflow_id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/automations/builder/${workflow.workflow_id}`}
                            className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {workflow.name}
                          </Link>
                          <Badge className={cn('text-xs', statusCfg.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {workflow.description}
                        </p>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {triggerTypeLabels[workflow.trigger_type as keyof typeof triggerTypeLabels]}
                            </Badge>
                          </div>

                          {workflow.stats.total_runs > 0 && (
                            <>
                              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <TrendingUp className="h-4 w-4" />
                                <span>{workflow.stats.total_runs} runs</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>{Math.round(successRate)}% success</span>
                              </div>

                              {workflow.stats.failed > 0 && (
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span>{workflow.stats.failed} failed</span>
                                </div>
                              )}
                            </>
                          )}

                          {workflow.last_run_at && (
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>
                                Last run{' '}
                                {new Date(workflow.last_run_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {workflow.status !== 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(workflow.workflow_id)}
                          >
                            {workflow.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-1.5" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1.5" />
                                Activate
                              </>
                            )}
                          </Button>
                        )}

                        <Link href={`/automations/builder/${workflow.workflow_id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit
                          </Button>
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(workflow.workflow_id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/automations/${workflow.workflow_id}/runs`}>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View Runs
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(workflow.workflow_id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Workflow Dialog */}
      <CreateWorkflowDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </DashboardLayout>
  )
}
