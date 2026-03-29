'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Info,
  ExternalLink,
  Facebook,
  Shield,
  Phone,
  Webhook,
  CheckCheck,
  Copy,
  Check,
  Lightbulb,
} from 'lucide-react'

type OnboardingStep =
  | 'introduction'
  | 'facebook-login'
  | 'permissions'
  | 'select-business'
  | 'select-waba'
  | 'verify-number'
  | 'webhook-config'
  | 'success'

interface WhatsAppOnboardingWizardProps {
  onComplete?: () => void
  onCancel?: () => void
}

export function WhatsAppOnboardingWizard({ onComplete, onCancel }: WhatsAppOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('introduction')
  const [formData, setFormData] = useState({
    businessAccountId: '',
    phoneNumberId: '',
    accessToken: '',
    phoneNumber: '',
    webhookUrl: '',
    verifyToken: '',
  })
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})

  const steps: OnboardingStep[] = [
    'introduction',
    'facebook-login',
    'permissions',
    'select-business',
    'select-waba',
    'verify-number',
    'webhook-config',
    'success',
  ]

  const stepTitles: Record<OnboardingStep, string> = {
    introduction: 'Welcome to WhatsApp Integration',
    'facebook-login': 'Login with Meta (Facebook)',
    permissions: 'Grant Required Permissions',
    'select-business': 'Select Your Business Account',
    'select-waba': 'Choose WhatsApp Business Number',
    'verify-number': 'Verify Your Phone Number',
    'webhook-config': 'Configure Webhooks',
    success: 'All Set!',
  }

  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied({ ...copied, [key]: true })
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000)
  }

  const handleComplete = () => {
    onComplete?.()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stepTitles[currentStep]}
          </h2>
          <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
            Step {currentStepIndex + 1} of {steps.length}
          </Badge>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg">
        <CardContent className="pt-6">
          {currentStep === 'introduction' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-4">
                  <MessageSquare className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Connect WhatsApp Business API
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Let's connect your WhatsApp Business account to start automating customer conversations,
                  capturing leads, and sending notifications to your customers.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mt-8">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 mb-3">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Automated Messaging</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Respond to customers instantly, 24/7
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 mb-3">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Lead Capture</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically collect customer information
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 mb-3">
                    <CheckCheck className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Order Updates</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send confirmations and notifications
                  </p>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  <strong>What you'll need:</strong> A WhatsApp Business API account from Meta.
                  This is different from the WhatsApp Business app.
                  Don't have one yet? <a href="https://business.whatsapp.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Apply here</a>.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Before You Start
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Make sure you have admin access to your Meta Business Account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Have your WhatsApp Business phone number ready</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>This process takes about 5-10 minutes</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 'facebook-login' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 mb-4">
                  <Facebook className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Connect with Meta (Facebook)
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  WhatsApp Business API is managed through Meta. You'll need to log in with your Facebook account.
                </p>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  <strong>Why Facebook?</strong> Meta (Facebook) owns WhatsApp. To access the Business API,
                  you need to authenticate through your Meta Business Account.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">What happens next:</h4>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Login to Facebook</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Use the Facebook account linked to your Meta Business Manager</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Grant Permissions</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">We'll ask for permission to manage your WhatsApp Business account</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Return Here</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">After authorization, you'll be redirected back to complete setup</p>
                    </div>
                  </li>
                </ol>
              </div>

              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                  <strong>Important:</strong> Make sure pop-ups are enabled in your browser.
                  The login window will open in a new tab.
                </AlertDescription>
              </Alert>

              <div className="text-center pt-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Facebook className="mr-2 h-5 w-5" />
                  Continue with Meta
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'permissions' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 mb-4">
                  <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Grant Required Permissions
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We need specific permissions to manage your WhatsApp Business account on your behalf.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Required Permissions
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">whatsapp_business_management</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage WhatsApp Business accounts and phone numbers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">whatsapp_business_messaging</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Send and receive WhatsApp messages</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">business_management</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Access your Meta Business accounts and settings</p>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  <strong>Your data is safe:</strong> We only use these permissions to manage WhatsApp messaging.
                  We never post on your behalf or access personal information.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Common Issues
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Permission denied?</strong> Make sure you're logged in as a Business Manager admin.</p>
                  <p><strong>Don't see your business?</strong> Verify that your WhatsApp Business Account is properly set up in Meta Business Manager.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'select-business' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 mb-4">
                  <MessageSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Select Your Business Account
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose which Meta Business Account you want to connect.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="business-account" className="text-base font-semibold">
                  Business Account ID
                </Label>
                <Input
                  id="business-account"
                  placeholder="Enter your Business Account ID (e.g., 123456789012345)"
                  value={formData.businessAccountId}
                  onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                  className="text-base"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Find this in your Meta Business Manager settings under Business Info.
                </p>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  <strong>Where to find this:</strong> Go to{' '}
                  <a
                    href="https://business.facebook.com/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold inline-flex items-center gap-1"
                  >
                    Meta Business Settings <ExternalLink className="h-3 w-3" />
                  </a>
                  {' '}→ Business Info → Business Account ID
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Tips
                </h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• The Business Account ID is a 15-digit number</li>
                  <li>• Make sure you have admin access to this business account</li>
                  <li>• If you don't see your business, check your permissions</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 'select-waba' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-4">
                  <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  WhatsApp Business Number
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your WhatsApp Business Account (WABA) details.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone-number-id" className="text-base font-semibold">
                    Phone Number ID
                  </Label>
                  <Input
                    id="phone-number-id"
                    placeholder="123456789012345"
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    className="text-base mt-1"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    This is NOT your phone number. It's a unique ID from Meta.
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone-number" className="text-base font-semibold">
                    WhatsApp Phone Number
                  </Label>
                  <Input
                    id="phone-number"
                    placeholder="+1234567890"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="text-base mt-1"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Include country code (e.g., +1 for USA)
                  </p>
                </div>

                <div>
                  <Label htmlFor="access-token" className="text-base font-semibold">
                    Access Token
                  </Label>
                  <Input
                    id="access-token"
                    type="password"
                    placeholder="EAAxxxxxxxxxxxxxxxxxx"
                    value={formData.accessToken}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    className="text-base mt-1 font-mono"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Generate a permanent access token from Meta Business Manager
                  </p>
                </div>
              </div>

              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                  <strong>Keep your token secure!</strong> Never share your access token publicly.
                  It gives full access to your WhatsApp Business account.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  How to get these credentials:
                </h4>
                <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>
                      Go to{' '}
                      <a
                        href="https://developers.facebook.com/apps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold inline-flex items-center gap-1"
                      >
                        Meta Developer Apps <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Select your app → WhatsApp → API Setup</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>Copy the Phone Number ID and generate an Access Token</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {currentStep === 'verify-number' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Verify Your Phone Number
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Verify that your WhatsApp Business number is active and ready to receive messages.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Verification Steps:</h4>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Meta will send a verification code</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">You'll receive it via SMS or voice call</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Enter the 6-digit code</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">The code is valid for 10 minutes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Confirmation</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Once verified, your number is ready to use</p>
                    </div>
                  </li>
                </ol>
              </div>

              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  <strong>Number Verified!</strong> Your WhatsApp Business number {formData.phoneNumber || '+1234567890'} is active and ready.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Common Issues
                </h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• <strong>Didn't receive code?</strong> Check that the number isn't already registered with WhatsApp</li>
                  <li>• <strong>Code expired?</strong> Request a new verification code</li>
                  <li>• <strong>Invalid number?</strong> Make sure the country code is correct</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 'webhook-config' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950 mb-4">
                  <Webhook className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Configure Webhooks
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Set up webhooks to receive real-time messages and status updates from WhatsApp.
                </p>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  <strong>What are webhooks?</strong> Webhooks allow BizNavigo to receive instant notifications
                  when customers send messages or when message statuses change.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url" className="text-base font-semibold">
                    Webhook Callback URL
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="webhook-url"
                      value="https://api.biznavigate.com/webhooks/whatsapp"
                      readOnly
                      className="font-mono text-sm bg-gray-50 dark:bg-gray-900"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy('https://api.biznavigate.com/webhooks/whatsapp', 'webhook')}
                    >
                      {copied.webhook ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Copy this URL and paste it in your Meta App webhook configuration
                  </p>
                </div>

                <div>
                  <Label htmlFor="verify-token" className="text-base font-semibold">
                    Verify Token
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="verify-token"
                      value="biznavigate_verify_2024_secure"
                      readOnly
                      className="font-mono text-sm bg-gray-50 dark:bg-gray-900"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy('biznavigate_verify_2024_secure', 'token')}
                    >
                      {copied.token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Use this token when setting up the webhook in Meta
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  How to configure in Meta:
                </h4>
                <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>
                      Go to{' '}
                      <a
                        href="https://developers.facebook.com/apps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold inline-flex items-center gap-1"
                      >
                        Meta Developer Console <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Select your app → WhatsApp → Configuration</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>Edit Webhook callback URL and paste the URL above</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>Enter the verify token and subscribe to webhook fields</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">5.</span>
                    <span>Subscribe to: <strong>messages</strong>, <strong>message_status</strong></span>
                  </li>
                </ol>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Required Webhook Fields
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white dark:bg-gray-950">messages</Badge>
                  <Badge variant="outline" className="bg-white dark:bg-gray-950">message_status</Badge>
                  <Badge variant="outline" className="bg-white dark:bg-gray-950">message_template_status_update</Badge>
                  <Badge variant="outline" className="bg-white dark:bg-gray-950">messaging_conversations</Badge>
                </div>
              </div>

              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                  <strong>Important:</strong> Your webhook URL must use HTTPS and be publicly accessible.
                  Meta will verify it before activation.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-4 animate-bounce">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  WhatsApp Connected Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                  Your WhatsApp Business account is now connected and ready to automate customer conversations.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Account Connected</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.phoneNumber || '+1234567890'}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                  <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Webhooks Active</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Receiving messages
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                  <CheckCircle2 className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Automation Ready</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    AI responses enabled
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  What's Next?
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Customize Auto-Replies</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Set up automated welcome messages and responses</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Test Your Integration</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Send a test message to your WhatsApp Business number</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Configure Business Hours</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Set when automated responses should be sent</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Enable Lead Capture</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Automatically collect customer information from conversations</p>
                    </div>
                  </li>
                </ul>
              </div>

              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  <strong>Pro Tip:</strong> Send a test message to your WhatsApp Business number to make sure
                  everything is working correctly. You should receive an automated response!
                </AlertDescription>
              </Alert>

              <div className="text-center pt-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleComplete}>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Go to WhatsApp Settings
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800 mt-8">
            <Button
              variant="outline"
              onClick={currentStepIndex === 0 ? onCancel : handleBack}
              disabled={currentStep === 'success'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>

            {currentStep !== 'success' && (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                {currentStepIndex === steps.length - 2 ? 'Complete Setup' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
