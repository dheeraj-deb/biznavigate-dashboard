'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, DollarSign, Calendar, User, Loader2, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLeads, useLeadStats, useUpdateLeadStatus } from '@/hooks/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { CreateLeadModal } from '@/components/crm/create-lead-modal'
import { LeadDetailDialog } from '@/components/crm/lead-detail-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Mock data for testing
const mockLeads = [
  {
    lead_id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '9876543210',
    status: 'new',
    lead_quality: 'hot',
    source: 'instagram_comment',
    estimated_value: 50000,
    lead_score: 85,
    created_at: new Date().toISOString(),
  },
  {
    lead_id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    phone: '9876543211',
    status: 'contacted',
    lead_quality: 'warm',
    source: 'whatsapp',
    estimated_value: 35000,
    lead_score: 72,
    created_at: new Date().toISOString(),
  },
  {
    lead_id: '3',
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob@example.com',
    status: 'qualified',
    lead_quality: 'hot',
    source: 'website_form',
    estimated_value: 75000,
    lead_score: 90,
    created_at: new Date().toISOString(),
  },
]

const mockStats = {
  total_leads: 3,
  converted_leads: 0,
  conversion_rate: '0.0',
  avg_lead_score: 82.3,
}

// Status configuration matching backend
const statusColumns = [
  { status: 'new', label: 'New', color: 'bg-gray-50 dark:bg-gray-900', borderColor: 'border-gray-200 dark:border-gray-800', textColor: 'text-gray-700 dark:text-gray-300' },
  { status: 'contacted', label: 'Contacted', color: 'bg-blue-50 dark:bg-blue-950/30', borderColor: 'border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300' },
  { status: 'qualified', label: 'Qualified', color: 'bg-green-50 dark:bg-green-950/30', borderColor: 'border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300' },
  { status: 'proposal', label: 'Proposal', color: 'bg-yellow-50 dark:bg-yellow-950/30', borderColor: 'border-yellow-200 dark:border-yellow-800', textColor: 'text-yellow-700 dark:text-yellow-300' },
  { status: 'negotiation', label: 'Negotiation', color: 'bg-orange-50 dark:bg-orange-950/30', borderColor: 'border-orange-200 dark:border-orange-800', textColor: 'text-orange-700 dark:text-orange-300' },
]

// Helper to get initials from name
const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '?'
}

// Helper to get quality badge color
const getQualityColor = (quality?: string) => {
  switch (quality) {
    case 'hot':
      return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
    case 'warm':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
    case 'cold':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400'
  }
}

// Helper to get score bar color
const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function LeadsPage() {
  const { user: _user } = useAuthStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  // Fetch leads and stats from backend
  const { data: leadsResponse, isLoading, error } = useLeads()
  const { data: statsResponse } = useLeadStats()
  const updateLeadStatus = useUpdateLeadStatus()

  // Extract leads array from response - use mock data if API fails
  const leads = error
    ? mockLeads
    : (Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse?.data || []))

  // Use mock stats if API fails
  const stats = error ? mockStats : statsResponse

  // Handle drag and drop for status updates
  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (status: string) => {
    if (draggedLeadId) {
      updateLeadStatus.mutate({ id: draggedLeadId, status })
      setDraggedLeadId(null)
    }
  }

  // Handle lead card click
  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId(leadId)
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-muted-foreground">Loading leads...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Leads</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Track and manage your sales pipeline</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>

        {/* Error Alert (if API failed, showing mock data) */}
        {error && (
          <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to connect to backend API. Showing sample data for demo purposes.
              Please ensure backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Overview */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Total Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total_leads}</div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">All time leads</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Converted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.converted_leads}</div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Won deals</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.conversion_rate}%</div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Success rate</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Avg Lead Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.avg_lead_score.toFixed(1)}</div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Quality score</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {statusColumns.map((column) => {
              const columnLeads = leads.filter((lead: any) => lead.status === column.status)
              const totalValue = columnLeads.reduce((sum: number, lead: any) =>
                sum + (lead.estimated_value || 0), 0
              )

              return (
                <div
                  key={column.status}
                  className="w-80 flex-shrink-0"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.status)}
                >
                  <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                    <CardHeader className={`${column.color} border-b ${column.borderColor} rounded-t-lg`}>
                      <CardTitle className={`flex items-center justify-between text-base font-bold ${column.textColor}`}>
                        <span>{column.label}</span>
                        <span className="rounded-full bg-white/80 dark:bg-black/40 px-2.5 py-0.5 text-sm font-semibold">
                          {columnLeads.length}
                        </span>
                      </CardTitle>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {formatCurrency(totalValue)}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3">
                      {columnLeads.map((lead: any) => (
                        <Card
                          key={lead.lead_id}
                          className="cursor-pointer border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                          draggable
                          onDragStart={() => handleDragStart(lead.lead_id)}
                          onClick={() => handleLeadClick(lead.lead_id)}
                        >
                          <CardContent className="p-4">
                            {/* Header with Avatar and Name */}
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md flex-shrink-0">
                                {getInitials(lead.first_name, lead.last_name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {lead.first_name} {lead.last_name}
                                  </h4>
                                  {lead.lead_quality && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${getQualityColor(lead.lead_quality)}`}>
                                      {lead.lead_quality}
                                    </span>
                                  )}
                                </div>
                                {lead.email && (
                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {lead.email}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Lead Score Progress Bar */}
                            {lead.lead_score && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Lead Score</span>
                                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{lead.lead_score}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${getScoreColor(lead.lead_score)} transition-all`}
                                    style={{ width: `${lead.lead_score}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Value and Phone */}
                            <div className="mt-3 space-y-2">
                              {lead.estimated_value && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(lead.estimated_value)}
                                  </span>
                                </div>
                              )}

                              {lead.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <User className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{lead.phone}</span>
                                </div>
                              )}
                            </div>

                            {/* Footer: Source and Date */}
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
                              {lead.source && (
                                <span className="text-gray-500 dark:text-gray-400 capitalize truncate">
                                  {lead.source.replace('_', ' ')}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 flex-shrink-0">
                                <Calendar className="h-3 w-3" />
                                {formatDate(lead.created_at)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {columnLeads.length === 0 && (
                        <div className="rounded-lg border-2 border-dashed p-8 text-center">
                          <p className="text-sm text-muted-foreground">No leads</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Lead Detail Dialog */}
      {selectedLeadId && (
        <LeadDetailDialog
          leadId={selectedLeadId}
          isOpen={!!selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </DashboardLayout>
  )
}
