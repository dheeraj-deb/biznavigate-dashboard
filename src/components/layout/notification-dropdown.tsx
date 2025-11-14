'use client'

import { useState } from 'react'
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useRecentNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  getNotificationColor,
  getRelativeTime,
  type Notification,
} from '@/hooks/use-notifications'
import Link from 'next/link'

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)

  // Fetch data - Auto-refreshes every 15-30 seconds
  const { data: notifications = [], isLoading } = useRecentNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()

  // Mutations
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    markAsRead.mutate(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteNotification.mutate(notificationId)
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      markAsRead.mutate(notification.notification_id)
    }
    // Close dropdown
    setOpen(false)
    // Navigate if has action URL
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <DropdownMenuLabel className="p-0 font-semibold">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </>
              )}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.notification_id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="px-2 py-2">
              <Link href="/notifications" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-center text-sm">
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Individual notification item component
interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onClick: () => void
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const colorClass = getNotificationColor(notification)
  const relativeTime = getRelativeTime(notification.created_at)

  return (
    <div
      className={`
        group relative px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors
        ${!notification.is_read ? 'bg-primary/5' : ''}
      `}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
      )}

      <div className="flex gap-3 ml-4">
        {/* Icon */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Bell className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {notification.message}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => onMarkAsRead(notification.notification_id, e)}
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => onDelete(notification.notification_id, e)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-muted-foreground">{relativeTime}</span>
            {notification.priority === 'urgent' && (
              <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                Urgent
              </Badge>
            )}
            {notification.priority === 'high' && (
              <Badge className="h-4 px-1 text-[10px] bg-orange-500">
                High
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
