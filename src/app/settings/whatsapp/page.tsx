'use client'

import { useState, useEffect, Suspense } from 'react'
import { useWhatsAppAccounts, useDisconnectWhatsAppAccount } from '@/hooks/use-whatsapp-account'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Trash2,
  Phone,
  Zap,
  Settings,
  Shield,
} from 'lucide-react'
import { WhatsAppOnboardingWizard } from '@/components/whatsapp/whatsapp-onboarding-wizard'
import { SimpleWhatsAppConnect } from '@/components/whatsapp/simple-whatsapp-connect'
import { useAuthStore } from '@/store/auth-store'

// Mock data for connected WhatsApp Business account
const mockWhatsAppAccount = {
  account_id: '1',
  phone_number: '+919876543210',
  display_name: 'BizNavigate Store',
  quality_rating: 'GREEN',
  messaging_limit_tier: 'TIER_1K',
  is_verified: true,
  is_active: true,
  webhook_verified: true,
  last_message_at: new Date('2024-12-22T10:30:00'),
  created_at: new Date('2024-01-15'),
  api_key_id: 'waba_xxxxxxxxxxxxxxxxxx',
}

// Mock settings
const mockSettings = {
  auto_reply_enabled: true,
  auto_reply_message: 'Thanks for contacting us! We will get back to you shortly.',
  business_hours_only: false,
  business_hours: {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '09:00', end: '18:00' },
    sunday: { enabled: false, start: '09:00', end: '18:00' },
  },
  away_message: 'We are currently away. Please leave a message and we will respond during business hours.',
  lead_capture_enabled: true,
  order_notifications_enabled: true,
  payment_reminders_enabled: true,
}

export default function WhatsAppSettingsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <WhatsAppSettingsPage />
    </Suspense>
  )
}

function WhatsAppSettingsPage() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [useSimpleConnect, setUseSimpleConnect] = useState(true) // Toggle between simple and advanced
  const [settings, setSettings] = useState(mockSettings)
  const [activeTab, setActiveTab] = useState('overview')

  // Get businessId from authenticated user
  const businessId = user?.business_id || ''

  // Fetch WhatsApp accounts via hook
  const {
    data: whatsappData,
    isLoading,
    refetch: refetchAccounts,
  } = useWhatsAppAccounts(businessId)

  const account = whatsappData?.account ?? null
  const isConnected = whatsappData?.isConnected ?? false

  const disconnectMutation = useDisconnectWhatsAppAccount(businessId)

  // Check for OAuth callback success and show onboarding if needed
  useEffect(() => {
    // Wait for initial loading to complete before checking OAuth callback
    if (isLoading) return

    const success = searchParams.get('success')
    const accountId = searchParams.get('accountId')

    if (success === 'true' && accountId) {
      // OAuth was successful, show the onboarding success screen
      // Only show if not already connected
      if (!isConnected && !account) {
        setShowOnboarding(true)
      }
    }
  }, [searchParams, isConnected, account, isLoading])

  const handleCopyWebhookUrl = () => {
    if (!account) return
    const webhookUrl = `https://api.biznavigate.com/webhooks/whatsapp/${account.account_id}`
    navigator.clipboard.writeText(webhookUrl)
  }

  const handleDisconnect = async () => {
    if (!account) return
    disconnectMutation.mutate(account.account_id)
  }

  const handleStartOnboarding = () => {
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false)

    // Clear URL params
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/settings/whatsapp')
    }

    // Refetch accounts to show newly connected account
    await refetchAccounts()
  }

  const handleOnboardingCancel = () => {
    setShowOnboarding(false)
  }

  const qualityRatingConfig = {
    GREEN: { label: 'High Quality', color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
    YELLOW: { label: 'Medium Quality', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' },
    RED: { label: 'Low Quality', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
  }

  const tierLimits = {
    TIER_50: '50 unique users / 24h',
    TIER_250: '250 unique users / 24h',
    TIER_1K: '1,000 unique users / 24h',
    TIER_10K: '10,000 unique users / 24h',
    TIER_100K: '100,000 unique users / 24h',
    TIER_UNLIMITED: 'Unlimited',
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">WhatsApp Integration</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Connect and configure WhatsApp Business API for automated messaging
            </p>
          </div>
        </div>

        {isLoading ? (
          /* Loading State */
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading WhatsApp account...</p>
              </div>
            </CardContent>
          </Card>
        ) : !businessId ? (
          /* No Business ID - Show Error */
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Business Account Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You need to be associated with a business account to connect WhatsApp.
                  Please contact your administrator or create a business account first.
                </p>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : showOnboarding ? (
          /* Connection Flow - Simple or Advanced */
          useSimpleConnect ? (
            <SimpleWhatsAppConnect
              onComplete={handleOnboardingComplete}
              businessId={businessId}
            />
          ) : (
            <WhatsAppOnboardingWizard
              onComplete={handleOnboardingComplete}
              onCancel={handleOnboardingCancel}
            />
          )
        ) : !isConnected ? (
          /* Connection Card - Not Connected */
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-950 dark:to-blue-950/20 shadow-lg">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-4 shadow-lg">
                  <MessageSquare className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Connect WhatsApp Business
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Automate customer conversations and capture leads 24/7 with WhatsApp Business API
                </p>
              </div>

              {/* Benefits */}
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 mb-3">
                    <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Auto-Reply 24/7</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Respond instantly to every customer</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950 mb-3">
                    <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Smart Lead Capture</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Save customer details automatically</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 mb-3">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Verified Business</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Build trust with green badge</p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  onClick={handleStartOnboarding}
                >
                  <MessageSquare className="mr-2 h-6 w-6" />
                  Connect in 2 Clicks
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Takes less than 60 seconds • No technical knowledge required
                </p>
                <button
                  onClick={() => setUseSimpleConnect(false)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Need manual setup? Click here for advanced options
                </button>
              </div>
            </CardContent>
          </Card>
        ) : account && isConnected ? (
          /* Connected State - Tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Account Status Card */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Connected Account
                      </CardTitle>
                      <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                        Your WhatsApp Business API account details
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Account Info */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 flex-shrink-0">
                        <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Phone Number</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{account.phone_number}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{account.display_name}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 flex-shrink-0">
                        <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Account Status</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {account.is_verified && (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                          <Badge className={qualityRatingConfig[account.quality_rating as keyof typeof qualityRatingConfig].color}>
                            {qualityRatingConfig[account.quality_rating as keyof typeof qualityRatingConfig].label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messaging Limits */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Messaging Limits</h3>
                      <Badge variant="outline">{account.messaging_limit_tier}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Current limit: {tierLimits[account.messaging_limit_tier as keyof typeof tierLimits]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Your tier automatically upgrades as you maintain high quality conversations and phone number verification
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Status
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Disconnect
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect WhatsApp Business?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to disconnect your WhatsApp Business account? You will lose access to:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Automated messaging</li>
                              <li>Lead capture from WhatsApp</li>
                              <li>Order and payment notifications</li>
                              <li>Message history and analytics</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-6">
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Automation Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Configure automated responses and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Auto Reply */}
                  <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-reply" className="text-base font-semibold">Auto-Reply Messages</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Send automatic welcome message to new contacts</p>
                      </div>
                      <Switch
                        id="auto-reply"
                        checked={settings.auto_reply_enabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, auto_reply_enabled: checked })}
                      />
                    </div>
                    {settings.auto_reply_enabled && (
                      <div>
                        <Label htmlFor="auto-reply-message">Welcome Message</Label>
                        <Input
                          id="auto-reply-message"
                          value={settings.auto_reply_message}
                          onChange={(e) => setSettings({ ...settings, auto_reply_message: e.target.value })}
                          placeholder="Enter your auto-reply message"
                        />
                      </div>
                    )}
                  </div>

                  {/* Lead Capture */}
                  <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                      <Label htmlFor="lead-capture" className="text-base font-semibold">Lead Capture</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Automatically create leads from new conversations</p>
                    </div>
                    <Switch
                      id="lead-capture"
                      checked={settings.lead_capture_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, lead_capture_enabled: checked })}
                    />
                  </div>

                  {/* Order Notifications */}
                  <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                      <Label htmlFor="order-notifications" className="text-base font-semibold">Order Notifications</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Send order confirmations and updates via WhatsApp</p>
                    </div>
                    <Switch
                      id="order-notifications"
                      checked={settings.order_notifications_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, order_notifications_enabled: checked })}
                    />
                  </div>

                  {/* Payment Reminders */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="payment-reminders" className="text-base font-semibold">Payment Reminders</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Send automated payment reminders for pending orders</p>
                    </div>
                    <Switch
                      id="payment-reminders"
                      checked={settings.payment_reminders_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, payment_reminders_enabled: checked })}
                    />
                  </div>

                  <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                    Save Automation Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-6">
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Webhook Configuration
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Configure webhooks to receive real-time updates from WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Webhook Status */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="font-semibold text-green-900 dark:text-green-100">Webhook Verified</div>
                        <div className="text-sm text-green-700 dark:text-green-400">Successfully receiving messages and updates</div>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white">Active</Badge>
                  </div>

                  {/* Webhook URL */}
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={`https://api.biznavigate.com/webhooks/whatsapp/${account.account_id}`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="sm" onClick={handleCopyWebhookUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Add this URL in your Meta App Dashboard webhook configuration
                    </p>
                  </div>

                  {/* Verify Token */}
                  <div className="space-y-2">
                    <Label>Verify Token</Label>
                    <div className="flex items-center gap-2">
                      <Input value="biznavigate_verify_token_2024" readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Use this token when verifying your webhook in Meta App Dashboard
                    </p>
                  </div>

                  {/* Subscribed Events */}
                  <div className="space-y-3">
                    <Label>Subscribed Events</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['messages', 'message_status', 'messaging_conversations', 'message_template_status_update'].map((event) => (
                        <Badge key={event} variant="outline" className="justify-center py-2">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Test Webhook
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Meta Developer Console
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Advanced Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Configure advanced WhatsApp Business features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* API Credentials */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">API Credentials</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Phone Number ID</Label>
                        <div className="flex items-center gap-2">
                          <Input value={account.api_key_id} readOnly className="font-mono text-sm" />
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Access Token</Label>
                        <div className="flex items-center gap-2">
                          <Input type="password" value="EAAxxxxxxxxxxxxxxxxxx" readOnly className="font-mono text-sm" />
                          <Button variant="outline" size="sm">
                            Show
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-4 pt-6 border-t border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-5 w-5" />
                      <h3 className="font-semibold">Danger Zone</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                        <div>
                          <div className="font-semibold text-red-900 dark:text-red-100">Reset Webhook Secret</div>
                          <div className="text-sm text-red-700 dark:text-red-400">Generate a new webhook verification token</div>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700">
                          Reset
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                        <div>
                          <div className="font-semibold text-red-900 dark:text-red-100">Delete All Message History</div>
                          <div className="text-sm text-red-700 dark:text-red-400">Permanently delete all WhatsApp conversations</div>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}

        {/* Help Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <p>• WhatsApp Business API requires approval from Meta</p>
            <p>• Access tokens expire every 60 days and need to be refreshed</p>
            <p>• Make sure your webhook URL is publicly accessible and uses HTTPS</p>
            <p>• Quality rating affects your messaging limits - maintain high quality conversations</p>
            <p>• For detailed setup instructions, visit the Meta Business Platform documentation</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
