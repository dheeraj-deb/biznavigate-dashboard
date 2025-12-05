'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Bell, Lock, Palette, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  useUserProfile,
  useUpdateUserProfile,
  useBusinessSettings,
  useUpdateBusinessSettings,
  useChangePassword,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-settings'

export default function SettingsPage() {
  // Fetch data
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfile()
  const { data: businessSettings, isLoading: businessLoading, error: businessError } = useBusinessSettings()
  const { data: notificationPrefs, isLoading: notifLoading, error: notifError } = useNotificationPreferences()

  // Mutations
  const updateProfile = useUpdateUserProfile()
  const updateBusiness = useUpdateBusinessSettings()
  const changePassword = useChangePassword()
  const updateNotifications = useUpdateNotificationPreferences()

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    order_updates: true,
    lead_notifications: true,
    low_stock_alerts: true,
  })

  // Load user profile data into form
  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
      })
    }
  }, [userProfile])

  // Load notification preferences
  useEffect(() => {
    if (notificationPrefs) {
      setNotifications({
        email_notifications: notificationPrefs.email_notifications ?? true,
        order_updates: notificationPrefs.order_updates ?? true,
        lead_notifications: notificationPrefs.lead_notifications ?? true,
        low_stock_alerts: notificationPrefs.low_stock_alerts ?? true,
      })
    }
  }, [notificationPrefs])

  // Handlers
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate(profileForm)
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    return errors
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const errors: string[] = []

    if (!passwordForm.old_password) {
      errors.push('Current password is required')
    }

    if (!passwordForm.new_password) {
      errors.push('New password is required')
    } else {
      const passwordValidationErrors = validatePassword(passwordForm.new_password)
      errors.push(...passwordValidationErrors)
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.push('Passwords do not match')
    }

    if (errors.length > 0) {
      setPasswordErrors(errors)
      return
    }

    setPasswordErrors([])
    changePassword.mutate({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    }, {
      onSuccess: () => {
        setPasswordForm({
          old_password: '',
          new_password: '',
          confirm_password: '',
        })
      }
    })
  }

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    const newPrefs = {
      ...notifications,
      [key]: !notifications[key],
    }
    setNotifications(newPrefs)
    updateNotifications.mutate(newPrefs)
  }

  // Loading state
  if (profileLoading || businessLoading || notifLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const hasErrors = profileError || businessError || notifError

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Error Alert */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some settings could not be loaded from the backend. Please ensure the backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile Settings</CardTitle>
              </div>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.email_notifications}
                  onCheckedChange={() => handleNotificationToggle('email_notifications')}
                  disabled={updateNotifications.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about order status changes
                  </p>
                </div>
                <Switch
                  checked={notifications.order_updates}
                  onCheckedChange={() => handleNotificationToggle('order_updates')}
                  disabled={updateNotifications.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lead Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for new leads and updates
                  </p>
                </div>
                <Switch
                  checked={notifications.lead_notifications}
                  onCheckedChange={() => handleNotificationToggle('lead_notifications')}
                  disabled={updateNotifications.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when products are low in stock
                  </p>
                </div>
                <Switch
                  checked={notifications.low_stock_alerts}
                  onCheckedChange={() => handleNotificationToggle('low_stock_alerts')}
                  disabled={updateNotifications.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {passwordErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize the look and feel (Flexfolio Light Theme Active)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <Button variant="default" className="bg-primary">
                    Light (Active)
                  </Button>
                  <Button variant="outline" disabled>
                    Dark (Coming Soon)
                  </Button>
                  <Button variant="outline" disabled>
                    System (Coming Soon)
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Currently using Flexfolio Light theme with blue accents
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
