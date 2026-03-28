'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LiveActivityFeed } from '@/components/ai/live-activity-feed'
import { RealTimePerformanceChart } from '@/components/ai/real-time-performance-chart'
import { OptimizationTimeline } from '@/components/ai/optimization-timeline'
import { ManualOverrideControls } from '@/components/ai/manual-override-controls'
import {
  Activity,
  Zap,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  Bell,
  BellOff,
} from 'lucide-react'
import { toast } from 'sonner'

// Mock real-time data
const mockLiveMetrics = {
  activeOptimizations: 3,
  totalBudgetManaged: 47000,
  optimizationsToday: 12,
  avgResponseTime: '2.3s',
  successRate: 94.2,
}

const mockActiveCampaigns = [
  {
    id: 'camp_1',
    name: 'Summer Fashion Collection',
    platform: 'instagram',
    status: 'optimizing' as const,
    currentBudget: 15000,
    spent: 8500,
    roi: 3.2,
    lastOptimized: '2 minutes ago',
    nextCheck: '8 minutes',
  },
  {
    id: 'camp_2',
    name: 'Facebook Festive Sale',
    platform: 'facebook',
    status: 'monitoring' as const,
    currentBudget: 12000,
    spent: 10200,
    roi: 2.8,
    lastOptimized: '15 minutes ago',
    nextCheck: '5 minutes',
  },
  {
    id: 'camp_3',
    name: 'Google Search Premium',
    platform: 'google',
    status: 'paused' as const,
    currentBudget: 20000,
    spent: 15500,
    roi: 4.5,
    lastOptimized: '1 hour ago',
    nextCheck: 'Paused',
  },
]

export default function LiveOptimizationPage() {
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(10) // seconds
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [isMonitoring, refreshInterval])

  const handleToggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
    toast.success(isMonitoring ? 'Monitoring paused' : 'Monitoring resumed')
  }

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    toast.success(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled')
  }

  const handleRefresh = () => {
    setLastUpdate(new Date())
    toast.success('Data refreshed')
  }

  const handleCampaignAction = (campaignId: string, action: string) => {
    toast.success(`Campaign ${action}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimizing':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'monitoring':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'paused':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
      default:
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
      default:
        return 'bg-gray-600'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Live Optimization Monitor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time campaign monitoring and optimization tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={notificationsEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleNotifications}
          >
            {notificationsEnabled ? (
              <Bell className="h-4 w-4 mr-2" />
            ) : (
              <BellOff className="h-4 w-4 mr-2" />
            )}
            Notifications
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={isMonitoring ? 'destructive' : 'default'}
            size="sm"
            onClick={handleToggleMonitoring}
          >
            {isMonitoring ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isMonitoring ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {isMonitoring && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  AI Monitoring Active
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Last update: {lastUpdate.toLocaleTimeString()} • Next refresh in{' '}
                  {refreshInterval}s
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-blue-600 dark:text-blue-400">Active Optimizations</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {mockLiveMetrics.activeOptimizations}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600 dark:text-blue-400">Success Rate</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {mockLiveMetrics.successRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Active Optimizations
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mockLiveMetrics.activeOptimizations}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {mockLiveMetrics.optimizationsToday} today
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Budget Managed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${(mockLiveMetrics.totalBudgetManaged / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Real-time</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Avg Response Time
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mockLiveMetrics.avgResponseTime}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Fast</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mockLiveMetrics.successRate}%
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Excellent</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockActiveCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg ${getPlatformColor(campaign.platform)} flex items-center justify-center`}>
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {campaign.name}
                      </h4>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        Budget: ${campaign.currentBudget.toLocaleString()} • Spent: $
                        {campaign.spent.toLocaleString()}
                      </span>
                      <span>ROI: {campaign.roi}x</span>
                      <span>Last: {campaign.lastOptimized}</span>
                      <span>Next: {campaign.nextCheck}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === 'paused' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCampaignAction(campaign.id, 'resumed')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCampaignAction(campaign.id, 'paused')}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCampaignAction(campaign.id, 'optimized')}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Optimize Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Live Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="controls">Manual Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <LiveActivityFeed />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <RealTimePerformanceChart />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <OptimizationTimeline />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <ManualOverrideControls />
        </TabsContent>
      </Tabs>
    </div>
  )
}
