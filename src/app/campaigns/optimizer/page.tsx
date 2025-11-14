'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CampaignPerformanceCard } from '@/components/ai/campaign-performance-card'
import { BudgetAllocationChart } from '@/components/ai/budget-allocation-chart'
import { OptimizationRecommendations } from '@/components/ai/optimization-recommendations'
import { AutoOptimizeControl } from '@/components/ai/auto-optimize-control'
import {
  Zap,
  TrendingUp,
  DollarSign,
  Users,
  RefreshCw,
  Download,
  Settings as SettingsIcon,
} from 'lucide-react'
import { toast } from 'sonner'

// Mock data
const mockCampaigns = [
  {
    campaign_id: 'camp_1',
    campaign_name: 'Summer Fashion Collection 2025',
    platform: 'instagram' as const,
    status: 'active' as const,
    budget: {
      total: 15000,
      spent: 8500,
      remaining: 6500,
    },
    performance: {
      impressions: 450000,
      clicks: 12500,
      conversions: 385,
      ctr: 2.78,
      conversionRate: 3.08,
      roi: 3.2,
    },
    predicted: {
      roi: 4.1,
      conversions: 125,
      confidence: 87,
    },
    recommendations: 3,
  },
  {
    campaign_id: 'camp_2',
    campaign_name: 'Facebook Festive Sale',
    platform: 'facebook' as const,
    status: 'active' as const,
    budget: {
      total: 12000,
      spent: 10200,
      remaining: 1800,
    },
    performance: {
      impressions: 320000,
      clicks: 8900,
      conversions: 245,
      ctr: 2.78,
      conversionRate: 2.75,
      roi: 2.8,
    },
    predicted: {
      roi: 2.4,
      conversions: -45,
      confidence: 82,
    },
    recommendations: 5,
  },
  {
    campaign_id: 'camp_3',
    campaign_name: 'Google Search - Premium Products',
    platform: 'google' as const,
    status: 'active' as const,
    budget: {
      total: 20000,
      spent: 15500,
      remaining: 4500,
    },
    performance: {
      impressions: 180000,
      clicks: 5400,
      conversions: 432,
      ctr: 3.0,
      conversionRate: 8.0,
      roi: 4.5,
    },
    predicted: {
      roi: 4.8,
      conversions: 85,
      confidence: 91,
    },
    recommendations: 2,
  },
]

const mockBudgetAllocation = [
  { channel: 'Instagram', current: 15000, recommended: 18000, color: '#E1306C' },
  { channel: 'Facebook', current: 12000, recommended: 9000, color: '#1877F2' },
  { channel: 'Google Ads', current: 20000, recommended: 22000, color: '#EA4335' },
  { channel: 'WhatsApp', current: 8000, recommended: 6000, color: '#25D366' },
]

const mockRecommendations = [
  {
    id: 'rec_1',
    type: 'budget' as const,
    priority: 'high' as const,
    title: 'Increase Instagram Budget by $3,000',
    description:
      'Instagram campaign is showing strong ROI (3.2x) with high engagement. Increasing budget by 20% could generate an additional 125 conversions based on current performance trends.',
    expected_impact: '+$9,600 revenue, +125 conversions',
    action_required: true,
  },
  {
    id: 'rec_2',
    type: 'budget' as const,
    priority: 'high' as const,
    title: 'Reduce Facebook Budget by $3,000',
    description:
      'Facebook campaign ROI is declining (2.8x → 2.4x predicted). Performance variance detected at 30%. Consider reallocating $3,000 to better-performing channels.',
    expected_impact: 'Prevent -$4,200 in inefficient spend',
    action_required: true,
  },
  {
    id: 'rec_3',
    type: 'audience' as const,
    priority: 'medium' as const,
    title: 'Expand Google Ads to 35-44 Age Group',
    description:
      'Analytics show strong conversion rates in 25-34 demographic. Expanding to adjacent 35-44 age group could capture additional high-intent customers with similar interests.',
    expected_impact: '+15% reach, +$12,000 potential revenue',
    action_required: false,
  },
  {
    id: 'rec_4',
    type: 'timing' as const,
    priority: 'medium' as const,
    title: 'Shift Instagram Ad Schedule to 6PM-10PM',
    description:
      'Peak engagement detected during evening hours (6PM-10PM) with 45% higher CTR. Adjusting ad schedule can improve conversion rates without increasing budget.',
    expected_impact: '+18% CTR, +$5,400 revenue',
    action_required: false,
  },
  {
    id: 'rec_5',
    type: 'content' as const,
    priority: 'low' as const,
    title: 'Update Facebook Ad Creative',
    description:
      'Current creative has been running for 28 days. Creative fatigue detected with declining CTR. Refresh with new visuals to maintain engagement.',
    expected_impact: 'Restore CTR to baseline +0.8%',
    action_required: false,
  },
]

const mockAutoOptimizeSettings = {
  enabled: true,
  aggressiveness: 3,
  frequency: 'hourly' as const,
  autoApply: false,
  threshold: 20,
}

export default function CampaignOptimizerPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoOptimizeSettings, setAutoOptimizeSettings] = useState(mockAutoOptimizeSettings)

  const totalBudget = mockCampaigns.reduce((acc, c) => acc + c.budget.total, 0)
  const totalSpent = mockCampaigns.reduce((acc, c) => acc + c.budget.spent, 0)
  const totalConversions = mockCampaigns.reduce((acc, c) => acc + c.performance.conversions, 0)
  const avgRoi = (
    mockCampaigns.reduce((acc, c) => acc + c.performance.roi, 0) / mockCampaigns.length
  ).toFixed(2)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRefreshing(false)
    toast.success('Campaign data refreshed')
  }

  const handleOptimizeCampaign = (campaignId: string) => {
    const campaign = mockCampaigns.find((c) => c.campaign_id === campaignId)
    toast.success(`Optimizing ${campaign?.campaign_name}...`)
  }

  const handleViewDetails = (campaignId: string) => {
    const campaign = mockCampaigns.find((c) => c.campaign_id === campaignId)
    toast.info(`Viewing details for ${campaign?.campaign_name}`)
  }

  const handleApplyRecommendations = (ids: string[]) => {
    toast.success(`Applying ${ids.length} recommendation(s)...`)
  }

  const handleApplyAllRecommendations = () => {
    toast.success(`Applying all ${mockRecommendations.length} recommendations...`)
  }

  const handleAutoOptimizeChange = (settings: typeof autoOptimizeSettings) => {
    setAutoOptimizeSettings(settings)
    toast.success('Auto-optimization settings updated')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            Campaign Optimizer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered campaign performance optimization and budget allocation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Budget
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${(totalBudget / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ${(totalSpent / 1000).toFixed(1)}K spent
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Active Campaigns
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mockCampaigns.length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">All optimized</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Conversions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalConversions}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">+165 predicted</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Average ROI
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgRoi}x</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  3.77x predicted
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="budget">Budget Allocation</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="auto-optimize">Auto-Optimize</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockCampaigns.map((campaign) => (
              <CampaignPerformanceCard
                key={campaign.campaign_id}
                campaign={campaign}
                onOptimize={handleOptimizeCampaign}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BudgetAllocationChart data={mockBudgetAllocation} title="Current vs AI Recommended" />
            <BudgetAllocationChart
              data={mockBudgetAllocation}
              title="Detailed Comparison"
              showComparison={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <OptimizationRecommendations
            recommendations={mockRecommendations}
            onApply={handleApplyRecommendations}
            onApplyAll={handleApplyAllRecommendations}
          />
        </TabsContent>

        <TabsContent value="auto-optimize" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <AutoOptimizeControl
                settings={autoOptimizeSettings}
                onSettingsChange={handleAutoOptimizeChange}
                campaignCount={mockCampaigns.length}
                lastOptimization="2 minutes ago"
              />
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Optimization History
                  </h3>
                  <div className="space-y-3">
                    {[
                      { time: '2 min ago', action: 'Budget reallocation suggested', impact: '+$2.4K' },
                      { time: '1 hour ago', action: 'Audience targeting optimized', impact: '+12%' },
                      { time: '3 hours ago', action: 'Ad schedule adjusted', impact: '+8%' },
                    ].map((event, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 mt-1.5" />
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {event.action}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {event.time}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              {event.impact}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
