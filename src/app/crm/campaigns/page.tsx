'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Pause,
  Play,
  Trash2,
  Eye,
  Loader2,
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  useCampaigns,
  useDeleteCampaign,
  usePauseCampaign,
  useResumeCampaign,
  type CampaignStatus,
  type CampaignType,
} from '@/hooks/use-campaigns'

// ── Status config ─────────────────────────────────────────────────────────────

const statusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  active:    { label: 'Active',    color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
  paused:    { label: 'Paused',    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' },
}

const typeConfig: Record<CampaignType, { label: string; color: string }> = {
  promotional:   { label: 'Promotional',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
  transactional: { label: 'Transactional', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400' },
  announcement:  { label: 'Announcement',  color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' },
  reminder:      { label: 'Reminder',      color: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400' },
}

function readRate(delivered: number, read: number) {
  if (!delivered) return '—'
  return `${Math.round((read / delivered) * 100)}%`
}

function deliveryRate(sent: number, delivered: number) {
  if (!sent) return '—'
  return `${Math.round((delivered / sent) * 100)}%`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useCampaigns({
    search: search || undefined,
    status: statusFilter as any,
    campaign_type: typeFilter as any,
    page,
    limit,
  })

  const deleteMutation = useDeleteCampaign()
  const pauseMutation = usePauseCampaign()
  const resumeMutation = useResumeCampaign()

  const campaigns = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  // Summary counts from current data
  const counts = campaigns.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const summaryCards = [
    { label: 'Total', value: total, icon: MessageSquare, color: 'text-gray-600' },
    { label: 'Active', value: counts.active ?? 0, icon: Play, color: 'text-green-600' },
    { label: 'Scheduled', value: counts.scheduled ?? 0, icon: Clock, color: 'text-blue-600' },
    { label: 'Completed', value: counts.completed ?? 0, icon: CheckCircle2, color: 'text-purple-600' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campaigns</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage and monitor your WhatsApp & SMS campaigns
            </p>
          </div>
          <Button onClick={() => router.push('/crm/campaigns/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
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
              placeholder="Search campaigns..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Delivery</TableHead>
                <TableHead className="text-right">Read Rate</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Send className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">No campaigns found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => {
                  const status = statusConfig[campaign.status]
                  const type = typeConfig[campaign.campaign_type]
                  return (
                    <TableRow key={campaign.campaign_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {campaign.campaign_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {campaign.channel}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${type.color}`}>{type.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className="flex items-center justify-end gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {campaign.total_recipients.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700 dark:text-gray-300">
                        {campaign.sent_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700 dark:text-gray-300">
                        {deliveryRate(campaign.sent_count, campaign.delivered_count)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700 dark:text-gray-300">
                        {readRate(campaign.delivered_count, campaign.read_count)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {campaign.scheduled_at ? formatDate(campaign.scheduled_at) : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/crm/campaigns/${campaign.campaign_id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            {campaign.status === 'active' && (
                              <DropdownMenuItem onClick={() => pauseMutation.mutate(campaign.campaign_id)}>
                                <Pause className="h-4 w-4 mr-2" /> Pause
                              </DropdownMenuItem>
                            )}
                            {campaign.status === 'paused' && (
                              <DropdownMenuItem onClick={() => resumeMutation.mutate(campaign.campaign_id)}>
                                <Play className="h-4 w-4 mr-2" /> Resume
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(campaign.campaign_id)}
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
            <p>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
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
