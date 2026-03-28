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
  Edit,
  MoreVertical,
  Zap,
  CheckCircle2,
  FileText,
  Sparkles,
  Loader2,
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
import { useAuthStore } from '@/store/auth-store'
import { useWorkflows } from '@/hooks/use-workflows'

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    icon: Play,
  },
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: FileText,
  },
}

export default function AutomationsPage() {
  const { user } = useAuthStore()
  const businessId = user?.business_id ?? ''

  const { data: workflows = [], isLoading, isError } = useWorkflows(businessId)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all')

  const filteredWorkflows = workflows.filter((w) => {
    if (filter === 'all') return true
    if (filter === 'active') return w.is_active
    return !w.is_active
  })

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.is_active).length,
  }

  console.log("workflowa", workflows)

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
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Workflows
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {isLoading ? '—' : stats.total}
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
                    {isLoading ? '—' : stats.active}
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
            Active ({workflows.filter((w) => w.is_active).length})
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('draft')}
          >
            Draft ({workflows.filter((w) => !w.is_active).length})
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading workflows…
          </div>
        )}

        {/* Error */}
        {isError && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="flex items-center gap-3 py-6 text-red-600 dark:text-red-400">
              <Zap className="h-5 w-5 flex-shrink-0" />
              Failed to load workflows. Please try again.
            </CardContent>
          </Card>
        )}

        {/* Workflows List */}
        {!isLoading && !isError && (
          filteredWorkflows.length === 0 ? (
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
                const status = workflow.is_active ? 'active' : 'draft'
                const statusCfg = statusConfig[status]
                const StatusIcon = statusCfg.icon

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
                              {workflow.workflow_name ?? workflow.workflow_definitions?.workflow_name}
                            </Link>
                            <Badge className={cn('text-xs', statusCfg.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusCfg.label}
                            </Badge>
                          </div>

                          {(workflow.description ?? workflow.workflow_definitions?.description) && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {workflow.description ?? workflow.workflow_definitions?.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {workflow.intent_name}
                            </Badge>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Created {new Date(workflow.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
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
                              <DropdownMenuItem>
                                {workflow.is_active ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 dark:text-red-400">
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
          )
        )}
      </div>

      <CreateWorkflowDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </DashboardLayout>
  )
}
