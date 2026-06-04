'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  CheckCircle2,
  Handshake,
  AlignLeft,
  Layers,
  Link,
  ListChecks,
  Loader2,
  MessageSquare,
  Package,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  BookingMethodsConfig,
  defaultBookingMethods,
  normalizeBookingMethods,
  useBookingMethods,
  useUpdateBookingMethods,
} from '@/hooks/use-booking-methods'

type SectionKey = keyof BookingMethodsConfig
type AvailabilityResponseMode = BookingMethodsConfig['availability_response']['mode']

const methodCards = [
  {
    key: 'ai_chat' as const,
    title: 'AI Chat',
    description: 'The agent collects customer details in normal WhatsApp conversation.',
    icon: Bot,
    items: [
      { key: 'collect_guest_details', label: 'Collect customer details before confirming' },
      { key: 'require_confirmation', label: 'Confirm final details before creating work' },
    ],
  },
  {
    key: 'interactive' as const,
    title: 'Reply Buttons & Lists',
    description: 'Guide customers with WhatsApp buttons and list choices.',
    icon: ListChecks,
    items: [
      { key: 'send_entry_buttons', label: 'Use entry buttons' },
      { key: 'send_room_or_service_list', label: 'Use item/service list messages' },
    ],
  },
  {
    key: 'catalog' as const,
    title: 'Catalog / Product Messages',
    description: 'Show rooms, products, packages, services, or add-ons from catalog.',
    icon: Package,
    items: [
      { key: 'send_product_messages', label: 'Send product and product-list messages' },
    ],
  },
  {
    key: 'human_handoff' as const,
    title: 'Human Handoff',
    description: 'Move complex or risky cases to staff.',
    icon: Handshake,
    items: [
      { key: 'on_unavailable', label: 'Handoff when item or availability is not found' },
      { key: 'on_low_confidence', label: 'Handoff when AI confidence is low' },
      { key: 'on_payment_issue', label: 'Handoff for payment issues' },
    ],
  },
]

const responseModes: Array<{
  value: AvailabilityResponseMode
  title: string
  description: string
  icon: typeof MessageSquare
}> = [
  {
    value: 'interactive',
    title: 'Interactive List',
    description: 'Send available items or services as a WhatsApp list message.',
    icon: ListChecks,
  },
  {
    value: 'flow',
    title: 'WhatsApp Flow',
    description: 'Open the configured WhatsApp Flow when a Send Flow node exists.',
    icon: Layers,
  },
  {
    value: 'text',
    title: 'Plain Text',
    description: 'Send availability as a normal WhatsApp text summary.',
    icon: AlignLeft,
  },
  {
    value: 'website_link',
    title: 'Website Link',
    description: 'Send a public link with known customer details prefilled.',
    icon: Link,
  },
]

function setNestedValue<T extends SectionKey>(
  config: BookingMethodsConfig,
  section: T,
  key: keyof BookingMethodsConfig[T],
  value: boolean | string,
): BookingMethodsConfig {
  return {
    ...config,
    [section]: {
      ...config[section],
      [key]: value,
    },
  }
}

export default function BookingMethodsPage() {
  const { data, isLoading, isError } = useBookingMethods()
  const updateBookingMethods = useUpdateBookingMethods()
  const [config, setConfig] = useState<BookingMethodsConfig>(defaultBookingMethods)

  useEffect(() => {
    if (data) setConfig(normalizeBookingMethods(data))
  }, [data])

  const enabledCount = useMemo(() => {
    return [
      config.ai_chat.enabled,
      config.interactive.enabled,
      config.catalog.enabled,
      config.templates.enabled,
      config.human_handoff.enabled,
    ].filter(Boolean).length
  }, [config])

  const save = () => {
    updateBookingMethods.mutate(config)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[520px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-gray-500">Loading booking methods...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Methods</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose how WhatsApp bookings are handled for customers.
            </p>
          </div>
          <Button onClick={save} disabled={updateBookingMethods.isPending} className="gap-2 bg-blue-600 hover:bg-blue-700">
            {updateBookingMethods.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>Booking methods could not be loaded. Check the backend connection.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-green-100 p-2 text-green-700 dark:bg-green-950/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{enabledCount}</div>
                <p className="text-xs text-gray-500">Enabled methods</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950/30">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">WhatsApp</div>
                <p className="text-xs text-gray-500">Chat, buttons, lists, catalog, templates</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">No Flow JSON</div>
                <p className="text-xs text-gray-500">Flow, interactive, or text can be selected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base">Availability Response Format</CardTitle>
            <CardDescription>
              This controls what the customer receives after the agent finds available rooms or services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {responseModes.map((mode) => {
                const Icon = mode.icon
                const active = config.availability_response.mode === mode.value
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setConfig(setNestedValue(config, 'availability_response', 'mode', mode.value))}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-950 dark:bg-blue-950/30 dark:text-blue-100'
                        : 'border-gray-200 hover:border-blue-300 dark:border-gray-800 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold">{mode.title}</span>
                      </div>
                      {active && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{mode.description}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {methodCards.map((method) => {
            const Icon = method.icon
            const enabled = config[method.key].enabled

            return (
              <Card key={method.key} className="border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{method.title}</CardTitle>
                        <CardDescription className="mt-1">{method.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'Enabled' : 'Off'}</Badge>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => setConfig(setNestedValue(config, method.key, 'enabled' as never, checked))}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {method.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800">
                      <Label className="text-sm font-medium">{item.label}</Label>
                      <Switch
                        checked={Boolean((config[method.key] as any)[item.key])}
                        disabled={!enabled}
                        onCheckedChange={(checked) => setConfig(setNestedValue(config, method.key, item.key as never, checked))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}

          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Approved Templates</CardTitle>
                    <CardDescription className="mt-1">
                      Use Meta-approved templates for confirmations, reminders, and follow-ups.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.templates.enabled ? 'default' : 'secondary'}>
                    {config.templates.enabled ? 'Enabled' : 'Off'}
                  </Badge>
                  <Switch
                    checked={config.templates.enabled}
                    onCheckedChange={(checked) => setConfig(setNestedValue(config, 'templates', 'enabled', checked))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Confirmation template</Label>
                  <Input
                    value={config.templates.confirmation_template_name}
                    placeholder="booking_confirmation"
                    disabled={!config.templates.enabled}
                    onChange={(event) =>
                      setConfig(setNestedValue(config, 'templates', 'confirmation_template_name', event.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reminder template</Label>
                  <Input
                    value={config.templates.reminder_template_name}
                    placeholder="booking_reminder"
                    disabled={!config.templates.enabled}
                    onChange={(event) =>
                      setConfig(setNestedValue(config, 'templates', 'reminder_template_name', event.target.value))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Template language code</Label>
                <Input
                  value={config.templates.language}
                  placeholder="en"
                  disabled={!config.templates.enabled}
                  onChange={(event) => setConfig(setNestedValue(config, 'templates', 'language', event.target.value))}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
