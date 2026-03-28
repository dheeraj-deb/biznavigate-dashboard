'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Zap,
  Settings,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AutoOptimizeSettings {
  enabled: boolean
  aggressiveness: number // 1-5
  frequency: 'realtime' | 'hourly' | 'daily'
  autoApply: boolean
  threshold: number // Minimum performance variance to trigger optimization (%)
}

interface AutoOptimizeControlProps {
  settings: AutoOptimizeSettings
  onSettingsChange?: (settings: AutoOptimizeSettings) => void
  campaignCount?: number
  lastOptimization?: string
}

export function AutoOptimizeControl({
  settings: initialSettings,
  onSettingsChange,
  campaignCount = 0,
  lastOptimization,
}: AutoOptimizeControlProps) {
  const [settings, setSettings] = useState<AutoOptimizeSettings>(initialSettings)

  const handleToggle = (enabled: boolean) => {
    const newSettings = { ...settings, enabled }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const handleAggressivenessChange = (value: number[]) => {
    const newSettings = { ...settings, aggressiveness: value[0] }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const handleFrequencyChange = (frequency: 'realtime' | 'hourly' | 'daily') => {
    const newSettings = { ...settings, frequency }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const handleAutoApplyToggle = (autoApply: boolean) => {
    const newSettings = { ...settings, autoApply }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const handleThresholdChange = (value: number[]) => {
    const newSettings = { ...settings, threshold: value[0] }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const getAggressivenessLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Conservative'
      case 2:
        return 'Cautious'
      case 3:
        return 'Balanced'
      case 4:
        return 'Aggressive'
      case 5:
        return 'Very Aggressive'
      default:
        return 'Balanced'
    }
  }

  const getAggressivenessColor = (level: number) => {
    if (level <= 2) return 'text-green-600 dark:text-green-400'
    if (level === 3) return 'text-blue-600 dark:text-blue-400'
    return 'text-blue-600 dark:text-blue-400'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-lg font-semibold">Auto-Optimization</CardTitle>
            {settings.enabled && (
              <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                <Activity className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
          <Switch checked={settings.enabled} onCheckedChange={handleToggle} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!settings.enabled ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Auto-optimization is currently disabled</p>
            <p className="text-xs mt-1">Enable it to let AI optimize your campaigns automatically</p>
          </div>
        ) : (
          <>
            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Monitoring</span>
                </div>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {campaignCount} Campaigns
                </p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Last Check</span>
                </div>
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {lastOptimization || 'Never'}
                </p>
              </div>
            </div>

            {/* Optimization Frequency */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Optimization Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['realtime', 'hourly', 'daily'] as const).map((freq) => (
                  <Button
                    key={freq}
                    variant={settings.frequency === freq ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFrequencyChange(freq)}
                    className={cn(
                      settings.frequency === freq &&
                        'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
                    )}
                  >
                    {freq === 'realtime' && <Activity className="h-3 w-3 mr-1" />}
                    {freq === 'hourly' && <Clock className="h-3 w-3 mr-1" />}
                    {freq === 'daily' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Aggressiveness Level */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Optimization Aggressiveness
                </label>
                <span className={cn('text-sm font-bold', getAggressivenessColor(settings.aggressiveness))}>
                  {getAggressivenessLabel(settings.aggressiveness)}
                </span>
              </div>
              <Slider
                value={[settings.aggressiveness]}
                onValueChange={handleAggressivenessChange}
                min={1}
                max={5}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Conservative</span>
                <span>Balanced</span>
                <span>Aggressive</span>
              </div>
            </div>

            {/* Performance Threshold */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trigger Threshold
                </label>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {settings.threshold}% variance
                </span>
              </div>
              <Slider
                value={[settings.threshold]}
                onValueChange={handleThresholdChange}
                min={5}
                max={50}
                step={5}
                className="mb-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Optimize when performance varies by more than {settings.threshold}%
              </p>
            </div>

            {/* Auto-Apply */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-start gap-3">
                {settings.autoApply ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Auto-Apply Recommendations
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {settings.autoApply
                      ? 'AI will automatically apply optimizations without confirmation'
                      : 'You will be notified to review recommendations before applying'}
                  </p>
                </div>
              </div>
              <Switch checked={settings.autoApply} onCheckedChange={handleAutoApplyToggle} />
            </div>

            {/* Warning for aggressive settings */}
            {(settings.aggressiveness >= 4 || (settings.autoApply && settings.frequency === 'realtime')) && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      High-Risk Configuration
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Your current settings may cause frequent and significant changes to campaigns. Monitor closely for the first few days.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
