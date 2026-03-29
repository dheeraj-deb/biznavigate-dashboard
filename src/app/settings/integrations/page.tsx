'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Instagram,
  Code,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function IntegrationsPage() {
  const [copiedWidget, setCopiedWidget] = useState(false)

  // Mock connection status - replace with actual state management
  const [connections, setConnections] = useState({
    whatsapp: false,
    instagram: false,
    website: false,
  })

  const copyWidgetCode = async () => {
    const widgetCode = `<!-- BizNavigo Chat Widget -->
<script>
  window.bizNavigateConfig = {
    businessId: 'YOUR_BUSINESS_ID',
    position: 'bottom-right',
    primaryColor: '#3B82F6',
  };
</script>
<script src="https://cdn.biznavigate.com/widget.js" async></script>`

    try {
      await navigator.clipboard.writeText(widgetCode)
      setCopiedWidget(true)
      setTimeout(() => setCopiedWidget(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const connectedCount = Object.values(connections).filter(Boolean).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channel Integrations</h1>
          <p className="text-muted-foreground">Connect your communication channels to capture leads</p>
        </div>

        {/* Connection Status Summary */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {connectedCount === 0 && 'No channels connected yet'}
                  {connectedCount === 1 && '1 channel connected'}
                  {connectedCount === 2 && '2 channels connected'}
                  {connectedCount === 3 && 'All channels connected!'}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {connectedCount === 0 && 'Connect at least one channel to start capturing leads automatically'}
                  {connectedCount > 0 && connectedCount < 3 && `Connect ${3 - connectedCount} more ${3 - connectedCount === 1 ? 'channel' : 'channels'} to maximize your reach`}
                  {connectedCount === 3 && 'You\'re all set! Your business is reachable on all platforms'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {connectedCount}/3
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">channels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Business */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">WhatsApp Business API</CardTitle>
                  <CardDescription>Auto-respond to customer messages 24/7</CardDescription>
                </div>
              </div>
              {connections.whatsapp ? (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline">Not Connected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">What you can do:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Automated responses to customer inquiries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Lead capture from WhatsApp conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Send order updates and confirmations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>24/7 customer support automation</span>
                </li>
              </ul>
            </div>

            {connections.whatsapp ? (
              <Link href="/settings/whatsapp">
                <Button variant="outline" className="w-full">
                  Manage WhatsApp Settings
                </Button>
              </Link>
            ) : (
              <Link href="/settings/whatsapp">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Connect WhatsApp Business
                </Button>
              </Link>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Requires WhatsApp Business API account •{' '}
              <a
                href="https://business.whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Instagram Business */}
        <Card className="border-pink-200 dark:border-pink-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Instagram DM Automation</CardTitle>
                  <CardDescription>Respond to Instagram messages automatically</CardDescription>
                </div>
              </div>
              {connections.instagram ? (
                <Badge className="bg-pink-600 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline">Not Connected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">What you can do:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Auto-reply to Instagram DMs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Capture leads from comment interactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Product inquiry automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Unified inbox for all messages</span>
                </li>
              </ul>
            </div>

            {connections.instagram ? (
              <Link href="/settings/instagram">
                <Button variant="outline" className="w-full">
                  Manage Instagram Settings
                </Button>
              </Link>
            ) : (
              <Link href="/settings/instagram">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Instagram className="mr-2 h-4 w-4" />
                  Connect via Meta
                </Button>
              </Link>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Requires Instagram Business Account •{' '}
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Website Chat Widget */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Website Chat Widget</CardTitle>
                  <CardDescription>Add AI chat to your website in 2 minutes</CardDescription>
                </div>
              </div>
              {connections.website ? (
                <Badge className="bg-blue-600 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Installed
                </Badge>
              ) : (
                <Badge variant="outline">Not Installed</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">What you can do:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>24/7 AI-powered customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Lead generation from website visitors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Product recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Multi-language support</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Installation Code:</h4>
                <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 relative">
                  <pre className="text-xs text-green-400 overflow-x-auto">
{`<!-- BizNavigo Chat Widget -->
<script>
  window.bizNavigateConfig = {
    businessId: 'YOUR_BUSINESS_ID',
    position: 'bottom-right',
    primaryColor: '#3B82F6',
  };
</script>
<script src="https://cdn.biznavigate.com/widget.js"
        async></script>`}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 border-gray-700"
                    onClick={copyWidgetCode}
                  >
                    {copiedWidget ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Installation:</strong> Paste this code before the closing <code className="bg-blue-200 dark:bg-blue-900 px-1 rounded">&lt;/body&gt;</code> tag in your website's HTML.
                </p>
              </div>

              <Button
                className="w-full"
                variant={connections.website ? "outline" : "default"}
                onClick={() => setConnections({ ...connections, website: !connections.website })}
              >
                {connections.website ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Installed
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Mark as Installed
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Works with any website builder • No coding knowledge required
            </p>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Having trouble connecting your channels?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Check out our detailed setup guides or contact support for assistance.
            </p>
            <div className="flex gap-2">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Documentation
              </Button>
              <Button variant="outline">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
