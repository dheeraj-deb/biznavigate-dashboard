'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityEvent {
  id: string
  type: 'optimization' | 'budget_change' | 'performance_alert' | 'ai_recommendation' | 'manual_override'
  timestamp: Date
  campaign: {
    id: string
    name: string
    platform: 'instagram' | 'facebook' | 'google' | 'whatsapp'
  }
  title: string
  description: string
  impact?: {
    metric: string
    change: number
    direction: 'up' | 'down'
  }
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

// Mock activity data generator
const generateMockActivity = (): ActivityEvent => {
  const types: ActivityEvent['type'][] = [
    'optimization',
    'budget_change',
    'performance_alert',
    'ai_recommendation',
  ]
  const campaigns = [
    { id: 'camp_1', name: 'Summer Fashion', platform: 'instagram' as const },
    { id: 'camp_2', name: 'Festive Sale', platform: 'facebook' as const },
    { id: 'camp_3', name: 'Google Premium', platform: 'google' as const },
  ]
  const priorities: ActivityEvent['priority'][] = ['low', 'medium', 'high']

  const type = types[Math.floor(Math.random() * types.length)]
  const campaign = campaigns[Math.floor(Math.random() * campaigns.length)]
  const priority = priorities[Math.floor(Math.random() * priorities.length)]

  const activities: Record<ActivityEvent['type'], { title: string; description: string }> = {
    optimization: {
      title: 'AI Optimization Applied',
      description: `Budget reallocated by $${Math.floor(Math.random() * 1000) + 100} to improve ROI`,
    },
    budget_change: {
      title: 'Budget Adjustment',
      description: `Daily budget ${Math.random() > 0.5 ? 'increased' : 'decreased'} by ${Math.floor(Math.random() * 20) + 5}%`,
    },
    performance_alert: {
      title: 'Performance Alert',
      description: `CTR ${Math.random() > 0.5 ? 'increased' : 'dropped'} by ${(Math.random() * 2).toFixed(1)}%`,
    },
    ai_recommendation: {
      title: 'New AI Recommendation',
      description: 'Suggested audience expansion to 25-34 age group',
    },
    manual_override: {
      title: 'Manual Override',
      description: 'User paused automated optimization',
    },
  }

  return {
    id: `event_${Date.now()}_${Math.random()}`,
    type,
    timestamp: new Date(),
    campaign,
    ...activities[type],
    impact: Math.random() > 0.5 ? {
      metric: ['ROI', 'CTR', 'Conversions'][Math.floor(Math.random() * 3)],
      change: parseFloat((Math.random() * 20).toFixed(1)),
      direction: Math.random() > 0.5 ? 'up' : 'down',
    } : undefined,
    priority,
    status: 'completed',
  }
}

const initialEvents: ActivityEvent[] = Array.from({ length: 10 }, generateMockActivity).sort(
  (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
)

export function LiveActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents)
  const [isPaused, setIsPaused] = useState(false)

  // Simulate new events coming in
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const newEvent = generateMockActivity()
      setEvents((prev) => [newEvent, ...prev].slice(0, 50)) // Keep last 50 events
    }, 5000) // New event every 5 seconds

    return () => clearInterval(interval)
  }, [isPaused])

  const getTypeIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'optimization':
        return <Zap className="h-4 w-4" />
      case 'budget_change':
        return <DollarSign className="h-4 w-4" />
      case 'performance_alert':
        return <AlertCircle className="h-4 w-4" />
      case 'ai_recommendation':
        return <TrendingUp className="h-4 w-4" />
      case 'manual_override':
        return <Users className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'optimization':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'budget_change':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'performance_alert':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
      case 'ai_recommendation':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      case 'manual_override':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  const getPriorityColor = (priority: ActivityEvent['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
      case 'low':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }

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

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)

    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleString()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {!isPaused && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <CardTitle className="text-lg font-semibold">Live Activity Feed</CardTitle>
              </div>
              <Badge
                className={cn(
                  'cursor-pointer',
                  isPaused
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                )}
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? 'Paused' : 'Live'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all duration-300',
                      index === 0 && !isPaused
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-fadeIn'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', getPlatformColor(event.campaign.platform))}>
                        {getTypeIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                              {event.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {event.campaign.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getTypeColor(event.type)}>
                              {event.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {event.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(event.timestamp)}
                            </div>
                            {event.impact && (
                              <div className="flex items-center gap-1">
                                {event.impact.direction === 'up' ? (
                                  <ArrowUpCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                                ) : (
                                  <ArrowDownCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                                )}
                                <span className={event.impact.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                  {event.impact.metric} {event.impact.direction === 'up' ? '+' : '-'}
                                  {event.impact.change}%
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className={getPriorityColor(event.priority)}>
                            {event.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: 'Optimizations', count: events.filter((e) => e.type === 'optimization').length, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Budget Changes', count: events.filter((e) => e.type === 'budget_change').length, color: 'text-green-600 dark:text-green-400' },
                { label: 'Performance Alerts', count: events.filter((e) => e.type === 'performance_alert').length, color: 'text-orange-600 dark:text-orange-400' },
                { label: 'AI Recommendations', count: events.filter((e) => e.type === 'ai_recommendation').length, color: 'text-purple-600 dark:text-purple-400' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{stat.label}</span>
                  <span className={cn('text-xl font-bold', stat.color)}>{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'High Priority', count: events.filter((e) => e.priority === 'high').length, color: 'bg-red-600 dark:bg-red-500' },
              { label: 'Medium Priority', count: events.filter((e) => e.priority === 'medium').length, color: 'bg-yellow-600 dark:bg-yellow-500' },
              { label: 'Low Priority', count: events.filter((e) => e.priority === 'low').length, color: 'bg-gray-600 dark:bg-gray-500' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{stat.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{stat.count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all duration-300', stat.color)}
                    style={{ width: `${(stat.count / events.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
