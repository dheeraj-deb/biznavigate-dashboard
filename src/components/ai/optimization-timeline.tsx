'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  id: string
  timestamp: Date
  campaign: string
  platform: 'instagram' | 'facebook' | 'google' | 'whatsapp'
  action: string
  before: { value: number; label: string }
  after: { value: number; label: string }
  impact: { metric: string; change: number; direction: 'up' | 'down' }
  status: 'success' | 'pending' | 'failed'
}

const mockTimeline: TimelineEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60000),
    campaign: 'Summer Fashion Collection',
    platform: 'instagram',
    action: 'Budget Increase',
    before: { value: 15000, label: 'Budget' },
    after: { value: 18000, label: 'Budget' },
    impact: { metric: 'ROI', change: 12.5, direction: 'up' },
    status: 'success',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60000),
    campaign: 'Facebook Festive Sale',
    platform: 'facebook',
    action: 'Budget Decrease',
    before: { value: 12000, label: 'Budget' },
    after: { value: 9000, label: 'Budget' },
    impact: { metric: 'Efficiency', change: 18.3, direction: 'up' },
    status: 'success',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 30 * 60000),
    campaign: 'Google Search Premium',
    platform: 'google',
    action: 'Audience Expansion',
    before: { value: 25, label: 'Age Range (25-34)' },
    after: { value: 44, label: 'Age Range (25-44)' },
    impact: { metric: 'Reach', change: 45.2, direction: 'up' },
    status: 'success',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 45 * 60000),
    campaign: 'Summer Fashion Collection',
    platform: 'instagram',
    action: 'Ad Schedule Shift',
    before: { value: 9, label: 'Start Time (9 AM)' },
    after: { value: 18, label: 'Start Time (6 PM)' },
    impact: { metric: 'CTR', change: 22.8, direction: 'up' },
    status: 'success',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 60 * 60000),
    campaign: 'Facebook Festive Sale',
    platform: 'facebook',
    action: 'Creative Refresh',
    before: { value: 28, label: 'Days Running' },
    after: { value: 0, label: 'Days Running' },
    impact: { metric: 'Engagement', change: 15.7, direction: 'up' },
    status: 'success',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 90 * 60000),
    campaign: 'Google Search Premium',
    platform: 'google',
    action: 'Bid Optimization',
    before: { value: 2.5, label: 'CPC' },
    after: { value: 2.1, label: 'CPC' },
    impact: { metric: 'Cost Efficiency', change: 16.0, direction: 'up' },
    status: 'success',
  },
]

export function OptimizationTimeline() {
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-br from-purple-500 to-pink-500'
      case 'facebook':
        return 'bg-blue-600'
      case 'google':
        return 'bg-red-600'
      case 'whatsapp':
        return 'bg-green-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'failed':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Optimization Timeline
          </CardTitle>
          <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            {mockTimeline.length} Events
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

            <div className="space-y-6">
              {mockTimeline.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Timeline Dot */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center z-10',
                      getPlatformColor(event.platform)
                    )}>
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    {event.status === 'success' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Event Card */}
                  <div className="flex-1 pb-6">
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {event.action}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.campaign}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(event.timestamp)}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn('mt-1', getStatusColor(event.status))}
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Before/After */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1 p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Before</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {typeof event.before.value === 'number' && event.before.label.includes('Budget')
                              ? `$${event.before.value.toLocaleString()}`
                              : event.before.value}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {event.before.label}
                          </p>
                        </div>

                        <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />

                        <div className="flex-1 p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">After</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {typeof event.after.value === 'number' && event.after.label.includes('Budget')
                              ? `$${event.after.value.toLocaleString()}`
                              : event.after.value}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {event.after.label}
                          </p>
                        </div>
                      </div>

                      {/* Impact */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          {event.impact.direction === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {event.impact.metric} Impact
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-lg font-bold',
                            event.impact.direction === 'up'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {event.impact.direction === 'up' ? '+' : '-'}
                          {event.impact.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
