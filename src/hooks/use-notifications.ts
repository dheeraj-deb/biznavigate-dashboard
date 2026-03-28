import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// Types
export interface Notification {
  notification_id: string
  user_id: string
  business_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'lead' | 'inventory'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_read: boolean
  action_url?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  read_at?: string
}

export interface NotificationResponse {
  data: Notification[]
  meta: {
    total: number
    page: number
    limit: number
    unread_count: number
  }
}

export interface NotificationFilters {
  type?: string
  is_read?: boolean
  priority?: string
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'priority'
  sort_order?: 'asc' | 'desc'
}

// ============================================
// NOTIFICATION LIST HOOKS
// ============================================

/**
 * Get notifications list with filters
 * Supports pagination, filtering, and sorting
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const response = await apiClient.get('/notifications', {
        params: {
          ...filters,
          limit: filters?.limit || 10,
          page: filters?.page || 1,
          sort_by: filters?.sort_by || 'created_at',
          sort_order: filters?.sort_order || 'desc',
        }
      })
      return response.data as NotificationResponse
    },
    retry: 1,
    retryDelay: 1000,
    refetchInterval: 30000, // Auto-refresh every 30 seconds for real-time feel
    refetchIntervalInBackground: false, // Don't refresh when tab is not active
  })
}

/**
 * Get unread notifications count
 * Polls frequently for real-time badge updates
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/unread')
      return response.data?.data?.count || 0
    },
    retry: 1,
    retryDelay: 1000,
    refetchInterval: 15000, // Refresh every 15 seconds for real-time badge
    refetchIntervalInBackground: false,
    staleTime: 10000, // Consider data stale after 10 seconds
  })
}

/**
 * Get recent notifications (for dropdown)
 * Limited to 5 most recent
 */
export function useRecentNotifications() {
  return useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications', {
        params: {
          limit: 5,
          sort_by: 'created_at',
          sort_order: 'desc',
        }
      })
      return (response.data?.data || []) as Notification[]
    },
    retry: 1,
    retryDelay: 1000,
    refetchInterval: 20000, // Refresh every 20 seconds
    refetchIntervalInBackground: false,
  })
}

/**
 * Get single notification by ID
 */
export function useNotification(id: string) {
  return useQuery({
    queryKey: ['notifications', id],
    queryFn: async () => {
      const response = await apiClient.get(`/notifications/${id}`)
      return response.data?.data as Notification
    },
    enabled: !!id,
    retry: 1,
    retryDelay: 1000,
  })
}

// ============================================
// NOTIFICATION ACTION HOOKS
// ============================================

/**
 * Mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch(`/notifications/${notificationId}/read`)
      return response.data?.data as Notification
    },
    onMutate: async (notificationId) => {
      // Optimistic update - mark as read immediately
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      const previousData = queryClient.getQueryData(['notifications', 'recent'])

      // Update notification in cache
      queryClient.setQueryData(['notifications', 'recent'], (old: any) => {
        if (!old) return old
        return old.map((notif: Notification) =>
          notif.notification_id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      })

      // Decrement unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => {
        return Math.max(0, (old || 0) - 1)
      })

      return { previousData }
    },
    onSuccess: () => {
      // Invalidate to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', 'recent'], context.previousData)
      }
      const message = error.response?.data?.message || 'Failed to mark notification as read'
      toast.error(message)
    },
  })
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/notifications/mark-all-read')
      return response.data
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      const previousData = queryClient.getQueryData(['notifications', 'recent'])

      queryClient.setQueryData(['notifications', 'recent'], (old: any) => {
        if (!old) return old
        return old.map((notif: Notification) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      })

      queryClient.setQueryData(['notifications', 'unread-count'], 0)

      return { previousData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', 'recent'], context.previousData)
      }
      const message = error.response?.data?.message || 'Failed to mark all as read'
      toast.error(message)
    },
  })
}

/**
 * Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete(`/notifications/${notificationId}`)
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      const previousData = queryClient.getQueryData(['notifications', 'recent'])

      queryClient.setQueryData(['notifications', 'recent'], (old: any) => {
        if (!old) return old
        return old.filter((notif: Notification) => notif.notification_id !== notificationId)
      })

      return { previousData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification deleted')
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', 'recent'], context.previousData)
      }
      const message = error.response?.data?.message || 'Failed to delete notification'
      toast.error(message)
    },
  })
}

/**
 * Create notification (for testing or admin)
 */
export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Notification>) => {
      const response = await apiClient.post('/notifications', data)
      return response.data?.data as Notification
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification created')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create notification'
      toast.error(message)
    },
  })
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: Notification['type']) {
  const icons = {
    info: 'Info',
    success: 'CheckCircle',
    warning: 'AlertTriangle',
    error: 'XCircle',
    order: 'ShoppingCart',
    lead: 'Users',
    inventory: 'Package',
  }
  return icons[type] || 'Bell'
}

/**
 * Get notification color based on type and priority
 */
export function getNotificationColor(notification: Notification) {
  if (notification.priority === 'urgent') return 'text-red-600 bg-red-50'
  if (notification.priority === 'high') return 'text-blue-600 bg-blue-50'

  const colors = {
    info: 'text-blue-600 bg-blue-50',
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
    order: 'text-purple-600 bg-purple-50',
    lead: 'text-blue-600 bg-blue-50',
    inventory: 'text-blue-600 bg-blue-50',
  }
  return colors[notification.type] || 'text-gray-600 bg-gray-50'
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return date.toLocaleDateString()
}
