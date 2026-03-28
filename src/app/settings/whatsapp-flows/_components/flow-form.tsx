'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Save, Send, Loader2, AlertCircle, ExternalLink,
  Signal, Wifi, Battery, ChevronLeft, ChevronDown,
  Calendar, CheckSquare, Circle,
} from 'lucide-react'
import {
  useCreateFlow,
  useUpdateFlow,
  useSubmitFlow,
  type FlowCategory,
  type WhatsAppFlow,
} from '@/hooks/use-whatsapp-flows'
import { toast } from 'sonner'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: FlowCategory; label: string }[] = [
  { value: 'SIGN_UP',            label: 'Sign Up' },
  { value: 'SIGN_IN',            label: 'Sign In' },
  { value: 'APPOINTMENT_BOOKING',label: 'Appointment Booking' },
  { value: 'LEAD_GENERATION',    label: 'Lead Generation' },
  { value: 'CONTACT_US',         label: 'Contact Us' },
  { value: 'CUSTOMER_SUPPORT',   label: 'Customer Support' },
  { value: 'SURVEY',             label: 'Survey' },
  { value: 'OTHER',              label: 'Other' },
]

const STARTER_JSON = JSON.stringify(
  {
    version: '7.3',
    screens: [
      {
        id: 'SCREEN_1',
        title: 'My Screen',
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextHeading', text: 'Hello World' },
            { type: 'TextBody', text: 'Please fill in the form below.' },
            { type: 'TextInput', label: 'Your Name', name: 'name', input_type: 'text' },
            { type: 'TextInput', label: 'Email Address', name: 'email', input_type: 'email' },
            {
              type: 'Footer',
              label: 'Submit',
              'on-click-action': { name: 'complete', payload: {} },
            },
          ],
        },
      },
    ],
  },
  null,
  2
)

// ── Flow Preview ───────────────────────────────────────────────────────────────

interface FlowScreen {
  id: string
  title?: string
  layout?: { children?: any[] }
}

function FlowComponent({ component }: { component: any }) {
  const type: string = component.type ?? ''

  if (type === 'TextHeading') {
    return (
      <p className="font-bold text-gray-900 leading-tight" style={{ fontSize: 13 }}>
        {component.text}
      </p>
    )
  }
  if (type === 'TextSubheading') {
    return (
      <p className="font-semibold text-gray-800 leading-tight" style={{ fontSize: 12 }}>
        {component.text}
      </p>
    )
  }
  if (type === 'TextBody') {
    return (
      <p className="text-gray-600 leading-snug" style={{ fontSize: 11 }}>
        {component.text}
      </p>
    )
  }
  if (type === 'TextCaption') {
    return (
      <p className="text-gray-400 leading-snug" style={{ fontSize: 10 }}>
        {component.text}
      </p>
    )
  }
  if (type === 'TextInput' || type === 'TextArea') {
    return (
      <div>
        {component.label && (
          <p className="text-gray-500 mb-0.5" style={{ fontSize: 9 }}>{component.label}</p>
        )}
        <div
          className="border border-gray-300 rounded px-2 py-1.5 text-gray-400"
          style={{ fontSize: 10, minHeight: type === 'TextArea' ? 36 : 24 }}
        >
          {component.placeholder || ''}
        </div>
      </div>
    )
  }
  if (type === 'DatePicker') {
    return (
      <div>
        {component.label && (
          <p className="text-gray-500 mb-0.5" style={{ fontSize: 9 }}>{component.label}</p>
        )}
        <div className="border border-gray-300 rounded px-2 py-1.5 flex items-center justify-between text-gray-400" style={{ fontSize: 10 }}>
          <span>{component.placeholder || 'Select date'}</span>
          <Calendar className="h-3 w-3" />
        </div>
      </div>
    )
  }
  if (type === 'Dropdown') {
    return (
      <div>
        {component.label && (
          <p className="text-gray-500 mb-0.5" style={{ fontSize: 9 }}>{component.label}</p>
        )}
        <div className="border border-gray-300 rounded px-2 py-1.5 flex items-center justify-between text-gray-400" style={{ fontSize: 10 }}>
          <span>{component.placeholder || 'Select an option'}</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>
    )
  }
  if (type === 'RadioButtonsGroup') {
    const options: any[] = component['data-source'] ?? component.options ?? []
    return (
      <div>
        {component.label && (
          <p className="font-medium text-gray-700 mb-1" style={{ fontSize: 10 }}>{component.label}</p>
        )}
        <div className="space-y-1">
          {options.slice(0, 3).map((opt: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 text-gray-300 flex-shrink-0" />
              <span className="text-gray-600" style={{ fontSize: 10 }}>{opt.title ?? opt.label ?? opt}</span>
            </div>
          ))}
          {options.length > 3 && (
            <p className="text-gray-400" style={{ fontSize: 9 }}>+{options.length - 3} more</p>
          )}
        </div>
      </div>
    )
  }
  if (type === 'CheckboxGroup') {
    const options: any[] = component['data-source'] ?? component.options ?? []
    return (
      <div>
        {component.label && (
          <p className="font-medium text-gray-700 mb-1" style={{ fontSize: 10 }}>{component.label}</p>
        )}
        <div className="space-y-1">
          {options.slice(0, 3).map((opt: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3 text-gray-300 flex-shrink-0" />
              <span className="text-gray-600" style={{ fontSize: 10 }}>{opt.title ?? opt.label ?? opt}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (type === 'OptIn') {
    return (
      <div className="flex items-start gap-1.5">
        <CheckSquare className="h-3 w-3 text-gray-300 flex-shrink-0 mt-0.5" />
        <p className="text-gray-600" style={{ fontSize: 10 }}>{component.label ?? 'I agree to the terms'}</p>
      </div>
    )
  }
  if (type === 'Image') {
    return (
      <div className="rounded bg-gray-200 flex items-center justify-center" style={{ height: 60 }}>
        <span className="text-gray-400" style={{ fontSize: 9 }}>Image</span>
      </div>
    )
  }
  if (type === 'EmbeddedLink') {
    return (
      <p className="text-blue-500 underline" style={{ fontSize: 10 }}>
        {component.text ?? component.label ?? 'Link'}
      </p>
    )
  }
  if (type === 'Footer') {
    // Rendered separately at the bottom
    return null
  }

  // Generic fallback for unknown types
  return (
    <div className="border border-dashed border-gray-200 rounded px-2 py-1 text-gray-400 text-center" style={{ fontSize: 9 }}>
      {type}
    </div>
  )
}

function FlowPhonePreview({ jsonText, flowName }: { jsonText: string; flowName: string }) {
  const parsed = useMemo(() => {
    try { return JSON.parse(jsonText) } catch { return null }
  }, [jsonText])

  const screens: FlowScreen[] = parsed?.screens ?? []
  const firstScreen = screens[0]
  const children: any[] = firstScreen?.layout?.children ?? []
  const bodyComponents = children.filter((c) => c.type !== 'Footer')
  const footerComponent = children.find((c) => c.type === 'Footer')
  const screenCount = screens.length

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Flow Preview
      </p>

      {/* Screen tabs if multiple screens */}
      {screenCount > 1 && (
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {screens.map((s, i) => (
            <span
              key={s.id}
              className={`text-xs px-2 py-0.5 rounded-full ${
                i === 0
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {s.title ?? s.id}
            </span>
          ))}
        </div>
      )}

      <div className="relative" style={{ width: 260 }}>
        {/* Hardware buttons */}
        <div className="absolute -left-[3px] top-[60px]  w-[3px] h-[18px] bg-gray-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-[88px]  w-[3px] h-[28px] bg-gray-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-[124px] w-[3px] h-[28px] bg-gray-700 rounded-l-sm" />
        <div className="absolute -right-[3px] top-[100px] w-[3px] h-[52px] bg-gray-700 rounded-r-sm" />

        {/* Phone body */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            width: 260, height: 520, borderRadius: 44,
            backgroundColor: '#1c1c1e',
            boxShadow: '0 0 0 1px #3a3a3c, 0 0 0 2.5px #1c1c1e, 0 0 0 4px #3a3a3c, 0 30px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute inset-[3px] flex flex-col overflow-hidden" style={{ borderRadius: 41, backgroundColor: '#f0f2f5' }}>
            {/* Dynamic Island */}
            <div className="absolute left-1/2 -translate-x-1/2 z-20"
              style={{ top: 10, width: 90, height: 26, backgroundColor: '#000', borderRadius: 20 }} />

            {/* Status bar */}
            <div
              className="relative z-10 flex items-center justify-between px-5 text-white flex-shrink-0"
              style={{ paddingTop: 14, paddingBottom: 4, fontSize: 10, backgroundColor: '#fff' }}
            >
              <span className="font-semibold text-gray-900" style={{ fontSize: 11 }}>9:41</span>
              <div style={{ width: 90 }} />
              <div className="flex items-center gap-1 text-gray-700">
                <Signal className="h-2.5 w-2.5" />
                <Wifi className="h-2.5 w-2.5" />
                <Battery className="h-2.5 w-2.5" />
              </div>
            </div>

            {/* Flow app bar — mimics WA Flows header */}
            <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
              <ChevronLeft className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate leading-none" style={{ fontSize: 12 }}>
                  {firstScreen?.title ?? (flowName || 'Flow')}
                </p>
                {screenCount > 1 && (
                  <p className="text-gray-400" style={{ fontSize: 9, marginTop: 1 }}>
                    Screen 1 of {screenCount}
                  </p>
                )}
              </div>
            </div>

            {/* Scrollable content area */}
            {!firstScreen ? (
              <div className="flex-1 flex items-center justify-center px-4">
                <p className="text-center text-gray-400" style={{ fontSize: 10 }}>
                  Add screens to your Flow JSON to see a preview
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col" style={{ backgroundColor: '#fff' }}>
                <div className="flex-1 px-4 py-3 space-y-3">
                  {bodyComponents.length === 0 ? (
                    <p className="text-gray-400 text-center" style={{ fontSize: 10 }}>
                      Add components to the screen layout
                    </p>
                  ) : (
                    bodyComponents.map((comp, i) => (
                      <FlowComponent key={i} component={comp} />
                    ))
                  )}
                </div>

                {/* Footer button */}
                {footerComponent && (
                  <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
                    <div
                      className="w-full text-center py-2 rounded-lg font-semibold text-white"
                      style={{ backgroundColor: '#00a884', fontSize: 12 }}
                    >
                      {footerComponent.label ?? 'Submit'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Home indicator */}
            <div className="flex justify-center py-2 flex-shrink-0" style={{ backgroundColor: '#fff' }}>
              <div style={{ width: 100, height: 4, borderRadius: 2, backgroundColor: '#c7c7cc' }} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center max-w-[240px]">
        Showing first screen · {screenCount} screen{screenCount !== 1 ? 's' : ''} total
      </p>
    </div>
  )
}

// ── Main form ──────────────────────────────────────────────────────────────────

interface FlowFormProps {
  mode: 'create' | 'edit'
  flow?: WhatsAppFlow
}

export function FlowForm({ mode, flow }: FlowFormProps) {
  const router = useRouter()

  const createMutation = useCreateFlow()
  const updateMutation = useUpdateFlow()
  const submitMutation = useSubmitFlow()

  const [name, setName]               = useState(flow?.name ?? '')
  const [category, setCategory]       = useState<FlowCategory>(flow?.category ?? 'LEAD_GENERATION')
  const [endpointUri, setEndpointUri] = useState(flow?.endpointUri ?? '')
  const [jsonText, setJsonText]       = useState(
    flow?.flowJson ? JSON.stringify(flow.flowJson, null, 2) : STARTER_JSON
  )
  const [jsonError, setJsonError]     = useState('')

  const validateJson = (text: string): Record<string, any> | null => {
    try {
      const parsed = JSON.parse(text)
      setJsonError('')
      return parsed
    } catch (e: any) {
      setJsonError(e.message)
      return null
    }
  }

  const buildPayload = () => {
    const parsed = validateJson(jsonText)
    if (!parsed) return null
    if (!name.trim()) { toast.error('Flow name is required'); return null }
    return {
      name: name.trim(),
      category,
      flowJson: parsed,
      ...(endpointUri.trim() ? { endpointUri: endpointUri.trim() } : {}),
    }
  }

  const handleSaveDraft = async () => {
    const payload = buildPayload()
    if (!payload) return
    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      router.push('/settings/whatsapp-flows')
    } else {
      await updateMutation.mutateAsync({ id: flow!._id, data: payload })
      router.push(`/settings/whatsapp-flows/${flow!._id}`)
    }
  }

  const handleSubmit = async () => {
    const payload = buildPayload()
    if (!payload) return
    let id = flow?._id
    if (mode === 'create') {
      const created = await createMutation.mutateAsync(payload)
      id = created._id
    } else {
      await updateMutation.mutateAsync({ id: flow!._id, data: payload })
    }
    if (!id) return
    await submitMutation.mutateAsync(id)
    router.push(`/settings/whatsapp-flows/${id}`)
  }

  const isPending = createMutation.isPending || updateMutation.isPending || submitMutation.isPending

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6 items-start">
      {/* Left: form */}
      <div className="space-y-4">
        {/* Basics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Flow Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="flow-name">
                Flow Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flow-name"
                placeholder="e.g. lead_capture_form"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={(v) => setCategory(v as FlowCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endpoint-uri">
                  Endpoint URI
                  <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="endpoint-uri"
                  placeholder="https://your-server.com/flows/data"
                  value={endpointUri}
                  onChange={(e) => setEndpointUri(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow JSON Editor */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Flow JSON</CardTitle>
              <a
                href="https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/flows-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Flow JSON Docs
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value)
                validateJson(e.target.value)
              }}
              rows={22}
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 font-mono text-xs text-gray-900 dark:text-gray-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
            />
            {jsonError && (
              <div className="flex items-start gap-2 text-red-500 text-xs">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span className="font-mono">{jsonError}</span>
              </div>
            )}
            <p className="text-xs text-gray-400">
              Must be valid JSON with a <span className="font-mono">version</span> and{' '}
              <span className="font-mono">screens</span> array.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            variant="outline"
            onClick={() => router.push(mode === 'create' ? '/settings/whatsapp-flows' : `/settings/whatsapp-flows/${flow!._id}`)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isPending || !!jsonError}>
            {(createMutation.isPending || updateMutation.isPending) && !submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save as Draft</>
            )}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !!jsonError}>
            {submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Save & Submit to Meta</>
            )}
          </Button>
        </div>
      </div>

      {/* Right: live preview */}
      <div className="lg:sticky lg:top-6">
        <FlowPhonePreview jsonText={jsonText} flowName={name} />
      </div>
    </div>
  )
}
