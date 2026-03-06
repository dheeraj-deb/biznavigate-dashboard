'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  RefreshCw,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Copy,
  Send,
  Pencil,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  useWhatsAppTemplates,
  useTemplateStats,
  useDeleteTemplate,
  useDuplicateTemplate,
  useSyncTemplate,
  useSubmitTemplate,
  type TemplateStatus,
  type TemplateCategory,
} from '@/hooks/use-whatsapp-templates'

// ── Config ────────────────────────────────────────────────────────────────────

const statusConfig: Record<TemplateStatus, { label: string; color: string; icon: React.ElementType }> = {
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',   icon: CheckCircle2 },
  PENDING:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400', icon: Clock },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',           icon: XCircle },
  PAUSED:   { label: 'Paused',   color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',       icon: AlertCircle },
  DRAFT:    { label: 'Draft',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',       icon: FileText },
}

const categoryConfig: Record<TemplateCategory, { label: string; color: string }> = {
  MARKETING:      { label: 'Marketing',      color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
  UTILITY:        { label: 'Utility',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  AUTHENTICATION: { label: 'Authentication', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WhatsAppTemplatesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useWhatsAppTemplates({
    search: search || undefined,
    status: statusFilter as any,
    category: categoryFilter as any,
    page,
    limit,
  })

  const { data: stats } = useTemplateStats()

  const deleteMutation    = useDeleteTemplate()
  const duplicateMutation = useDuplicateTemplate()
  const syncMutation      = useSyncTemplate()
  const submitMutation    = useSubmitTemplate()

  const templates  = data?.data ?? []
  const total      = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1

  // Build summary from stats endpoint
  const statMap = Object.fromEntries((stats ?? []).map((s) => [s._id, s]))

  const summaryCards = [
    { label: 'Total',    value: (stats ?? []).reduce((s, x) => s + x.count, 0), icon: FileText,    color: 'text-gray-600' },
    { label: 'Approved', value: statMap['APPROVED']?.count ?? 0,                 icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Pending',  value: statMap['PENDING']?.count ?? 0,                  icon: Clock,        color: 'text-yellow-600' },
    { label: 'Rejected', value: statMap['REJECTED']?.count ?? 0,                 icon: XCircle,      color: 'text-red-600' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">WhatsApp Templates</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Create and manage Meta-approved message templates
            </p>
          </div>
          <Button onClick={() => router.push('/settings/whatsapp-templates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="MARKETING">Marketing</SelectItem>
              <SelectItem value="UTILITY">Utility</SelectItem>
              <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Delivery</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">No templates found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => router.push('/settings/whatsapp-templates/new')}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Create your first template
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => {
                  const status   = statusConfig[template.status]
                  const category = categoryConfig[template.category]
                  const StatusIcon = status.icon
                  const sent      = template.analytics?.sent ?? 0
                  const delivered = template.analytics?.delivered ?? 0
                  return (
                    <TableRow key={template._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm font-mono">
                            {template.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-[220px] truncate">
                            {template.components.body}
                          </p>
                          {template.status === 'REJECTED' && template.rejectionReason && (
                            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              {template.rejectionReason}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${category.color}`}>
                          {category.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                        {template.language}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700 dark:text-gray-300">
                        <span className="flex items-center justify-end gap-1">
                          <Send className="h-3.5 w-3.5 text-gray-400" />
                          {sent.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700 dark:text-gray-300">
                        {sent ? `${Math.round((delivered / sent) * 100)}%` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(template.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Edit — available for DRAFT or REJECTED */}
                            {(template.status === 'DRAFT' || template.status === 'REJECTED') && (
                              <DropdownMenuItem onClick={() => router.push(`/settings/whatsapp-templates/${template._id}/edit`)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            )}
                            {/* Submit — available for DRAFT or REJECTED */}
                            {(template.status === 'DRAFT' || template.status === 'REJECTED') && (
                              <DropdownMenuItem onClick={() => submitMutation.mutate(template._id)}>
                                <Send className="h-4 w-4 mr-2" /> Submit to Meta
                              </DropdownMenuItem>
                            )}
                            {/* Sync status from Meta */}
                            {(template.status === 'PENDING' || template.status === 'APPROVED') && (
                              <DropdownMenuItem onClick={() => syncMutation.mutate(template._id)}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Sync Status
                              </DropdownMenuItem>
                            )}
                            {/* Duplicate */}
                            <DropdownMenuItem onClick={() => duplicateMutation.mutate(template._id)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(template._id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
