'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, DollarSign, Calendar, User } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LeadStatus } from '@/types'

const mockLeads = [
  {
    id: '1',
    title: 'Enterprise Software Deal',
    contactName: 'John Doe - Acme Corp',
    status: LeadStatus.NEW,
    value: 50000,
    probability: 20,
    expectedCloseDate: '2024-04-15',
  },
  {
    id: '2',
    title: 'Cloud Migration Project',
    contactName: 'Jane Smith - Tech Solutions',
    status: LeadStatus.CONTACTED,
    value: 35000,
    probability: 40,
    expectedCloseDate: '2024-04-20',
  },
  {
    id: '3',
    title: 'CRM Implementation',
    contactName: 'Bob Johnson - StartupX',
    status: LeadStatus.QUALIFIED,
    value: 25000,
    probability: 60,
    expectedCloseDate: '2024-04-10',
  },
  {
    id: '4',
    title: 'Data Analytics Platform',
    contactName: 'Alice Brown - DataCorp',
    status: LeadStatus.PROPOSAL,
    value: 75000,
    probability: 70,
    expectedCloseDate: '2024-04-25',
  },
  {
    id: '5',
    title: 'Mobile App Development',
    contactName: 'Charlie Davis - AppWorks',
    status: LeadStatus.NEGOTIATION,
    value: 45000,
    probability: 85,
    expectedCloseDate: '2024-04-05',
  },
]

const statusColumns = [
  { status: LeadStatus.NEW, label: 'New', color: 'bg-gray-100 dark:bg-gray-800' },
  { status: LeadStatus.CONTACTED, label: 'Contacted', color: 'bg-blue-100 dark:bg-blue-950' },
  { status: LeadStatus.QUALIFIED, label: 'Qualified', color: 'bg-purple-100 dark:bg-purple-950' },
  { status: LeadStatus.PROPOSAL, label: 'Proposal', color: 'bg-yellow-100 dark:bg-yellow-950' },
  { status: LeadStatus.NEGOTIATION, label: 'Negotiation', color: 'bg-orange-100 dark:bg-orange-950' },
]

export default function LeadsPage() {
  const [leads] = useState(mockLeads)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">Track and manage your sales pipeline</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {statusColumns.map((column) => {
              const columnLeads = leads.filter((lead) => lead.status === column.status)
              const totalValue = columnLeads.reduce((sum, lead) => sum + lead.value, 0)

              return (
                <div key={column.status} className="w-80 flex-shrink-0">
                  <Card>
                    <CardHeader className={`${column.color} rounded-t-lg`}>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{column.label}</span>
                        <span className="rounded-full bg-white/50 px-2 py-0.5 text-sm dark:bg-black/20">
                          {columnLeads.length}
                        </span>
                      </CardTitle>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatCurrency(totalValue)}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3">
                      {columnLeads.map((lead) => (
                        <Card key={lead.id} className="cursor-pointer hover:shadow-md">
                          <CardContent className="p-4">
                            <h4 className="font-semibold">{lead.title}</h4>
                            <p className="mt-1 flex items-center text-sm text-muted-foreground">
                              <User className="mr-1 h-3 w-3" />
                              {lead.contactName}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="flex items-center text-sm font-medium">
                                <DollarSign className="mr-1 h-4 w-4 text-green-600" />
                                {formatCurrency(lead.value)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {lead.probability}%
                              </span>
                            </div>
                            <p className="mt-2 flex items-center text-xs text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              Close: {formatDate(lead.expectedCloseDate)}
                            </p>
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
    </DashboardLayout>
  )
}
