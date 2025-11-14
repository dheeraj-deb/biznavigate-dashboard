'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MousePointer,
  Target,
  Zap,
  Settings,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface CampaignPerformance {
  campaign_id: string
  campaign_name: string
  platform: 'facebook' | 'instagram' | 'google' | 'whatsapp'
  status: 'active' | 'paused' | 'completed'
  budget: {
    total: number
    spent: number
    remaining: number
  }
  performance: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    conversionRate: number
    roi: number
  }
  predicted: {
    roi: number
    conversions: number
    confidence: number
  }
  recommendations: number
}

interface CampaignPerformanceCardProps {
  campaign: CampaignPerformance
  onOptimize?: (campaignId: string) => void
  onViewDetails?: (campaignId: string) => void
}

export function CampaignPerformanceCard({
  campaign,
  onOptimize,
  onViewDetails,
}: CampaignPerformanceCardProps) {
  const budgetUsedPercent = (campaign.budget.spent / campaign.budget.total) * 100
  const roiChange = campaign.predicted.roi - campaign.performance.roi
  const isRoiImproving = roiChange > 0

  const getPlatformColor = () => {
    switch (campaign.platform) {
      case 'facebook':
        return 'bg-blue-500'
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'google':
        return 'bg-red-500'
      case 'whatsapp':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusColor = () => {
    switch (campaign.status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', getPlatformColor())}>
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold mb-1">{campaign.campaign_name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusColor()}>
                  {campaign.status.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {campaign.platform}
                </Badge>
                {campaign.recommendations > 0 && (
                  <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    <Zap className="h-3 w-3 mr-1" />
                    {campaign.recommendations} AI Tips
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Budget Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget</span>
            <span className="text-sm font-semibold">
              {formatCurrency(campaign.budget.spent)} / {formatCurrency(campaign.budget.total)}
            </span>
          </div>
          <Progress value={budgetUsedPercent} className="h-2" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {budgetUsedPercent.toFixed(1)}% used
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(campaign.budget.remaining)} remaining
            </span>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <MousePointer className="h-4 w-4 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">CTR</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {campaign.performance.ctr.toFixed(2)}%
            </p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-green-600 dark:text-green-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Conv. Rate</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {campaign.performance.conversionRate.toFixed(2)}%
            </p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current ROI</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {campaign.performance.roi.toFixed(2)}x
            </p>
          </div>
        </div>

        {/* AI Prediction */}
        <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Prediction</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {campaign.predicted.confidence}% confidence
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isRoiImproving ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span
                className={cn(
                  'text-sm font-bold',
                  isRoiImproving ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {isRoiImproving ? '+' : ''}
                {roiChange.toFixed(2)}x
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">Predicted ROI:</span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {campaign.predicted.roi.toFixed(2)}x
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">Est. Conversions:</span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              +{campaign.predicted.conversions}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={() => onOptimize?.(campaign.campaign_id)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-Optimize
          </Button>
          <Button
            onClick={() => onViewDetails?.(campaign.campaign_id)}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
