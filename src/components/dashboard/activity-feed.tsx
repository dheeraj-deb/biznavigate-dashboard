'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActivityItem } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { Users, ShoppingCart, Package, Instagram, MessageCircle, Globe } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxItems?: number
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  const getIcon = (type: ActivityItem['type'], source?: string) => {
    if (type === 'lead') {
      if (source === 'Instagram') return Instagram
      if (source === 'WhatsApp') return MessageCircle
      if (source === 'Website') return Globe
      return Users
    }
    if (type === 'order') return ShoppingCart
    return Package
  }

  const getTypeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lead':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
      case 'order':
        return 'text-green-600 bg-green-50 dark:bg-green-950'
      case 'inventory':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    }
  }

  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return 'default'
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('pending')) return 'secondary'
    if (lowerStatus.includes('completed') || lowerStatus.includes('delivered')) return 'default'
    if (lowerStatus.includes('low') || lowerStatus.includes('out')) return 'destructive'
    return 'default'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates across leads, orders, and inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.map((activity) => {
            const Icon = getIcon(activity.type, activity.metadata?.source)
            const iconColor = getTypeColor(activity.type)

            return (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`rounded-full p-2 ${iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </time>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activity.metadata?.source && (
                      <Badge variant="outline" className="text-xs">
                        {activity.metadata.source}
                      </Badge>
                    )}
                    {activity.metadata?.status && (
                      <Badge variant={getStatusBadgeVariant(activity.metadata.status)} className="text-xs">
                        {activity.metadata.status}
                      </Badge>
                    )}
                    {activity.metadata?.amount && (
                      <Badge variant="secondary" className="text-xs">
                        {formatCurrency(activity.metadata.amount)}
                      </Badge>
                    )}
                    {activity.metadata?.customer && (
                      <span className="text-xs text-muted-foreground">
                        {activity.metadata.customer}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
