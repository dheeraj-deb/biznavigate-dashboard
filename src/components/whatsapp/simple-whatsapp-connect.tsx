'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Info,
  Loader2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Phone,
} from 'lucide-react'

type ConnectionStep = 'intro' | 'embed' | 'success' | 'error'

interface SimpleWhatsAppConnectProps {
  onComplete?: () => void
  businessId: string
}

export function SimpleWhatsAppConnect({ onComplete, businessId }: SimpleWhatsAppConnectProps) {
  const [currentStep, setCurrentStep] = useState<ConnectionStep>('intro')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [embedLink, setEmbedLink] = useState<string | null>(null)
  const [connectedAccount, setConnectedAccount] = useState<{
    phoneNumber: string
    accountId: string
  } | null>(null)

  const handleConnectWithGupshup = async () => {
    setIsLoading(true)
    setError(null)

    if (!businessId) {
      setError('Business ID not found. Please ensure you are logged in.')
      setCurrentStep('error')
      setIsLoading(false)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'
      const token = localStorage.getItem('biznavigate_auth_token')

      if (!token) {
        throw new Error('Not authenticated. Please log in first.')
      }

      const res = await fetch(
        `${apiUrl}/gupshup/onboarding/embed-link?user=${encodeURIComponent(businessId)}&lang=en`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const data = await res.json()

      if (!res.ok || !data?.data?.link) {
        throw new Error(data.message || 'Failed to fetch onboarding link')
      }

      setEmbedLink(data.data.link)
      window.open(data.data.link, '_blank', 'noopener,noreferrer')
      setCurrentStep('embed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding')
      setCurrentStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setCurrentStep('intro')
    setError(null)
    setEmbedLink(null)
  }

  const handleFinish = () => {
    onComplete?.()
  }

  // Called when user indicates they completed the Gupshup flow in the iframe
  const handleEmbedComplete = () => {
    // Backend webhook will receive WABA details from Gupshup.
    // Show success screen — actual account data will be populated by the webhook.
    setConnectedAccount({ phoneNumber: '—', accountId: '—' })
    setCurrentStep('success')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {currentStep === 'intro' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-950 dark:to-blue-950/20 shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-4 shadow-lg">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Connect WhatsApp in 2 Clicks
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Automate your customer conversations with WhatsApp Business. No technical setup required.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 mb-3">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Instant Setup</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connect in under 60 seconds</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950 mb-3">
                  <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Auto-Configure</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">We handle all the technical stuff</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 mb-3">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">100% Secure</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bank-level encryption</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                How it works:
              </h4>
              <div className="space-y-3">
                {[
                  'Click "Connect WhatsApp" below',
                  'Complete the WhatsApp Business signup in the panel that appears',
                  'Done! Start messaging customers instantly',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>Don&apos;t have WhatsApp Business yet?</strong> No problem! You can create one directly in the signup panel.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 mb-6">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 dark:text-red-100">{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={handleConnectWithGupshup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Connect WhatsApp
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                The signup panel will appear right here — no popups or redirects
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'embed' && embedLink && (
        <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950 shadow-xl">
          <CardContent className="pt-10 pb-10">
            <div className="text-center mb-8">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-4 shadow-lg">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Complete WhatsApp Business Signup
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                A new tab has opened with the signup form. Complete the steps there, then come back and click the button below.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
              <div className="space-y-3">
                {[
                  'Fill in your WhatsApp Business details in the new tab',
                  'Verify your phone number when prompted',
                  'Return here and click "I\'ve completed signup"',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleRetry}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(embedLink, '_blank', 'noopener,noreferrer')}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Reopen signup tab
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleEmbedComplete}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                I&apos;ve completed signup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'error' && (
        <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-gray-950 shadow-xl">
          <CardContent className="pt-10 pb-10">
            <div className="text-center mb-8">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 mb-4">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Connection Failed</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6">
                {error || 'Something went wrong while connecting to WhatsApp'}
              </p>

              <Button size="lg" variant="outline" onClick={handleRetry}>
                <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'success' && connectedAccount && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-950 dark:to-green-950/20 shadow-xl">
          <CardContent className="pt-10 pb-10">
            <div className="text-center mb-8">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-4 shadow-xl animate-pulse">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">You&apos;re All Set!</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Your WhatsApp Business signup is complete. We&apos;ll activate your account shortly.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-3">
                  <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Signup Complete</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Account being activated</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">AI Enabled</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Auto-replies active</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 mb-3">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Ready to Go</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start messaging now</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                What happens now?
              </h4>
              <div className="space-y-3">
                {[
                  {
                    title: 'Customers can message you',
                    desc: 'Anyone who messages your WhatsApp number will get instant AI-powered responses',
                  },
                  {
                    title: 'Leads are captured automatically',
                    desc: 'Customer details are saved to your dashboard for follow-up',
                  },
                  {
                    title: 'You stay in control',
                    desc: 'View all conversations, take over chats, and customize responses anytime',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 bg-white dark:bg-gray-900 p-4 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 mb-6">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>Test it now:</strong> Send a message to your WhatsApp number from another phone to see the magic happen!
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={handleFinish}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
