'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { ForecastMetric } from '@/types/forecast'
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ForecastMetricsProps {
  metrics: ForecastMetric[]
}

export function ForecastMetrics({ metrics }: ForecastMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} metric={metric} />
      ))}
    </div>
  )
}

function MetricCard({ metric }: { metric: ForecastMetric }) {
  const hasChange = metric.change !== undefined && metric.changeType !== undefined
  const isPositive = metric.changeType === 'increase'
  const isNegative = metric.changeType === 'decrease'

  const getTrendIcon = () => {
    if (!metric.trend) return null

    if (metric.trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
    }
    if (metric.trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
    }
    return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
  }

  const getChangeColor = () => {
    if (isPositive) return 'text-green-600 dark:text-green-400'
    if (isNegative) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {metric.label}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metric.value}
              </h3>
              {getTrendIcon()}
            </div>

            {hasChange && (
              <div className={cn('flex items-center gap-1 mt-2', getChangeColor())}>
                {isPositive && <ArrowUp className="h-3 w-3" />}
                {isNegative && <ArrowDown className="h-3 w-3" />}
                <span className="text-sm font-medium">
                  {Math.abs(metric.change!)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
