'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lead, LeadStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Users, Instagram, MessageCircle, Globe, User } from 'lucide-react'
import Link from 'next/link'

interface RecentLeadsProps {
  leads: Lead[]
  maxItems?: number
}

export function RecentLeads({ leads, maxItems = 5 }: RecentLeadsProps) {
  const displayedLeads = leads.slice(0, maxItems)

  const getStatusVariant = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'converted' || s === 'won') return 'default'
    if (s === 'interested' || s === 'qualified' || s === 'proposal') return 'secondary'
    if (s === 'contacted' || s === 'negotiation') return 'outline'
    if (s === 'new') return 'secondary'
    if (s === 'lost') return 'destructive'
    return 'outline'
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'converted' || s === 'won') return 'text-green-600'
    if (s === 'interested' || s === 'qualified' || s === 'proposal') return 'text-blue-600'
    if (s === 'contacted' || s === 'negotiation') return 'text-purple-600'
    if (s === 'new') return 'text-yellow-600'
    if (s === 'lost') return 'text-red-600'
    return 'text-gray-600'
  }

  const getSourceIcon = (source?: string) => {
    if (!source) return User
    switch (source.toLowerCase()) {
      case 'instagram':
        return Instagram
      case 'whatsapp':
        return MessageCircle
      case 'website':
        return Globe
      default:
        return User
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Leads
            </CardTitle>
            <CardDescription>
              {displayedLeads.length} active leads
            </CardDescription>
          </div>
          <Link href="/leads">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedLeads.map((lead) => {
            const SourceIcon = getSourceIcon(lead.source)

            return (
              <div
                key={lead.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                    <SourceIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{lead.title}</p>
                      <Badge variant={getStatusVariant(lead.status)} className="text-xs">
                        {lead.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lead.contact?.firstName} {lead.contact?.lastName}
                      {lead.contact?.company && ` • ${lead.contact.company}`}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {lead.source && (
                        <>
                          <span className="capitalize">{lead.source}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{lead.createdAt || lead.created_at ? formatDistanceToNow(new Date((lead.createdAt ?? lead.created_at) as string), { addSuffix: true }) : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-sm">{lead.value != null ? formatCurrency(lead.value as number) : ''}</p>
                  {lead.probability != null && <p className="text-xs text-muted-foreground">{lead.probability}% prob.</p>}
                </div>
              </div>
            )
          })}
        </div>
        {displayedLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground">Leads will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
