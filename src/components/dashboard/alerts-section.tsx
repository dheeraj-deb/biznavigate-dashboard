'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardAlert } from '@/types'
import { AlertCircle, AlertTriangle, Info, CheckCircle, ArrowRight, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'

interface AlertsSectionProps {
  alerts: DashboardAlert[]
  onDismiss?: (alertId: string) => void
}

export function AlertsSection({ alerts, onDismiss }: AlertsSectionProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id))

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
    onDismiss?.(alertId)
  }

  const getIcon = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'error':
        return AlertCircle
      case 'warning':
        return AlertTriangle
      case 'success':
        return CheckCircle
      default:
        return Info
    }
  }

  const getSeverityColor = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900'
      case 'success':
        return 'text-green-600 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900'
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
    }
  }

  const getBadgeVariant = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'success':
        return 'default'
      default:
        return 'outline'
    }
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications & Alerts</CardTitle>
          <CardDescription>Stay informed about critical updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm font-medium">All clear!</p>
            <p className="text-sm text-muted-foreground">No alerts at this time</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group alerts by severity
  const criticalAlerts = visibleAlerts.filter((a) => a.severity === 'error')
  const warningAlerts = visibleAlerts.filter((a) => a.severity === 'warning')
  const infoAlerts = visibleAlerts.filter((a) => a.severity === 'info' || a.severity === 'success')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notifications & Alerts</CardTitle>
            <CardDescription>
              {criticalAlerts.length > 0 && `${criticalAlerts.length} critical, `}
              {warningAlerts.length > 0 && `${warningAlerts.length} warnings, `}
              {infoAlerts.length > 0 && `${infoAlerts.length} updates`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive">{criticalAlerts.length}</Badge>
            )}
            {warningAlerts.length > 0 && (
              <Badge variant="secondary">{warningAlerts.length}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleAlerts.map((alert) => {
            const Icon = getIcon(alert.severity)
            const colorClass = getSeverityColor(alert.severity)

            return (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${colorClass} transition-all`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.title}</p>
                        <p className="text-sm opacity-90">{alert.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-background/20"
                        onClick={() => handleDismiss(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <time className="text-xs opacity-75">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </time>
                      {alert.actionLabel && alert.actionHref && (
                        <Link href={alert.actionHref}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-background/20">
                            {alert.actionLabel}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
