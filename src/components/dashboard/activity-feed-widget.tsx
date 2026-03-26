'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, ShoppingCart, Users, Package, MessageSquare, Clock, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: string
  user?: string
}

const ICON_MAP: Record<string, typeof Activity> = {
  order: ShoppingCart,
  customer: Users,
  message: MessageSquare,
  product: Package,
}

function fmtRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ActivityFeedWidget() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['dashboard-activity-feed'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/activities', { params: { limit: 8 } })
        return (res.data?.data ?? []) as ActivityItem[]
      } catch {
        return []
      }
    },
    retry: 1,
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">No recent activity</div>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => {
              const Icon = ICON_MAP[a.type] ?? Activity
              return (
                <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{a.message}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {fmtRelative(a.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
