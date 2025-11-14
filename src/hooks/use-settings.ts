import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// Types
export interface UserProfile {
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  created_at: string
  updated_at: string
}

export interface BusinessSettings {
  business_id: string
  business_name: string
  business_email?: string
  business_phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  timezone?: string
  currency?: string
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  email_notifications: boolean
  order_updates: boolean
  lead_notifications: boolean
  low_stock_alerts: boolean
  marketing_emails: boolean
}

export interface UpdateUserProfileDto {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

export interface UpdateBusinessSettingsDto {
  business_name?: string
  business_email?: string
  business_phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  timezone?: string
  currency?: string
}

export interface ChangePasswordDto {
  old_password: string
  new_password: string
}

// ============================================
// USER PROFILE HOOKS
// ============================================

/**
 * Get current user profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile')
      return response.data?.data as UserProfile
    },
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Update user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateUserProfileDto) => {
      const response = await apiClient.put('/users/profile', data)
      return response.data?.data as UserProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update profile'
      toast.error(message)
    },
  })
}

// ============================================
// BUSINESS SETTINGS HOOKS
// ============================================

/**
 * Get business settings
 */
export function useBusinessSettings() {
  return useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/businesses/settings')
      return response.data?.data as BusinessSettings
    },
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Update business settings
 */
export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateBusinessSettingsDto) => {
      const response = await apiClient.put('/businesses/settings', data)
      return response.data?.data as BusinessSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] })
      toast.success('Business settings updated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update business settings'
      toast.error(message)
    },
  })
}

// ============================================
// SECURITY HOOKS
// ============================================

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordDto) => {
      const response = await apiClient.post('/auth/change-password', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to change password'
      toast.error(message)
    },
  })
}

// ============================================
// NOTIFICATION PREFERENCES HOOKS
// ============================================

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/users/notification-preferences')
      return response.data?.data as NotificationPreferences
    },
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const response = await apiClient.put('/users/notification-preferences', data)
      return response.data?.data as NotificationPreferences
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.success('Notification preferences updated')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update preferences'
      toast.error(message)
    },
  })
}
