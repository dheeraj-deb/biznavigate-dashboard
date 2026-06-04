'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBusinessType } from '@/hooks/use-business-type'
import {
  StarterTemplate,
  useApplyRecommendedStarterTemplates,
  useApplyStarterTemplate,
  useStarterTemplates,
} from '@/hooks/use-starter-templates'
import { cn } from '@/lib/utils'
import {
  Bell,
  CheckCircle2,
  GitBranch,
  Loader2,
  PackageCheck,
  RefreshCw,
  Workflow,
} from 'lucide-react'

const kindMeta = {
  pipeline: {
    label: 'Pipeline',
    icon: GitBranch,
    className: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  notification_template: {
    label: 'Message template',
    icon: Bell,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  workflow: {
    label: 'Workflow',
    icon: Workflow,
    className: 'bg-violet-50 text-violet-700 border-violet-100',
  },
}

function templateSummary(template: StarterTemplate) {
  if (template.kind === 'pipeline') {
    const stageCount = Array.isArray(template.payload?.stages) ? template.payload.stages.length : 0
    return `${template.payload?.pipeline_name ?? template.name}${stageCount ? `, ${stageCount} stages` : ''}`
  }

  if (template.kind === 'notification_template') {
    const channels = Array.isArray(template.payload?.enabled_channels)
      ? template.payload.enabled_channels.join(', ')
      : 'channels'
    return `Creates ${template.payload?.template_name ?? template.name} for ${channels}`
  }

  return template.payload?.workflow_name ?? template.description ?? template.name
}

export default function StarterTemplatesSettingsPage() {
  const { businessType, isLoading: isBusinessTypeLoading } = useBusinessType()
  const { data: templates = [], isLoading, error } = useStarterTemplates(
    businessType ? { business_type: businessType } : undefined,
  )
  const applyTemplate = useApplyStarterTemplate()
  const applyRecommended = useApplyRecommendedStarterTemplates()

  const isBusy = applyTemplate.isPending || applyRecommended.isPending

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Starter Templates</h1>
            <p className="text-sm text-muted-foreground">
              Apply ready-made pipelines, message templates, and automation drafts for your workspace.
            </p>
          </div>
          <Button
            onClick={() => applyRecommended.mutate({})}
            disabled={isBusy}
            className="bg-[#0066FF] text-white hover:bg-[#0052CC]"
          >
            {applyRecommended.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Apply Recommended
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600">Business Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize text-slate-950">{businessType.replaceAll('_', ' ')}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">{templates.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600">Included Types</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {new Set(templates.map((template) => template.kind)).size || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {(isLoading || isBusinessTypeLoading) && (
          <Card className="border-slate-200">
            <CardContent className="flex h-48 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading templates...
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 text-sm font-medium text-red-700">
              Starter templates could not be loaded.
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <div className="grid gap-4 lg:grid-cols-2">
            {templates.map((template) => {
              const meta = kindMeta[template.kind]
              const Icon = meta.icon
              const isApplyingThis = applyTemplate.isPending && applyTemplate.variables?.template_key === template.key

              return (
                <Card key={template.key} className="border-slate-200">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F5F8FF] text-[#0066FF]">
                          <PackageCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-slate-950">{template.name}</CardTitle>
                          <CardDescription className="mt-1">{template.description ?? templateSummary(template)}</CardDescription>
                        </div>
                      </div>
                      <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold', meta.className)}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {templateSummary(template)}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        Version {template.version}
                        {template.business_type ? ` · ${template.business_type.replaceAll('_', ' ')}` : ''}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => applyTemplate.mutate({ template_key: template.key })}
                      >
                        {isApplyingThis ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {!isLoading && !error && templates.length === 0 && (
          <Card className="border-slate-200">
            <CardContent className="py-10 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">No templates found</p>
              <p className="mt-1 text-sm text-muted-foreground">Seed starter templates on the backend, then refresh this page.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
