'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, MessageSquare, CheckCircle2, FileEdit, Upload, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  name: string
  avatar: string
}

interface Activity {
  id: string
  user: TeamMember
  action: string
  target: string
  timestamp: Date
  type: 'comment' | 'update' | 'approval' | 'upload' | 'created'
}

const mockActivities: Activity[] = [
  { id: '1', user: { id: 'user_1', name: 'Sarah Johnson', avatar: 'SJ' }, action: 'commented on', target: 'Summer Fashion Launch', timestamp: new Date(Date.now() - 5 * 60000), type: 'comment' },
  { id: '2', user: { id: 'user_2', name: 'Michael Chen', avatar: 'MC' }, action: 'approved', target: 'Valentine\'s Day Sale', timestamp: new Date(Date.now() - 15 * 60000), type: 'approval' },
  { id: '3', user: { id: 'user_3', name: 'Emily Rodriguez', avatar: 'ER' }, action: 'updated budget for', target: 'Brand Awareness Q1', timestamp: new Date(Date.now() - 30 * 60000), type: 'update' },
  { id: '4', user: { id: 'user_4', name: 'David Park', avatar: 'DP' }, action: 'uploaded creative assets to', target: 'Customer Re-engagement', timestamp: new Date(Date.now() - 45 * 60000), type: 'upload' },
  { id: '5', user: { id: 'user_1', name: 'Sarah Johnson', avatar: 'SJ' }, action: 'created new campaign', target: 'Spring Collection Preview', timestamp: new Date(Date.now() - 60 * 60000), type: 'created' },
]

export function TeamActivityFeed({ teamMembers }: { teamMembers: TeamMember[] }) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'approval': return <CheckCircle2 className="h-4 w-4" />
      case 'update': return <FileEdit className="h-4 w-4" />
      case 'upload': return <Upload className="h-4 w-4" />
      case 'created': return <Users className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'comment': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40'
      case 'approval': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40'
      case 'update': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40'
      case 'upload': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40'
      case 'created': return 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/40'
    }
  }

  const formatTimestamp = (date: Date) => {
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Team Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {activity.user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-semibold">{activity.user.name}</span>{' '}
                      <span className="text-gray-600 dark:text-gray-400">{activity.action}</span>{' '}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <div className={cn('p-1.5 rounded-lg', getActivityColor(activity.type))}>
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
