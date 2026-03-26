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
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil,
  Send,
  Globe,
  Copy,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  useWhatsAppFlows,
  useDeleteFlow,
  useSubmitFlow,
  usePublishFlow,
  useDeprecateFlow,
  useSyncFlow,
  useSyncFlowsFromMeta,
  type FlowStatus,
  type FlowCategory,
} from '@/hooks/use-whatsapp-flows'
import { toast } from 'sonner'

// ── Config ────────────────────────────────────────────────────────────────────

const statusConfig: Record<FlowStatus, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT:      { label: 'Draft',      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',       icon: Layers },
  PUBLISHED:  { label: 'Published',  color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',   icon: CheckCircle2 },
  DEPRECATED: { label: 'Deprecated', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400', icon: AlertCircle },
  BLOCKED:    { label: 'Blocked',    color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',           icon: XCircle },
}

const categoryLabels: Record<FlowCategory, string> = {
  SIGN_UP:            'Sign Up',
  SIGN_IN:            'Sign In',
  APPOINTMENT_BOOKING:'Appointment',
  LEAD_GENERATION:    'Lead Gen',
  CONTACT_US:         'Contact Us',
  CUSTOMER_SUPPORT:   'Support',
  SURVEY:             'Survey',
  OTHER:              'Other',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WhatsAppFlowsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useWhatsAppFlows({
    search: search || undefined,
    status: statusFilter as any,
    category: categoryFilter as any,
    page,
    limit,
  })

  const deleteMutation        = useDeleteFlow()
  const submitMutation        = useSubmitFlow()
  const publishMutation       = usePublishFlow()
  const deprecateMutation     = useDeprecateFlow()
  const syncMutation          = useSyncFlow()
  const syncFromMetaMutation  = useSyncFlowsFromMeta()

  const flows      = data?.data ?? []
  const total      = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1

  // Summary counts from current data (client-side — no stats endpoint for flows)
  const counts = flows.reduce(
    (acc, f) => { acc[f.status] = (acc[f.status] || 0) + 1; return acc },
    {} as Record<string, number>
  )

  const summaryCards = [
    { label: 'Total',      value: flows.length,          icon: Layers,       color: 'text-gray-600' },
    { label: 'Published',  value: counts['PUBLISHED'] ?? 0, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Draft',      value: counts['DRAFT'] ?? 0,     icon: Layers,       color: 'text-gray-500' },
    { label: 'Deprecated', value: counts['DEPRECATED'] ?? 0, icon: AlertCircle, color: 'text-orange-500' },
  ]

  const copyMetaId = (metaFlowId: string) => {
    navigator.clipboard.writeText(metaFlowId)
    toast.success('Meta Flow ID copied')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">WhatsApp Flows</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Build interactive forms and surveys sent via WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => syncFromMetaMutation.mutate()}
              disabled={syncFromMetaMutation.isPending}
            >
              {syncFromMetaMutation.isPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync from Meta
            </Button>
            <Button onClick={() => router.push('/settings/whatsapp-flows/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Flow
            </Button>
          </div>
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
              placeholder="Search flows..."
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
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DEPRECATED">Deprecated</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="SIGN_UP">Sign Up</SelectItem>
              <SelectItem value="SIGN_IN">Sign In</SelectItem>
              <SelectItem value="APPOINTMENT_BOOKING">Appointment Booking</SelectItem>
              <SelectItem value="LEAD_GENERATION">Lead Generation</SelectItem>
              <SelectItem value="CONTACT_US">Contact Us</SelectItem>
              <SelectItem value="CUSTOMER_SUPPORT">Customer Support</SelectItem>
              <SelectItem value="SURVEY">Survey</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flow Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meta Flow ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : flows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Layers className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">No flows found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => router.push('/settings/whatsapp-flows/new')}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Create your first flow
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                flows.map((flow) => {
                  const status = statusConfig[flow.status]
                  const StatusIcon = status.icon
                  return (
                    <TableRow
                      key={flow._id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/settings/whatsapp-flows/${flow._id}`)}
                    >
                      <TableCell>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {flow.name}
                        </p>
                        {flow.endpointUri && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate max-w-[200px]">
                            {flow.endpointUri}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                          {categoryLabels[flow.category] ?? flow.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {flow.metaFlowId ? (
                          <button
                            className="flex items-center gap-1.5 text-xs font-mono text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); copyMetaId(flow.metaFlowId!) }}
                          >
                            {flow.metaFlowId}
                            <Copy className="h-3 w-3 flex-shrink-0" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(flow.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Edit — DRAFT only (no metaFlowId means not submitted yet) */}
                            {flow.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => router.push(`/settings/whatsapp-flows/${flow._id}/edit`)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            )}
                            {/* Submit — DRAFT without metaFlowId */}
                            {flow.status === 'DRAFT' && !flow.metaFlowId && (
                              <DropdownMenuItem onClick={() => submitMutation.mutate(flow._id)}>
                                <Send className="h-4 w-4 mr-2" /> Submit to Meta
                              </DropdownMenuItem>
                            )}
                            {/* Publish — DRAFT with metaFlowId */}
                            {flow.status === 'DRAFT' && flow.metaFlowId && (
                              <DropdownMenuItem onClick={() => publishMutation.mutate(flow._id)}>
                                <Globe className="h-4 w-4 mr-2" /> Publish
                              </DropdownMenuItem>
                            )}
                            {/* Deprecate — PUBLISHED only */}
                            {flow.status === 'PUBLISHED' && (
                              <DropdownMenuItem onClick={() => deprecateMutation.mutate(flow._id)}>
                                <AlertCircle className="h-4 w-4 mr-2" /> Deprecate
                              </DropdownMenuItem>
                            )}
                            {/* Sync — DRAFT (with metaFlowId), PUBLISHED, BLOCKED */}
                            {(flow.status === 'PUBLISHED' || flow.status === 'BLOCKED' || (flow.status === 'DRAFT' && flow.metaFlowId)) && (
                              <DropdownMenuItem onClick={() => syncMutation.mutate(flow._id)}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Sync Status
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(flow._id)}
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
