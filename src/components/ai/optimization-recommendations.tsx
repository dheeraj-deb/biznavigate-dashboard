'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { OptimizationRecommendation } from '@/types/forecast'
import {
  Zap,
  DollarSign,
  Users,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface OptimizationRecommendationsProps {
  recommendations: OptimizationRecommendation[]
  onApply?: (recommendationIds: string[]) => void
  onApplyAll?: () => void
}

export function OptimizationRecommendations({
  recommendations,
  onApply,
  onApplyAll,
}: OptimizationRecommendationsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === recommendations.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(recommendations.map((r) => r.id))
    }
  }

  const handleApplySelected = () => {
    if (selectedIds.length > 0) {
      onApply?.(selectedIds)
      setSelectedIds([])
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'budget':
        return <DollarSign className="h-5 w-5" />
      case 'audience':
        return <Users className="h-5 w-5" />
      case 'timing':
        return <Clock className="h-5 w-5" />
      case 'content':
        return <FileText className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
        }
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
        }
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
          badge: 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
        }
    }
  }

  const highPriorityCount = recommendations.filter((r) => r.priority === 'high').length
  const actionRequiredCount = recommendations.filter((r) => r.action_required).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-lg font-semibold">AI Recommendations</CardTitle>
            <Badge variant="outline" className="ml-2">
              {recommendations.length} Total
            </Badge>
            {highPriorityCount > 0 && (
              <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                {highPriorityCount} High Priority
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedIds.length === recommendations.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedIds.length > 0 && (
              <Button size="sm" onClick={handleApplySelected}>
                Apply Selected ({selectedIds.length})
              </Button>
            )}
            {selectedIds.length === 0 && (
              <Button size="sm" onClick={onApplyAll}>
                Apply All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">All campaigns are optimized!</p>
            <p className="text-xs mt-1">No recommendations at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const styles = getPriorityStyles(rec.priority)
              const isSelected = selectedIds.includes(rec.id)

              return (
                <div
                  key={rec.id}
                  className={cn(
                    'border rounded-lg p-4 transition-all hover:shadow-md',
                    styles.bg,
                    isSelected && 'ring-2 ring-purple-500 dark:ring-purple-400'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(rec.id)}
                      className="mt-1"
                    />

                    <div className={cn('mt-0.5 flex-shrink-0', styles.icon)}>
                      {getTypeIcon(rec.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {rec.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className={cn('text-xs', styles.badge)}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                          {rec.action_required && (
                            <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Action Needed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {rec.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {rec.type}
                          </Badge>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Expected: {rec.expected_impact}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {actionRequiredCount > 0 && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  {actionRequiredCount} recommendation{actionRequiredCount > 1 ? 's' : ''} require{actionRequiredCount === 1 ? 's' : ''} immediate action
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  These changes can significantly improve your campaign performance. Review and apply them as soon as possible.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
