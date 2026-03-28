'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerformanceDataPoint {
  timestamp: string
  roi: number
  conversions: number
  ctr: number
  spend: number
}

// Generate mock real-time data
const generateDataPoint = (baseValues: PerformanceDataPoint): PerformanceDataPoint => {
  const now = new Date()
  return {
    timestamp: now.toLocaleTimeString(),
    roi: Math.max(0, baseValues.roi + (Math.random() - 0.5) * 0.5),
    conversions: Math.max(0, Math.floor(baseValues.conversions + (Math.random() - 0.5) * 10)),
    ctr: Math.max(0, baseValues.ctr + (Math.random() - 0.5) * 0.3),
    spend: baseValues.spend + Math.random() * 50,
  }
}

const initialData: PerformanceDataPoint[] = Array.from({ length: 20 }, (_, i) => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - (19 - i))
  return {
    timestamp: now.toLocaleTimeString(),
    roi: 3.2 + (Math.random() - 0.5) * 0.5,
    conversions: 25 + Math.floor((Math.random() - 0.5) * 10),
    ctr: 2.8 + (Math.random() - 0.5) * 0.3,
    spend: 500 + i * 25 + Math.random() * 50,
  }
})

export function RealTimePerformanceChart() {
  const [data, setData] = useState<PerformanceDataPoint[]>(initialData)
  const [selectedMetric, setSelectedMetric] = useState<'roi' | 'conversions' | 'ctr' | 'spend'>('roi')
  const [isPaused, setIsPaused] = useState(false)

  // Simulate real-time data updates
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setData((prevData) => {
        const newPoint = generateDataPoint(prevData[prevData.length - 1])
        return [...prevData.slice(1), newPoint] // Keep last 20 points
      })
    }, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [isPaused])

  const metrics = [
    { key: 'roi', label: 'ROI', format: (v: number) => `${v.toFixed(2)}x`, color: '#3b82f6' },
    { key: 'conversions', label: 'Conversions', format: (v: number) => v.toString(), color: '#10b981' },
    { key: 'ctr', label: 'CTR', format: (v: number) => `${v.toFixed(2)}%`, color: '#f59e0b' },
    { key: 'spend', label: 'Spend', format: (v: number) => `$${v.toFixed(0)}`, color: '#ef4444' },
  ]

  const getCurrentMetric = () => metrics.find((m) => m.key === selectedMetric)!

  const getMetricTrend = (metricKey: string) => {
    if (data.length < 2) return 'neutral'
    const recent = data.slice(-5)
    const avg = recent.reduce((sum, d) => sum + (d[metricKey as keyof PerformanceDataPoint] as number), 0) / recent.length
    const older = data.slice(-10, -5)
    const oldAvg = older.reduce((sum, d) => sum + (d[metricKey as keyof PerformanceDataPoint] as number), 0) / older.length
    return avg > oldAvg ? 'up' : avg < oldAvg ? 'down' : 'neutral'
  }

  const getMetricChange = (metricKey: string) => {
    if (data.length < 2) return 0
    const latest = data[data.length - 1][metricKey as keyof PerformanceDataPoint] as number
    const previous = data[data.length - 2][metricKey as keyof PerformanceDataPoint] as number
    return ((latest - previous) / previous) * 100
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Main Chart */}
      <div className="xl:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {!isPaused && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Real-Time Performance: {getCurrentMetric().label}
                  </CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Updates every 3 seconds • Last 20 minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`color${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getCurrentMetric().color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={getCurrentMetric().color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis
                  dataKey="timestamp"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                  tickFormatter={(value) => getCurrentMetric().format(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [getCurrentMetric().format(value), getCurrentMetric().label]}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={getCurrentMetric().color}
                  strokeWidth={2}
                  fill={`url(#color${selectedMetric})`}
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Metric Selector */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Select Metric</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.map((metric) => {
              const trend = getMetricTrend(metric.key)
              const change = getMetricChange(metric.key)
              const isSelected = selectedMetric === metric.key
              const latestValue = data[data.length - 1]?.[metric.key as keyof PerformanceDataPoint] as number

              return (
                <button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key as typeof selectedMetric)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-all text-left',
                    isSelected
                      ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {metric.label}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {metric.format(latestValue || 0)}
                    </span>
                    <div className="flex items-center gap-1">
                      {trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : null}
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          trend === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : trend === 'down'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {change > 0 && '+'}
                        {change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Current Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.length > 0 && (
              <>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Avg ROI</span>
                    <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {(data.reduce((sum, d) => sum + d.roi, 0) / data.length).toFixed(2)}x
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Total Conversions</span>
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {data.reduce((sum, d) => sum + d.conversions, 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Avg CTR</span>
                    <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {(data.reduce((sum, d) => sum + d.ctr, 0) / data.length).toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Total Spend</span>
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    ${data[data.length - 1]?.spend.toFixed(0) || 0}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
