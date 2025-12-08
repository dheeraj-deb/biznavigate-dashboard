'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Info,
  Facebook,
  Loader2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Phone,
} from 'lucide-react'

type ConnectionStep = 'intro' | 'connecting' | 'select-number' | 'success'

interface SimpleWhatsAppConnectProps {
  onComplete?: () => void
}

export function SimpleWhatsAppConnect({ onComplete }: SimpleWhatsAppConnectProps) {
  const [currentStep, setCurrentStep] = useState<ConnectionStep>('intro')
  const [selectedNumber, setSelectedNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mock available WhatsApp numbers (in real implementation, these come from Meta API)
  const availableNumbers = [
    { id: '1', number: '+1 (555) 123-4567', displayName: 'Main Business Line', verified: true },
    { id: '2', number: '+1 (555) 987-6543', displayName: 'Customer Support', verified: true },
    { id: '3', number: '+1 (555) 456-7890', displayName: 'Sales Team', verified: false },
  ]

  const handleConnectWithMeta = async () => {
    setIsLoading(true)
    // Simulate OAuth flow
    setTimeout(() => {
      setIsLoading(false)
      setCurrentStep('select-number')
    }, 2000)
  }

  const handleSelectNumber = (numberId: string) => {
    setSelectedNumber(numberId)
  }

  const handleConfirmConnection = async () => {
    setIsLoading(true)
    // Simulate API call to connect
    setTimeout(() => {
      setIsLoading(false)
      setCurrentStep('success')
    }, 1500)
  }

  const handleFinish = () => {
    onComplete?.()
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
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect in under 60 seconds
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950 mb-3">
                  <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Auto-Configure</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We handle all the technical stuff
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 mb-3">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">100% Secure</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bank-level encryption
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                How it works:
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-blue-900 dark:text-blue-100 font-medium">
                    Click "Connect with Meta" below
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-blue-900 dark:text-blue-100 font-medium">
                    Choose your WhatsApp Business number
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-blue-900 dark:text-blue-100 font-medium">
                    Done! Start messaging customers instantly
                  </p>
                </div>
              </div>
            </div>

            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>Don't have WhatsApp Business yet?</strong> No problem! We'll help you set it up during this process.
              </AlertDescription>
            </Alert>

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
                    <Facebook className="mr-2 h-5 w-5" />
                    Connect with Meta
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                You'll be redirected to Meta to authorize the connection
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'select-number' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                Step 2 of 2
              </Badge>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Connected to Meta</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Select Your WhatsApp Number
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Choose which WhatsApp Business number you want to connect to BizNavigate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                We found {availableNumbers.length} WhatsApp Business number{availableNumbers.length !== 1 ? 's' : ''} in your Meta account.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {availableNumbers.map((number) => (
                <button
                  key={number.id}
                  onClick={() => handleSelectNumber(number.id)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                    selectedNumber === number.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0 ${
                        selectedNumber === number.id
                          ? 'bg-blue-600'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Phone className={`h-6 w-6 ${
                          selectedNumber === number.id
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            {number.number}
                          </p>
                          {number.verified && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {number.displayName}
                        </p>
                      </div>
                    </div>
                    {selectedNumber === number.id && (
                      <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {!availableNumbers.some(n => n.verified) && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                  <strong>Unverified numbers:</strong> You'll need to verify your number with Meta before you can send messages.
                  We'll guide you through this after connection.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('intro')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleConfirmConnection}
                disabled={!selectedNumber || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Connect This Number
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'success' && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-950 dark:to-green-950/20 shadow-xl">
          <CardContent className="pt-10 pb-10">
            <div className="text-center mb-8">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-4 shadow-xl animate-pulse">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                You're All Set! 🎉
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Your WhatsApp Business is now connected and ready to automate customer conversations.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-3">
                  <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Number Active</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {availableNumbers.find(n => n.id === selectedNumber)?.number}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">AI Enabled</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Auto-replies active
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 mb-3">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Ready to Go</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start messaging now
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                What happens now?
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-white dark:bg-gray-900 p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Customers can message you</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Anyone who messages your WhatsApp number will get instant AI-powered responses
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white dark:bg-gray-900 p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Leads are captured automatically</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Customer details are saved to your dashboard for follow-up
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white dark:bg-gray-900 p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">You stay in control</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View all conversations, take over chats, and customize responses anytime
                    </p>
                  </div>
                </div>
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
