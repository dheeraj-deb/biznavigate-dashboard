'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ForecastInsight } from '@/types/forecast'
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ForecastInsightsProps {
  insights: ForecastInsight[]
  title?: string
}

export function ForecastInsights({ insights, title = 'AI Insights' }: ForecastInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No insights available yet</p>
            </div>
          ) : (
            insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function InsightCard({ insight }: { insight: ForecastInsight }) {
  const getIcon = () => {
    switch (insight.type) {
      case 'positive':
        return <TrendingUp className="h-5 w-5" />
      case 'negative':
        return <TrendingDown className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getTypeStyles = () => {
    switch (insight.type) {
      case 'positive':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
        }
      case 'negative':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
        }
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        }
    }
  }

  const styles = getTypeStyles()

  const getImpactBadge = () => {
    if (!insight.impact) return null

    const impactColors = {
      high: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      low: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    }

    return (
      <Badge variant="outline" className={cn('text-xs font-medium', impactColors[insight.impact])}>
        {insight.impact.toUpperCase()} IMPACT
      </Badge>
    )
  }

  return (
    <div className={cn('border rounded-lg p-4 transition-all hover:shadow-md', styles.bg)}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 flex-shrink-0', styles.icon)}>{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {insight.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getImpactBadge()}
              <Badge variant="outline" className={cn('text-xs font-medium', styles.badge)}>
                {(insight.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  )
}
