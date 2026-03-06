'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Send, Loader2, Phone, Signal, Battery, Wifi, FileText, PenLine, CheckCircle2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface CreateCampaignPayload {
  campaign_name: string
  campaign_type: string
  channel: string
  message_template: string
  target_audience?: string[]
  scheduled_at?: string
  business_id: string
}

function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCampaignPayload) => {
      const response = await apiClient.post<{ data?: { campaign_id: string }; campaign_id?: string }>('/campaigns', data)
      return (response.data?.data || response.data) as { campaign_id: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create campaign')
    },
  })
}

// ── Template definitions ───────────────────────────────────────────────────

interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  body: string
}

const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'flash_sale',
    name: 'Flash Sale',
    category: 'Promotional',
    body: 'Hi {{name}}! 🎉 Our Flash Sale is LIVE! Get up to 50% off on all products. Use code {{code}} at checkout.\n\nShop now 👉 {{link}}\n\nOffer ends tonight. Don\'t miss out!',
  },
  {
    id: 'order_confirmed',
    name: 'Order Confirmed',
    category: 'Transactional',
    body: 'Hi {{name}}, your order has been confirmed! 🛍️\n\nOrder ID: #{{code}}\nAmount: {{amount}}\n\nWe\'ll notify you once it ships. Thank you for shopping with us!',
  },
  {
    id: 'appointment_reminder',
    name: 'Appointment Reminder',
    category: 'Reminder',
    body: 'Hi {{name}}, this is a reminder about your appointment on {{date}}. 📅\n\nPlease arrive 10 minutes early. To reschedule, reply to this message.',
  },
  {
    id: 'new_product',
    name: 'New Product Launch',
    category: 'Announcement',
    body: 'Hello {{name}}! 🚀 We just launched {{product}}!\n\nBe among the first to experience it. Click below to learn more 👇\n{{link}}',
  },
  {
    id: 'win_back',
    name: 'Win-Back Offer',
    category: 'Promotional',
    body: 'Hey {{name}}, we miss you! 💙\n\nHere\'s an exclusive {{amount}} off just for you. Use code {{code}} on your next order.\n\nValid till {{date}}. Grab it now 👉 {{link}}',
  },
]

/** Replace {{variable}} placeholders with sample values for preview */
const SAMPLE_VARS: Record<string, string> = {
  name: 'John',
  link: 'https://example.com/offer',
  code: 'SAVE20',
  amount: '₹500',
  date: 'Dec 25',
  product: 'Premium Plan',
}

function renderPreview(template: string): string {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_VARS[key] ?? `{{${key}}}`)
}

// ── WhatsApp Phone Preview ─────────────────────────────────────────────────

function WhatsAppPreview({ message, channel }: { message: string; channel: string }) {
  const preview = renderPreview(message)
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {channel === 'sms' ? 'SMS Preview' : 'WhatsApp Preview'}
      </p>

      {/* iPhone outer shell */}
      <div className="relative" style={{ width: 260 }}>
        {/* Side buttons — volume up/down */}
        <div className="absolute -left-[3px] top-[88px] w-[3px] h-[28px] bg-gray-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-[124px] w-[3px] h-[28px] bg-gray-700 rounded-l-sm" />
        {/* Mute switch */}
        <div className="absolute -left-[3px] top-[60px] w-[3px] h-[18px] bg-gray-700 rounded-l-sm" />
        {/* Power button */}
        <div className="absolute -right-[3px] top-[100px] w-[3px] h-[52px] bg-gray-700 rounded-r-sm" />

        {/* Phone body */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            width: 260,
            height: 520,
            borderRadius: 44,
            backgroundColor: '#1c1c1e',
            boxShadow: '0 0 0 1px #3a3a3c, 0 0 0 2.5px #1c1c1e, 0 0 0 4px #3a3a3c, 0 30px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Screen inset */}
          <div
            className="absolute inset-[3px] flex flex-col overflow-hidden"
            style={{ borderRadius: 41, backgroundColor: '#000' }}
          >
            {/* Dynamic Island */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-20"
              style={{
                top: 10,
                width: 90,
                height: 26,
                backgroundColor: '#000',
                borderRadius: 20,
              }}
            />

            {/* Status bar */}
            <div className="relative z-10 flex items-center justify-between px-5 text-white"
              style={{ paddingTop: 14, paddingBottom: 4, fontSize: 10 }}>
              <span className="font-semibold" style={{ fontSize: 11 }}>9:41</span>
              <div style={{ width: 90 }} /> {/* spacer for dynamic island */}
              <div className="flex items-center gap-1">
                <Signal className="h-2.5 w-2.5" />
                <Wifi className="h-2.5 w-2.5" />
                <Battery className="h-2.5 w-2.5" />
              </div>
            </div>

            {/* App header */}
            {channel === 'whatsapp' ? (
              <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#075E54' }}>
                <div
                  className="flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#9e9e9e', fontSize: 11 }}
                >
                  B
                </div>
                <div>
                  <p className="text-white font-semibold leading-none" style={{ fontSize: 11 }}>Business</p>
                  <p style={{ fontSize: 9, color: '#a8d5a2', marginTop: 2 }}>online</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: '#1c1c1e' }}>
                <Phone className="h-3.5 w-3.5 text-white" />
                <p className="text-white font-semibold" style={{ fontSize: 11 }}>+91 98765 43210</p>
              </div>
            )}

            {/* Chat area */}
            <div
              className="flex-1 px-2.5 py-3 overflow-y-auto"
              style={{
                backgroundImage: channel === 'whatsapp'
                  ? 'radial-gradient(circle, #c5c9ce 1px, transparent 1px)'
                  : undefined,
                backgroundSize: '18px 18px',
                backgroundColor: channel === 'whatsapp' ? '#ECE5DD' : '#f2f2f7',
              }}
            >
              {preview ? (
                <div className="flex justify-start">
                  {/* Incoming bubble — left side */}
                  <div
                    className="max-w-[82%] px-3 py-2 shadow-sm"
                    style={{
                      backgroundColor: channel === 'whatsapp' ? '#ffffff' : '#ffffff',
                      borderRadius: channel === 'whatsapp' ? '0 16px 16px 16px' : 18,
                    }}
                  >
                    {channel === 'whatsapp' && (
                      <p style={{ fontSize: 9, color: '#075E54', fontWeight: 600, marginBottom: 2 }}>
                        Business
                      </p>
                    )}
                    <p
                      className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words"
                      style={{ fontSize: 11 }}
                    >
                      {preview}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span style={{ fontSize: 9, color: '#8e8e93' }}>{now}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center px-4" style={{ fontSize: 10, color: '#8e8e93' }}>
                    Your message preview will appear here as you type
                  </p>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div
              className="px-2.5 py-2 flex items-center gap-2"
              style={{ backgroundColor: channel === 'whatsapp' ? '#f0f0f0' : '#ffffff' }}
            >
              <div
                className="flex-1 h-7 border"
                style={{
                  borderRadius: 16,
                  backgroundColor: '#fff',
                  borderColor: '#e0e0e0',
                }}
              />
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: channel === 'whatsapp' ? '#075E54' : '#34C759',
                }}
              >
                <Send className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center pb-2 pt-1" style={{ backgroundColor: channel === 'whatsapp' ? '#f0f0f0' : '#ffffff' }}>
              <div style={{ width: 100, height: 4, borderRadius: 2, backgroundColor: '#c7c7cc' }} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center max-w-[240px]">
        Variables like <span className="font-mono">{'{{name}}'}</span> are shown with sample values
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [messageMode, setMessageMode] = useState<'simple' | 'template'>('simple')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const createMutation = useCreateCampaign()

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Campaign name is required'); return }
    if (!type) { toast.error('Campaign type is required'); return }
    if (!message.trim()) { toast.error('Message template is required'); return }

    await createMutation.mutateAsync({
      campaign_name: name,
      campaign_type: type,
      channel,
      message_template: message,
      scheduled_at: scheduledAt || undefined,
      business_id: user?.business_id ?? '',
    })

    router.push('/crm/campaigns')
  }

  const isPending = createMutation.isPending

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/crm/campaigns')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Campaign</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a new WhatsApp or SMS campaign</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6 items-start">
          {/* Left: Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Campaign Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="e.g. Flash Sale - December"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Type <span className="text-red-500">*</span></Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Channel</Label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Mode toggle */}
                  <div className="flex items-center justify-between">
                    <Label>
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900">
                      <button
                        type="button"
                        onClick={() => { setMessageMode('simple'); setSelectedTemplate(null) }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          messageMode === 'simple'
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <PenLine className="h-3 w-3" />
                        Simple Message
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessageMode('template')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          messageMode === 'template'
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <FileText className="h-3 w-3" />
                        Templates
                      </button>
                    </div>
                  </div>

                  {messageMode === 'simple' ? (
                    <>
                      <Textarea
                        id="message"
                        placeholder="Hi {{name}}, ..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="resize-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Use {'{{name}}'}, {'{{link}}'} etc. as variables
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {WHATSAPP_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(tpl.id)
                            setMessage(tpl.body)
                          }}
                          className={`w-full text-left rounded-lg border px-3.5 py-3 transition-all ${
                            selectedTemplate === tpl.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{tpl.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{tpl.body}</p>
                            </div>
                            {selectedTemplate === tpl.id && (
                              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                          <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            {tpl.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="scheduled_at">Schedule At <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => router.push('/crm/campaigns')} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right: WhatsApp Preview */}
          <div className="lg:sticky lg:top-6">
            <WhatsAppPreview message={message} channel={channel} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
