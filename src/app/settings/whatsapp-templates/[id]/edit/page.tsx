'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import {
  ArrowLeft,
  Send,
  Loader2,
  Plus,
  Trash2,
  Phone,
  Link as LinkIcon,
  MessageSquare,
  Signal,
  Wifi,
  Battery,
  Image,
  Video,
  FileText,
  Save,
} from 'lucide-react'
import {
  useGetTemplate,
  useUpdateTemplate,
  useSubmitTemplate,
  type TemplateCategory,
  type HeaderType,
  type TemplateButton,
  type TemplateButtonCTA,
  type TemplateComponents,
} from '@/hooks/use-whatsapp-templates'
import { toast } from 'sonner'

// ── Constants ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: 'en',    label: 'English' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'hi',    label: 'Hindi' },
  { value: 'ta',    label: 'Tamil' },
  { value: 'te',    label: 'Telugu' },
  { value: 'kn',    label: 'Kannada' },
  { value: 'ml',    label: 'Malayalam' },
  { value: 'mr',    label: 'Marathi' },
  { value: 'bn',    label: 'Bengali' },
  { value: 'gu',    label: 'Gujarati' },
]

// ── Variable helpers ───────────────────────────────────────────────────────────

function renderPreview(text: string, userSamples: string[]): string {
  return text.replace(/\{\{(\d+)\}\}/g, (_, num) => {
    const idx = parseInt(num, 10) - 1
    return userSamples[idx]?.trim() || `{{${num}}}`
  })
}

function extractVariableCount(text: string): number {
  const nums = (text.match(/\{\{(\d+)\}\}/g) ?? []).map((m) => parseInt(m.replace(/\D/g, ''), 10))
  return nums.length ? Math.max(...nums) : 0
}

// ── Button UI type ─────────────────────────────────────────────────────────────

type UIButtonKind = 'QUICK_REPLY' | 'URL' | 'PHONE'

interface UIButton {
  kind: UIButtonKind
  text: string
  payload: string
  url: string
  urlExample: string
  phone: string
}

function uiButtonToApi(b: UIButton, varSamples: string[]): TemplateButton {
  if (b.kind === 'QUICK_REPLY') {
    return { type: 'QUICK_REPLY', text: b.text, payload: b.payload || b.text }
  }
  if (b.kind === 'URL') {
    const hasVar = /\{\{\d+\}\}/.test(b.url)
    const urlExample = hasVar
      ? (b.urlExample.trim() || b.url.replace(/\{\{(\d+)\}\}/g, (_, n) => varSamples[parseInt(n, 10) - 1]?.trim() || n))
      : undefined
    return { type: 'CALL_TO_ACTION', text: b.text, actionType: 'URL', url: b.url, ...(urlExample ? { urlExample } : {}) }
  }
  return { type: 'CALL_TO_ACTION', text: b.text, actionType: 'PHONE_NUMBER', phoneNumber: b.phone }
}

function apiButtonToUI(b: TemplateButton): UIButton {
  if (b.type === 'QUICK_REPLY') {
    return { kind: 'QUICK_REPLY', text: b.text, payload: b.payload ?? '', url: '', urlExample: '', phone: '' }
  }
  const cta = b as TemplateButtonCTA
  if (cta.actionType === 'URL') {
    return { kind: 'URL', text: b.text, payload: '', url: cta.url ?? '', urlExample: cta.urlExample ?? '', phone: '' }
  }
  return { kind: 'PHONE', text: b.text, payload: '', url: '', urlExample: '', phone: cta.phoneNumber ?? '' }
}

// ── iPhone preview ─────────────────────────────────────────────────────────────

interface PreviewProps {
  headerType: HeaderType | 'NONE'
  headerText: string
  body: string
  footer: string
  buttons: UIButton[]
  varSamples: string[]
}

function PhonePreview({ headerType, headerText, body, footer, buttons, varSamples }: PreviewProps) {
  const previewBody   = renderPreview(body, varSamples)
  const previewHeader = renderPreview(headerText, varSamples)
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const hasContent = headerType !== 'NONE' || body || footer || buttons.length > 0

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        WhatsApp Preview
      </p>

      <div className="relative" style={{ width: 260 }}>
        <div className="absolute -left-[3px] top-[60px]  w-[3px] h-[18px] bg-gray-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-[88px]  w-[3px] h-[28px] bg-gray-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-[124px] w-[3px] h-[28px] bg-gray-700 rounded-l-sm" />
        <div className="absolute -right-[3px] top-[100px] w-[3px] h-[52px] bg-gray-700 rounded-r-sm" />

        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            width: 260, height: 520, borderRadius: 44,
            backgroundColor: '#1c1c1e',
            boxShadow: '0 0 0 1px #3a3a3c, 0 0 0 2.5px #1c1c1e, 0 0 0 4px #3a3a3c, 0 30px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute inset-[3px] flex flex-col overflow-hidden" style={{ borderRadius: 41, backgroundColor: '#000' }}>
            <div className="absolute left-1/2 -translate-x-1/2 z-20"
              style={{ top: 10, width: 90, height: 26, backgroundColor: '#000', borderRadius: 20 }} />

            <div className="relative z-10 flex items-center justify-between px-5 text-white"
              style={{ paddingTop: 14, paddingBottom: 4, fontSize: 10 }}>
              <span className="font-semibold" style={{ fontSize: 11 }}>9:41</span>
              <div style={{ width: 90 }} />
              <div className="flex items-center gap-1">
                <Signal className="h-2.5 w-2.5" />
                <Wifi className="h-2.5 w-2.5" />
                <Battery className="h-2.5 w-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#075E54' }}>
              <div className="flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#9e9e9e', fontSize: 11 }}>
                B
              </div>
              <div>
                <p className="text-white font-semibold leading-none" style={{ fontSize: 11 }}>Business</p>
                <p style={{ fontSize: 9, color: '#a8d5a2', marginTop: 2 }}>online</p>
              </div>
            </div>

            <div className="flex-1 px-2.5 py-3 overflow-y-auto"
              style={{
                backgroundImage: 'radial-gradient(circle, #c5c9ce 1px, transparent 1px)',
                backgroundSize: '18px 18px',
                backgroundColor: '#ECE5DD',
              }}>
              {hasContent ? (
                <div className="flex justify-start">
                  <div style={{ maxWidth: '85%' }}>
                    <div className="shadow-sm overflow-hidden"
                      style={{ backgroundColor: '#fff', borderRadius: '0 12px 12px 12px' }}>
                      {headerType === 'TEXT' && previewHeader && (
                        <div className="px-3 pt-2.5 pb-1">
                          <p className="font-bold text-gray-900" style={{ fontSize: 11 }}>{previewHeader}</p>
                        </div>
                      )}
                      {headerType === 'IMAGE' && (
                        <div className="flex items-center justify-center" style={{ height: 80, backgroundColor: '#e0e0e0' }}>
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      {headerType === 'VIDEO' && (
                        <div className="flex items-center justify-center" style={{ height: 80, backgroundColor: '#e0e0e0' }}>
                          <Video className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      {headerType === 'DOCUMENT' && (
                        <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#f0f0f0' }}>
                          <FileText className="h-5 w-5 text-gray-500" />
                          <span className="text-gray-600" style={{ fontSize: 10 }}>document.pdf</span>
                        </div>
                      )}

                      {previewBody && (
                        <div className="px-3 py-2">
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words" style={{ fontSize: 11 }}>
                            {previewBody}
                          </p>
                        </div>
                      )}

                      {footer && (
                        <div className="px-3 pb-1">
                          <p style={{ fontSize: 9, color: '#8e8e93' }}>{footer}</p>
                        </div>
                      )}

                      <div className="flex justify-end px-3 pb-2">
                        <span style={{ fontSize: 9, color: '#8e8e93' }}>{now}</span>
                      </div>

                      {buttons.length > 0 && <div style={{ borderTop: '1px solid #e8e8e8' }} />}
                      {buttons.slice(0, 3).map((btn, i) => (
                        <div key={i}
                          className="flex items-center justify-center gap-1.5 py-2"
                          style={{
                            borderTop: i > 0 ? '1px solid #e8e8e8' : undefined,
                            color: '#00a5f4', fontSize: 11, fontWeight: 500,
                          }}>
                          {btn.kind === 'URL'   && <LinkIcon className="h-3 w-3" />}
                          {btn.kind === 'PHONE' && <Phone className="h-3 w-3" />}
                          {btn.kind === 'QUICK_REPLY' && <MessageSquare className="h-3 w-3" />}
                          {btn.text || 'Button'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center px-4" style={{ fontSize: 10, color: '#8e8e93' }}>
                    Fill in the template details to see a preview
                  </p>
                </div>
              )}
            </div>

            <div className="px-2.5 py-2 flex items-center gap-2" style={{ backgroundColor: '#f0f0f0' }}>
              <div className="flex-1 h-7 border" style={{ borderRadius: 16, backgroundColor: '#fff', borderColor: '#e0e0e0' }} />
              <div className="flex items-center justify-center flex-shrink-0"
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#075E54' }}>
                <Send className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="flex justify-center pb-2 pt-1" style={{ backgroundColor: '#f0f0f0' }}>
              <div style={{ width: 100, height: 4, borderRadius: 2, backgroundColor: '#c7c7cc' }} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center max-w-[240px]">
        Fill in sample values to see them here
      </p>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, optional, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {title}
          {optional && <span className="text-xs font-normal text-gray-400">(optional)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EditTemplatePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const { data: template, isLoading } = useGetTemplate(id)
  const updateMutation  = useUpdateTemplate()
  const submitMutation  = useSubmitTemplate()

  // Basics
  const [category, setCategory] = useState<TemplateCategory>('MARKETING')
  const [language, setLanguage] = useState('en')

  // Header
  const [headerType, setHeaderType]       = useState<HeaderType | 'NONE'>('NONE')
  const [headerText, setHeaderText]       = useState('')
  const [headerExample, setHeaderExample] = useState('')
  const [mediaUrl, setMediaUrl]           = useState('')

  // Body & footer
  const [body, setBody]     = useState('')
  const [footer, setFooter] = useState('')

  // Buttons
  const [buttons, setButtons] = useState<UIButton[]>([])

  // Sample values
  const variableCount = extractVariableCount(body)
  const [varSamples, setVarSamples] = useState<string[]>([])

  // Prefill form when template loads
  useEffect(() => {
    if (!template) return
    setCategory(template.category)
    setLanguage(template.language)

    const c = template.components
    setBody(c.body)
    setFooter(c.footer ?? '')

    if (c.header) {
      setHeaderType(c.header.type)
      setHeaderText(c.header.text ?? '')
      setHeaderExample(c.header.example ?? '')
      setMediaUrl(c.header.mediaUrl ?? '')
    } else {
      setHeaderType('NONE')
    }

    setButtons((c.buttons ?? []).map(apiButtonToUI))
  }, [template])

  const updateVarSample = (i: number, val: string) => {
    setVarSamples((prev) => {
      const next = [...prev]
      next[i] = val
      return next
    })
  }

  const addButton = (kind: UIButtonKind) => {
    if (buttons.length >= 3) { toast.error('Maximum 3 buttons allowed'); return }
    setButtons((prev) => [...prev, { kind, text: '', payload: '', url: '', urlExample: '', phone: '' }])
  }

  const updateButton = (i: number, field: keyof UIButton, value: string) =>
    setButtons((prev) => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b))

  const removeButton = (i: number) =>
    setButtons((prev) => prev.filter((_, idx) => idx !== i))

  const buildComponents = (): TemplateComponents => {
    const components: TemplateComponents = { body }

    if (variableCount > 0) {
      components.bodyExamples = Array.from({ length: variableCount }, (_, i) => varSamples[i]?.trim() ?? '')
    }

    if (headerType !== 'NONE') {
      if (headerType === 'TEXT') {
        const hasVar = /\{\{\d+\}\}/.test(headerText)
        components.header = {
          type: 'TEXT',
          text: headerText,
          ...(hasVar && headerExample.trim() ? { example: headerExample.trim() } : {}),
        }
      } else {
        components.header = {
          type: headerType,
          mediaUrl,
          ...(mediaUrl.trim() ? { example: mediaUrl.trim() } : {}),
        }
      }
    }

    if (footer.trim()) components.footer = footer
    if (buttons.length > 0) components.buttons = buttons.map((b) => uiButtonToApi(b, varSamples))
    return components
  }

  const validate = () => {
    if (!body.trim()) { toast.error('Message body is required'); return false }
    if (headerType === 'TEXT' && !headerText.trim()) {
      toast.error('Header text is required when header type is Text')
      return false
    }
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && !mediaUrl.trim()) {
      toast.error('Media URL is required for this header type')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    await updateMutation.mutateAsync({
      id,
      data: { category, language, components: buildComponents() },
    })
    router.push('/settings/whatsapp-templates')
  }

  const handleSaveAndSubmit = async () => {
    if (!validate()) return
    await updateMutation.mutateAsync({
      id,
      data: { category, language, components: buildComponents() },
    })
    await submitMutation.mutateAsync(id)
    router.push('/settings/whatsapp-templates')
  }

  const isPending = updateMutation.isPending || submitMutation.isPending

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!template) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <p className="text-gray-500">Template not found.</p>
          <Button variant="outline" onClick={() => router.push('/settings/whatsapp-templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const isEditable = template.status === 'DRAFT' || template.status === 'REJECTED'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings/whatsapp-templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{template.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditable ? 'Edit template — save changes or submit for Meta review' : 'This template cannot be edited in its current status'}
            </p>
          </div>
        </div>

        {!isEditable && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <FileText className="h-4 w-4 flex-shrink-0" />
            Templates with status <strong>{template.status}</strong> cannot be edited. Duplicate it to create a new draft.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6 items-start">
          {/* Left: Form */}
          <div className="space-y-4">

            {/* Basics */}
            <Section title="Template Basics">
              <div className="space-y-1.5">
                <Label>Template Name</Label>
                <Input value={template.name} disabled className="font-mono bg-gray-50 dark:bg-gray-900" />
                <p className="text-xs text-gray-400">Template name cannot be changed after creation</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)} disabled={!isEditable}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={!isEditable}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            {/* Header */}
            <Section title="Header" optional>
              <div className="space-y-1.5">
                <Label>Header Type</Label>
                <div className="grid grid-cols-5 gap-2">
                  {(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => isEditable && setHeaderType(fmt)}
                      disabled={!isEditable}
                      className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        headerType === fmt
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {fmt === 'NONE'     && 'None'}
                      {fmt === 'TEXT'     && 'Text'}
                      {fmt === 'IMAGE'    && '📷 Image'}
                      {fmt === 'VIDEO'    && '🎬 Video'}
                      {fmt === 'DOCUMENT' && '📄 Doc'}
                    </button>
                  ))}
                </div>
              </div>

              {headerType === 'TEXT' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="header-text">Header Text</Label>
                    <Input
                      id="header-text"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      maxLength={60}
                      disabled={!isEditable}
                    />
                    <p className="text-xs text-gray-400">{headerText.length}/60</p>
                  </div>
                  {/\{\{\d+\}\}/.test(headerText) && (
                    <div className="space-y-1.5">
                      <Label htmlFor="header-example" className="text-xs">
                        Example value for <span className="font-mono">{'{{1}}'}</span> in header
                      </Label>
                      <Input
                        id="header-example"
                        placeholder="e.g. ORD-12345"
                        value={headerExample}
                        onChange={(e) => setHeaderExample(e.target.value)}
                        className="h-8 text-xs"
                        disabled={!isEditable}
                      />
                    </div>
                  )}
                </div>
              )}

              {(headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT') && (
                <div className="space-y-1.5">
                  <Label htmlFor="media-url">Media URL</Label>
                  <Input
                    id="media-url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="font-mono text-sm"
                    disabled={!isEditable}
                  />
                </div>
              )}
            </Section>

            {/* Body */}
            <Section title="Body">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Message Body <span className="text-red-500">*</span></Label>
                  {isEditable && (
                    <Button
                      type="button" variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => setBody((prev) => `${prev}{{${extractVariableCount(prev) + 1}}}`)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Variable
                    </Button>
                  )}
                </div>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  className="resize-none font-mono text-sm"
                  maxLength={1024}
                  disabled={!isEditable}
                />
                <div className="flex justify-end">
                  <p className="text-xs text-gray-400">{body.length}/1024</p>
                </div>

                {variableCount > 0 && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Sample values for preview
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: variableCount }, (_, i) => i).map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 w-8 flex-shrink-0">{`{{${i + 1}}}`}</span>
                          <Input
                            placeholder={`Sample for {{${i + 1}}}`}
                            value={varSamples[i] ?? ''}
                            onChange={(e) => updateVarSample(i, e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Footer */}
            <Section title="Footer" optional>
              <div className="space-y-1.5">
                <Label htmlFor="footer">Footer Text</Label>
                <Input
                  id="footer"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  maxLength={60}
                  disabled={!isEditable}
                />
                <p className="text-xs text-gray-400">{footer.length}/60</p>
              </div>
            </Section>

            {/* Buttons */}
            <Section title="Buttons" optional>
              <div className="space-y-3">
                {buttons.map((btn, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                        {btn.kind === 'QUICK_REPLY' && <><MessageSquare className="h-3.5 w-3.5" /> Quick Reply</>}
                        {btn.kind === 'URL'         && <><LinkIcon className="h-3.5 w-3.5" /> URL Button</>}
                        {btn.kind === 'PHONE'       && <><Phone className="h-3.5 w-3.5" /> Call Button</>}
                      </span>
                      {isEditable && (
                        <button type="button" onClick={() => removeButton(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Button Label</Label>
                      <Input
                        value={btn.text}
                        onChange={(e) => updateButton(i, 'text', e.target.value)}
                        className="h-8 text-xs"
                        maxLength={25}
                        disabled={!isEditable}
                      />
                    </div>

                    {btn.kind === 'QUICK_REPLY' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Payload</Label>
                        <Input
                          value={btn.payload}
                          onChange={(e) => updateButton(i, 'payload', e.target.value)}
                          className="h-8 text-xs font-mono"
                          disabled={!isEditable}
                        />
                      </div>
                    )}
                    {btn.kind === 'URL' && (
                      <div className="space-y-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">URL</Label>
                          <Input
                            value={btn.url}
                            onChange={(e) => updateButton(i, 'url', e.target.value)}
                            className="h-8 text-xs font-mono"
                            disabled={!isEditable}
                          />
                        </div>
                        {/\{\{\d+\}\}/.test(btn.url) && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Example URL <span className="font-normal text-gray-400">(required by Meta)</span>
                            </Label>
                            <Input
                              placeholder="https://example.com/track/ORD-123"
                              value={btn.urlExample}
                              onChange={(e) => updateButton(i, 'urlExample', e.target.value)}
                              className="h-8 text-xs font-mono"
                              disabled={!isEditable}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {btn.kind === 'PHONE' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Phone Number</Label>
                        <Input
                          value={btn.phone}
                          onChange={(e) => updateButton(i, 'phone', e.target.value)}
                          className="h-8 text-xs"
                          disabled={!isEditable}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {isEditable && buttons.length < 3 && (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => addButton('QUICK_REPLY')}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Quick Reply
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => addButton('URL')}>
                      <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> URL
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => addButton('PHONE')}>
                      <Phone className="h-3.5 w-3.5 mr-1.5" /> Call
                    </Button>
                  </div>
                )}
              </div>
            </Section>

            {/* Actions */}
            {isEditable && (
              <div className="flex items-center justify-end gap-3 pb-6">
                <Button variant="outline" onClick={() => router.push('/settings/whatsapp-templates')} disabled={isPending}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleSave} disabled={isPending}>
                  {updateMutation.isPending && !submitMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                  )}
                </Button>
                <Button onClick={handleSaveAndSubmit} disabled={isPending}>
                  {submitMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Save & Submit for Approval</>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-6">
            <PhonePreview
              headerType={headerType}
              headerText={headerText}
              body={body}
              footer={footer}
              buttons={buttons}
              varSamples={varSamples}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
