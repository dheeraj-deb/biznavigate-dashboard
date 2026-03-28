'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target,
  Instagram,
  MessageSquare,
  Globe,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react'

// Mock settings data
const mockSettings = {
  instagram: {
    enabled: true,
    auto_comment_capture: true,
    comment_keywords: ['interested', 'price', 'details', 'want', 'buy'],
    dm_capture: true,
    story_mention_capture: true,
    auto_reply_enabled: true,
    auto_reply_message: 'Thanks for your interest! We will get back to you shortly. 😊',
  },
  whatsapp: {
    enabled: true,
    form_capture: true,
    quick_reply_capture: true,
    catalog_inquiry_capture: true,
    auto_assign: true,
    assigned_team: 'sales',
  },
  web_forms: {
    enabled: true,
    popup_enabled: false,
    popup_delay: 5,
    exit_intent: true,
    form_fields: ['name', 'email', 'phone', 'message'],
  },
  chatbot: {
    enabled: true,
    capture_threshold: 'medium',
    require_phone: true,
    require_email: false,
  },
}

export default function LeadCapturePage() {
  const [settings, setSettings] = useState(mockSettings)
  const [activeTab, setActiveTab] = useState('instagram')
  const [newKeyword, setNewKeyword] = useState('')

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setSettings({
        ...settings,
        instagram: {
          ...settings.instagram,
          comment_keywords: [...settings.instagram.comment_keywords, newKeyword.trim()],
        },
      })
      setNewKeyword('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setSettings({
      ...settings,
      instagram: {
        ...settings.instagram,
        comment_keywords: settings.instagram.comment_keywords.filter(k => k !== keyword),
      },
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Lead Capture Settings</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Configure how leads are automatically captured from different channels
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Save All Changes
          </Button>
        </div>

        {/* Status Overview Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Instagram</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950">
                <Instagram className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={settings.instagram.enabled ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-gray-100 text-gray-700'}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {settings.instagram.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {settings.instagram.comment_keywords.length} keywords tracked
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">WhatsApp</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={settings.whatsapp.enabled ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-gray-100 text-gray-700'}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {settings.whatsapp.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Forms & catalog inquiries
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Web Forms</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={settings.web_forms.enabled ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-gray-100 text-gray-700'}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {settings.web_forms.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {settings.web_forms.form_fields.length} fields configured
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Chatbot</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={settings.chatbot.enabled ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-gray-100 text-gray-700'}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {settings.chatbot.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                AI-powered conversations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="instagram">
              <Instagram className="mr-2 h-4 w-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="web-forms">
              <Globe className="mr-2 h-4 w-4" />
              Web Forms
            </TabsTrigger>
            <TabsTrigger value="chatbot">
              <Zap className="mr-2 h-4 w-4" />
              Chatbot
            </TabsTrigger>
          </TabsList>

          {/* Instagram Tab */}
          <TabsContent value="instagram" className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Instagram Lead Capture
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                      Automatically capture leads from comments, DMs, and story mentions
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.instagram.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      instagram: { ...settings.instagram, enabled: checked }
                    })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comment Capture */}
                <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Auto-Comment Capture</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Capture leads when users comment with specific keywords
                      </p>
                    </div>
                    <Switch
                      checked={settings.instagram.auto_comment_capture}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        instagram: { ...settings.instagram, auto_comment_capture: checked }
                      })}
                    />
                  </div>

                  {settings.instagram.auto_comment_capture && (
                    <div className="space-y-3">
                      <Label>Trigger Keywords</Label>
                      <div className="flex flex-wrap gap-2">
                        {settings.instagram.comment_keywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="outline"
                            className="px-3 py-1.5 text-sm"
                          >
                            {keyword}
                            <button
                              onClick={() => handleRemoveKeyword(keyword)}
                              className="ml-2 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                          placeholder="Add keyword (e.g., 'interested')"
                          className="flex-1"
                        />
                        <Button onClick={handleAddKeyword} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        When someone comments with these keywords, they'll be automatically added as a lead
                      </p>
                    </div>
                  )}
                </div>

                {/* DM Capture */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <Label className="text-base font-semibold">Direct Message Capture</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Capture leads from new Instagram DM conversations
                    </p>
                  </div>
                  <Switch
                    checked={settings.instagram.dm_capture}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      instagram: { ...settings.instagram, dm_capture: checked }
                    })}
                  />
                </div>

                {/* Story Mentions */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <Label className="text-base font-semibold">Story Mention Capture</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Capture leads when users mention you in their stories
                    </p>
                  </div>
                  <Switch
                    checked={settings.instagram.story_mention_capture}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      instagram: { ...settings.instagram, story_mention_capture: checked }
                    })}
                  />
                </div>

                {/* Auto Reply */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Auto-Reply to Comments</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically reply to comments that match keywords
                      </p>
                    </div>
                    <Switch
                      checked={settings.instagram.auto_reply_enabled}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        instagram: { ...settings.instagram, auto_reply_enabled: checked }
                      })}
                    />
                  </div>

                  {settings.instagram.auto_reply_enabled && (
                    <div>
                      <Label>Auto-Reply Message</Label>
                      <Textarea
                        value={settings.instagram.auto_reply_message}
                        onChange={(e) => setSettings({
                          ...settings,
                          instagram: { ...settings.instagram, auto_reply_message: e.target.value }
                        })}
                        rows={3}
                        placeholder="Enter your auto-reply message..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        This message will be sent as a comment reply when keywords are detected
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button className="w-full md:w-auto bg-purple-600 hover:bg-purple-700">
                    Save Instagram Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      WhatsApp Lead Capture
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                      Configure lead capture from WhatsApp conversations
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.whatsapp.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, enabled: checked }
                    })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <Label className="text-base font-semibold">Form-Based Capture</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Capture leads through interactive WhatsApp forms
                    </p>
                  </div>
                  <Switch
                    checked={settings.whatsapp.form_capture}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, form_capture: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <Label className="text-base font-semibold">Quick Reply Capture</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Capture leads from quick reply button interactions
                    </p>
                  </div>
                  <Switch
                    checked={settings.whatsapp.quick_reply_capture}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, quick_reply_capture: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <Label className="text-base font-semibold">Catalog Inquiry Capture</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically create leads from product catalog inquiries
                    </p>
                  </div>
                  <Switch
                    checked={settings.whatsapp.catalog_inquiry_capture}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, catalog_inquiry_capture: checked }
                    })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Auto-Assign Leads</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically assign new leads to team members
                      </p>
                    </div>
                    <Switch
                      checked={settings.whatsapp.auto_assign}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        whatsapp: { ...settings.whatsapp, auto_assign: checked }
                      })}
                    />
                  </div>

                  {settings.whatsapp.auto_assign && (
                    <div>
                      <Label>Assign To Team</Label>
                      <Select
                        value={settings.whatsapp.assigned_team}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          whatsapp: { ...settings.whatsapp, assigned_team: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales Team</SelectItem>
                          <SelectItem value="support">Support Team</SelectItem>
                          <SelectItem value="marketing">Marketing Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                    Save WhatsApp Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Web Forms Tab */}
          <TabsContent value="web-forms" className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Web Form Capture
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                      Embed forms on your website to capture leads
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.web_forms.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      web_forms: { ...settings.web_forms, enabled: checked }
                    })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Popup Form</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Show popup form after specified delay
                      </p>
                    </div>
                    <Switch
                      checked={settings.web_forms.popup_enabled}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        web_forms: { ...settings.web_forms, popup_enabled: checked }
                      })}
                    />
                  </div>

                  {settings.web_forms.popup_enabled && (
                    <div>
                      <Label>Delay (seconds)</Label>
                      <Input
                        type="number"
                        value={settings.web_forms.popup_delay}
                        onChange={(e) => setSettings({
                          ...settings,
                          web_forms: { ...settings.web_forms, popup_delay: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <Label className="text-base font-semibold">Exit Intent Trigger</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show form when visitor is about to leave
                    </p>
                  </div>
                  <Switch
                    checked={settings.web_forms.exit_intent}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      web_forms: { ...settings.web_forms, exit_intent: checked }
                    })}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Embed Code</Label>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                    <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                      {`<script src="https://biznavigate.com/widget.js" data-key="YOUR_API_KEY"></script>`}
                    </code>
                  </div>
                  <Button variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Embed Code
                  </Button>
                </div>

                <div className="pt-4">
                  <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                    Save Web Form Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot Tab */}
          <TabsContent value="chatbot" className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Chatbot Lead Capture
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                      AI-powered lead qualification and capture
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.chatbot.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      chatbot: { ...settings.chatbot, enabled: checked }
                    })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-800">
                  <Label className="text-base font-semibold">Capture Threshold</Label>
                  <Select
                    value={settings.chatbot.capture_threshold}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      chatbot: { ...settings.chatbot, capture_threshold: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Capture all conversations</SelectItem>
                      <SelectItem value="medium">Medium - Capture interested users</SelectItem>
                      <SelectItem value="high">High - Only highly qualified leads</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    AI will evaluate conversation quality and capture leads based on this threshold
                  </p>
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <Label className="text-base font-semibold">Require Phone Number</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ask for phone number before creating lead
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatbot.require_phone}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      chatbot: { ...settings.chatbot, require_phone: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Require Email Address</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ask for email address before creating lead
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatbot.require_email}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      chatbot: { ...settings.chatbot, require_email: checked }
                    })}
                  />
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Save Chatbot Settings
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/chatbot">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Configure Chatbot
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-5 w-5" />
              Lead Capture Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <p>• Use specific keywords that indicate genuine buying interest (e.g., "price", "buy", "order")</p>
            <p>• Enable auto-replies to engage leads immediately and set expectations</p>
            <p>• Configure auto-assignment to ensure leads are handled promptly by your team</p>
            <p>• Use exit-intent popups sparingly to avoid annoying website visitors</p>
            <p>• Set appropriate chatbot capture thresholds to maintain lead quality</p>
            <p>• Regularly review and update your trigger keywords based on actual conversations</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
