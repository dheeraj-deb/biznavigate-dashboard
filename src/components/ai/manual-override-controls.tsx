'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  Zap,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  Shield,
  Lock,
  Unlock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CampaignControl {
  id: string
  name: string
  platform: 'instagram' | 'facebook' | 'google' | 'whatsapp'
  aiEnabled: boolean
  currentBudget: number
  minBudget: number
  maxBudget: number
  autoAdjust: boolean
  overrideActive: boolean
}

const mockCampaigns: CampaignControl[] = [
  {
    id: 'camp_1',
    name: 'Summer Fashion Collection',
    platform: 'instagram',
    aiEnabled: true,
    currentBudget: 15000,
    minBudget: 10000,
    maxBudget: 25000,
    autoAdjust: true,
    overrideActive: false,
  },
  {
    id: 'camp_2',
    name: 'Facebook Festive Sale',
    platform: 'facebook',
    aiEnabled: true,
    currentBudget: 12000,
    minBudget: 8000,
    maxBudget: 20000,
    autoAdjust: true,
    overrideActive: false,
  },
  {
    id: 'camp_3',
    name: 'Google Search Premium',
    platform: 'google',
    aiEnabled: false,
    currentBudget: 20000,
    minBudget: 15000,
    maxBudget: 30000,
    autoAdjust: false,
    overrideActive: true,
  },
]

export function ManualOverrideControls() {
  const [campaigns, setCampaigns] = useState<CampaignControl[]>(mockCampaigns)
  const [globalAIEnabled, setGlobalAIEnabled] = useState(true)

  const handleAIToggle = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId ? { ...c, aiEnabled: !c.aiEnabled, overrideActive: c.aiEnabled } : c
      )
    )
    toast.success('AI optimization updated')
  }

  const handleBudgetChange = (campaignId: string, newBudget: number[]) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId ? { ...c, currentBudget: newBudget[0], overrideActive: true } : c
      )
    )
  }

  const handleAutoAdjustToggle = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId ? { ...c, autoAdjust: !c.autoAdjust } : c
      )
    )
    toast.success('Auto-adjust updated')
  }

  const handleResetOverride = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, overrideActive: false, aiEnabled: true, autoAdjust: true }
          : c
      )
    )
    toast.success('Override reset - AI resumed control')
  }

  const handleGlobalAIToggle = () => {
    const newState = !globalAIEnabled
    setGlobalAIEnabled(newState)
    setCampaigns((prev) =>
      prev.map((c) => ({ ...c, aiEnabled: newState, overrideActive: !newState }))
    )
    toast.success(newState ? 'Global AI enabled' : 'Global AI disabled')
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

  return (
    <div className="space-y-6">
      {/* Global Controls */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Global AI Controls</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Override AI optimization for all campaigns
                </p>
              </div>
            </div>
            <Switch checked={globalAIEnabled} onCheckedChange={handleGlobalAIToggle} />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">AI Status</span>
                {globalAIEnabled ? (
                  <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <p className={cn(
                'text-xl font-bold',
                globalAIEnabled
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}>
                {globalAIEnabled ? 'Active' : 'Overridden'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Campaigns Under AI</span>
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {campaigns.filter((c) => c.aiEnabled).length} / {campaigns.length}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Overrides</span>
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {campaigns.filter((c) => c.overrideActive).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Campaign Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <Card
            key={campaign.id}
            className={cn(
              'transition-all',
              campaign.overrideActive &&
                'border-2 border-blue-200 dark:border-blue-800'
            )}
          >
            <CardHeader className={cn(
              campaign.overrideActive && 'bg-blue-50 dark:bg-blue-900/20'
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', getPlatformColor(campaign.platform))}>
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {campaign.platform}
                    </p>
                  </div>
                </div>
                {campaign.overrideActive && (
                  <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Manual Override
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* AI Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className={cn(
                    'h-4 w-4',
                    campaign.aiEnabled
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-600'
                  )} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      AI Optimization
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {campaign.aiEnabled ? 'AI managing this campaign' : 'Manual control active'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={campaign.aiEnabled}
                  onCheckedChange={() => handleAIToggle(campaign.id)}
                />
              </div>

              {/* Budget Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Budget Control
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${campaign.currentBudget.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[campaign.currentBudget]}
                  onValueChange={(value) => handleBudgetChange(campaign.id, value)}
                  min={campaign.minBudget}
                  max={campaign.maxBudget}
                  step={100}
                  disabled={campaign.aiEnabled && campaign.autoAdjust}
                  className={cn(
                    campaign.aiEnabled && campaign.autoAdjust && 'opacity-50 cursor-not-allowed'
                  )}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>${campaign.minBudget.toLocaleString()}</span>
                  <span>${campaign.maxBudget.toLocaleString()}</span>
                </div>
              </div>

              {/* Auto-Adjust Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Auto-Adjust Budget
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Allow AI to adjust within range
                    </p>
                  </div>
                </div>
                <Switch
                  checked={campaign.autoAdjust}
                  onCheckedChange={() => handleAutoAdjustToggle(campaign.id)}
                  disabled={!campaign.aiEnabled}
                />
              </div>

              {/* Reset Override Button */}
              {campaign.overrideActive && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleResetOverride(campaign.id)}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Reset to AI Control
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
