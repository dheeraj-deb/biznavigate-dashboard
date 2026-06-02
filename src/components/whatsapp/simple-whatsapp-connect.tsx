'use client'

import { useState, useEffect, useRef } from 'react'
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
import { useWhatsAppAccounts, useGupshupPipelineStatus, whatsappKeys } from '@/hooks/use-whatsapp-account'
import { useQueryClient } from '@tanstack/react-query'

// Extend window with FB SDK type
declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: {
      init: (options: { appId: string; version: string; autoLogAppEvents?: boolean; xfbml?: boolean }) => void
      login: (callback: (response: FBLoginResponse) => void, options: FBLoginOptions) => void
    }
  }
}

interface FBLoginResponse {
  authResponse?: {
    code: string
    userID: string
  }
  status: string
}

interface FBLoginOptions {
  config_id: string
  response_type: string
  override_default_response_type: boolean
  extras: {
    setup: Record<string, unknown>
    featureType: string
    sessionInfoVersion: string
  }
}

type EmbeddedSignupData = {
  waba_id?: string
  phone_number_id?: string
  whatsapp_business_id?: string
  business_id?: string
}

const EMBEDDED_SIGNUP_CONFIG_ID = process.env.NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID || ''
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || ''
const META_SOLUTION_ID = process.env.NEXT_PUBLIC_META_SOLUTION_ID || ''

const EMBEDDED_SIGNUP_SUCCESS_EVENTS = new Set([
  'FINISH',
  'FINISH_ONLY_WABA',
  'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
  'FINISH_GRANT_ONLY_API_ACCESS',
  'FINISH_OBO_MIGRATION',
])

type ConnectionStep = 'intro' | 'connecting' | 'provisioning' | 'stuck' | 'success' | 'error'

interface SimpleWhatsAppConnectProps {
  onComplete?: () => void
  businessId: string
  businessType?: string
}

export function SimpleWhatsAppConnect({ onComplete, businessId, businessType }: SimpleWhatsAppConnectProps) {
  const queryClient = useQueryClient()
  const { data, refetch } = useWhatsAppAccounts(businessId)
  const { account, isConnected, isPending, isStuck, hasError } = data || { account: null, isConnected: false, isPending: false, isStuck: false, hasError: false }

  // Track provisioning state
  const { data: pipelineData } = useGupshupPipelineStatus(account?.gupshup_app_id)

  const [currentStep, setCurrentStep] = useState<ConnectionStep>('intro')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use a ref for eventData to avoid stale closures in the FB login callback
  const eventDataRef = useRef<{ whatsapp_business_id: string, phone_number_id: string, waba_id: string } | null>(null)
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null)

  // Sync state with hooks
  useEffect(() => {
    if (isConnected && currentStep !== 'success') {
      setCurrentStep('success')
    } else if (isStuck && currentStep !== 'stuck') {
      setCurrentStep('stuck')
    } else if (hasError && currentStep !== 'error') {
      setCurrentStep('error')
    } else if (isPending && currentStep !== 'provisioning') {
      setCurrentStep('provisioning')
    } else if (!isConnected && !isPending && !isStuck && !hasError && (currentStep === 'success' || currentStep === 'provisioning' || currentStep === 'stuck')) {
      setCurrentStep('intro')
    }
  }, [isConnected, isPending, isStuck, hasError, currentStep])

  // Invalidate queries when pipeline completes
  useEffect(() => {
    if (pipelineData?.whatsapp?.creationStage === 'WHATSAPP_PROVISIONING_DONE') {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.all })
    }
  }, [pipelineData?.whatsapp?.creationStage, queryClient])

  // Listen for Meta Embedded Signup message events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("event =====>", event.data)
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP' && EMBEDDED_SIGNUP_SUCCESS_EVENTS.has(data.event)) {
          const connecedData = data.data;
          console.log('message event: ', connecedData);
          eventDataRef.current = {
            whatsapp_business_id: connecedData.business_id,
            phone_number_id: connecedData.phone_number_id,
            waba_id: connecedData.waba_id,
          }
        }
      } catch {
        // Ignore parsing errors for other messages
      }
    };

    listenerRef.current = handleMessage;
    window.addEventListener('message', handleMessage);

    return () => {
      if (listenerRef.current) {
        window.removeEventListener('message', listenerRef.current)
      }
    }
  }, [])

  // Load Facebook JS SDK
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) return

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v25.0'
      })
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [])

  const handleConnectWithMeta = () => {
    setIsLoading(true)
    setError(null)
    eventDataRef.current = null // Reset

    if (!businessId) {
      setError('Business ID not found. Please ensure you are logged in.')
      setCurrentStep('error')
      setIsLoading(false)
      return
    }

    if (!window.FB) {
      setError('Facebook SDK failed to load. Please refresh the page and try again.')
      setCurrentStep('error')
      setIsLoading(false)
      return
    }

    if (!EMBEDDED_SIGNUP_CONFIG_ID) {
      setError('Configuration error: Missing NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID. Please set it in .env.local.')
      setCurrentStep('error')
      setIsLoading(false)
      return
    }

    if (!META_SOLUTION_ID) {
      setError('Configuration error: Missing NEXT_PUBLIC_META_SOLUTION_ID. Please set it in .env.local.')
      setCurrentStep('error')
      setIsLoading(false)
      return
    }

    setCurrentStep('connecting')

    const handleOAuthResponse = async (response: FBLoginResponse) => {
      console.log('FB Login Response:', response)
      if (!response.authResponse?.code) {
        setError('Authorization was cancelled or failed. Please try again.')
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

        const eventData = (eventDataRef.current || {}) as EmbeddedSignupData
        const fallbackData = ((response.authResponse as any)?.setup || {}) as EmbeddedSignupData

        const payloadData = {
          waba_id: eventData.waba_id || fallbackData.waba_id || '',
          phone_number_id: eventData.phone_number_id || fallbackData.phone_number_id || '',
          whatsapp_business_id: eventData.whatsapp_business_id || fallbackData.whatsapp_business_id || fallbackData.business_id || '',
        }

        console.log('Event Data from message ref: ==>', eventData)
        console.log('Data to send to backend: ==>', payloadData)

        const res = await fetch(`${apiUrl}/whatsapp/oauth/embedded-callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: response.authResponse.code,
            businessId,
            ...payloadData,
          }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to connect WhatsApp account')
        }

        // Re-fetch the accounts to get the new pending account
        await refetch()
        setCurrentStep('provisioning')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect')
        setCurrentStep('error')
      } finally {
        setIsLoading(false)
      }
    }

    window.FB.login(
      (response: FBLoginResponse) => { handleOAuthResponse(response) },
      {
        config_id: EMBEDDED_SIGNUP_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {
            solutionID: META_SOLUTION_ID,
          },
          featureType: '',
          sessionInfoVersion: '3',
        },
      },
    )
  }

  const handleRetry = () => {
    setCurrentStep('intro')
    setError(null)
    setIsLoading(false)
  }

  const handleFinish = () => {
    onComplete?.()
  }

  const verificationStatus = account?.business_verification_status ?? 'UNKNOWN'
  const isBusinessVerified = account?.onboarding_status === 'verified' || verificationStatus === 'APPROVED'
  const verificationChecklist = account?.verification_checklist ?? []
  const isProductSeller = businessType === 'products' || businessType === 'retail'

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
                {isProductSeller ? 'Connect WhatsApp Store' : 'Connect WhatsApp'}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                {isProductSeller
                  ? 'Use your existing WhatsApp Business number, then import catalogue products if Meta gives catalogue access.'
                  : 'Automate your customer conversations with WhatsApp Business. No technical setup required.'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 mb-3">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {isProductSeller ? 'Existing Number' : 'Quick Setup'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isProductSeller ? 'Select or create your WABA' : 'Connect through Meta signup'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950 mb-3">
                  <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {isProductSeller ? 'Catalog Check' : 'Auto-Configure'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isProductSeller ? 'We check for products after connect' : 'We handle the technical stuff'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 mb-3">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Meta Approved</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Official embedded signup flow</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                How it works:
              </h4>
              <div className="space-y-3">
                {[
                  'Click "Connect with Meta" below',
                  'A Meta popup opens — authorize BizNavigate and select your WhatsApp Business Account',
                  isProductSeller
                    ? 'After connection, import catalogue products or start with empty inventory'
                    : 'Done. Start messaging customers after provisioning is complete',
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
                <strong>New to WhatsApp Business?</strong> You can create a new setup in the Meta popup.
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 mb-6">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <strong>Already using the WhatsApp Business app?</strong> Select that existing business and number in the Meta popup if it is eligible. Meta may keep the app connected through coexistence, or ask you to migrate the number depending on the account.
              </AlertDescription>
            </Alert>

            {isProductSeller && (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 mb-6">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900 dark:text-amber-100">
                  <strong>Catalogue note:</strong> If Meta returns an existing catalogue, BizNavigo will show an import option on the Products page. If no catalogue is returned, you can still add products manually.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 mb-6">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 dark:text-red-100">{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={handleConnectWithMeta}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Connect with Meta
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                A Meta popup will open — no page redirect required
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'connecting' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950 shadow-xl">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Waiting for Meta authorization...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Complete the steps in the popup window that just opened
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'provisioning' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950 shadow-xl">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Provisioning your WhatsApp Account...
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your account is linked! We are now setting up your cloud infrastructure with our partner.
                This typically takes 2-5 minutes.
              </p>

              <div className="max-w-md mx-auto text-left bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Current Status:</p>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    {pipelineData?.whatsapp?.creationStage
                      ? pipelineData.whatsapp.creationStage.replace(/_/g, ' ')
                      : 'Initializing pipeline...'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'stuck' && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-white dark:bg-gray-950 shadow-xl">
          <CardContent className="pt-10 pb-10">
            <div className="text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950 mb-4">
                <AlertCircle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Setup Requires Attention</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6">
                Your WhatsApp account is linked, but our messaging partner is unable to complete the setup automatically.
                Please contact support to resolve this.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-left max-w-md mx-auto mb-6">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <strong>Reference:</strong> {account?.gupshup_app_id ?? 'N/A'}
                </p>
              </div>
              <Button size="lg" variant="outline" onClick={handleRetry}>
                Try Again
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
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-4">
                {error || 'Something went wrong while connecting to WhatsApp'}
              </p>

              {error?.includes('No phone numbers found') && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6 text-left max-w-2xl mx-auto">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    How to fix this:
                  </h4>
                  <ol className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">1.</span>
                      <span>
                        Go to{' '}
                        <a
                          href="https://business.facebook.com/wa/manage/phone-numbers/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-700"
                        >
                          WhatsApp Manager
                        </a>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">2.</span>
                      <span>Click "Add Phone Number" and follow the verification steps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">3.</span>
                      <span>Come back and click "Try Again" below</span>
                    </li>
                  </ol>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <Button size="lg" variant="outline" onClick={handleRetry}>
                  <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
                  Try Again
                </Button>
                {error?.includes('No phone numbers found') && (
                  <Button size="lg" asChild>
                    <a
                      href="https://business.facebook.com/wa/manage/phone-numbers/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open WhatsApp Manager
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'success' && account && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-950 dark:to-green-950/20 shadow-xl">
          <CardContent className="pt-10 pb-10">
            <div className="text-center mb-8">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-4 shadow-xl animate-pulse">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">You're All Set!</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                {isProductSeller
                  ? 'Your WhatsApp Business is connected. Next, check whether Meta returned a catalogue for import.'
                  : 'Your WhatsApp Business is now connected and ready to automate customer conversations.'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-3">
                  <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Number Active</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{account.display_phone_number || 'Connected'}</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {isProductSeller ? 'Store AI Ready' : 'AI Enabled'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isProductSeller ? 'Product replies ready' : 'Auto-replies active'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 mb-3">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {isProductSeller ? 'Inventory Next' : 'Ready to Go'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isProductSeller ? 'Import or add products' : 'Start messaging now'}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                What happens now?
              </h4>
              <div className="space-y-3">
                {[
                  isProductSeller
                    ? {
                      title: 'Import products if available',
                      desc: 'If Meta exposes your WhatsApp catalogue, the Products page will show an import button.',
                    }
                    : {
                      title: 'Customers can message you',
                      desc: 'Anyone who messages your WhatsApp number will get AI-powered responses',
                    },
                  isProductSeller
                    ? {
                      title: 'No catalogue is still valid',
                      desc: 'You can add products manually and start handling product enquiries.',
                    }
                    : {
                      title: 'Leads are captured automatically',
                      desc: 'Customer details are saved to your dashboard for follow-up',
                    },
                  isProductSeller
                    ? {
                      title: 'Orders stay visible',
                      desc: 'Product enquiries, orders, payments and stock issues are tracked in BizNavigo.',
                    }
                    : {
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

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Business Verification</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isBusinessVerified
                      ? 'Meta has approved this business for full WhatsApp Business Platform usage.'
                      : 'Your number can run in limited mode while Meta Business Verification is completed.'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isBusinessVerified
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                  }`}>
                  {isBusinessVerified ? 'Verified' : 'Limited mode'}
                </span>
              </div>

              {account.usage_limits?.message && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{account.usage_limits.message}</p>
              )}

              <div className="space-y-3 mb-5">
                {verificationChecklist.map((item) => (
                  <div key={item.key} className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${item.completed ? 'text-green-600' : 'text-gray-300 dark:text-gray-600'}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>

              {!isBusinessVerified && account.business_verification_url && (
                <Button variant="outline" asChild>
                  <a href={account.business_verification_url} target="_blank" rel="noopener noreferrer">
                    Open Meta Business Verification
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
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
                {isProductSeller ? 'Go to Products' : 'Go to Dashboard'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
