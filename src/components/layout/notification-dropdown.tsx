'use client'

import { useState } from 'react'
import { Bell, X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardAlert } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface NotificationDropdownProps {
  alerts: DashboardAlert[]
  onDismiss?: (alertId: string) => void
}

export function NotificationDropdown({ alerts, onDismiss }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id))
  const unreadCount = visibleAlerts.length

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border bg-popover shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount === 0
                    ? 'All caught up!'
                    : `You have ${unreadCount} notification${unreadCount !== 1 ? 's' : ''}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[480px] overflow-y-auto">
              {visibleAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="mb-3 h-12 w-12 text-green-500" />
                  <p className="text-sm font-medium">All clear!</p>
                  <p className="text-xs text-muted-foreground">No notifications at this time</p>
                </div>
              ) : (
                <div className="divide-y">
                  {visibleAlerts.map((alert) => {
                    const Icon = getIcon(alert.severity)
                    const colorClass = getSeverityColor(alert.severity)

                    return (
                      <div
                        key={alert.id}
                        className="group relative px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${colorClass}`} />
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1">{alert.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {alert.message}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDismiss(alert.id, e)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <time className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(alert.createdAt), {
                                  addSuffix: true,
                                })}
                              </time>
                              {alert.actionLabel && alert.actionHref && (
                                <Link
                                  href={alert.actionHref}
                                  onClick={() => setIsOpen(false)}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                  >
                                    {alert.actionLabel}
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
              )}
            </div>

            {visibleAlerts.length > 0 && (
              <div className="border-t px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    visibleAlerts.forEach((alert) => {
                      setDismissedAlerts((prev) => new Set([...prev, alert.id]))
                    })
                    setIsOpen(false)
                  }}
                >
                  Clear all notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
