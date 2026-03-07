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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Rocket,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth-store'
import { useWhatsAppTemplates, type WhatsAppTemplate } from '@/hooks/use-whatsapp-templates'
import {
  useCreateCampaign,
  type CampaignType,
  type VariableSource,
  type AudienceField,
  type AudienceOperator,
} from '@/hooks/use-campaigns'

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractVariableCount(body: string): number {
  const matches = body.match(/\{\{(\d+)\}\}/g)
  if (!matches || matches.length === 0) return 0
  return Math.max(...matches.map((m) => parseInt(m.replace(/[{}]/g, ''))))
}

function parsePhones(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim().replace(/\s+/g, ''))
    .filter((s) => s.length >= 7)
}

interface Contact {
  customer_id: string
  name: string
  phone?: string
  whatsapp_number?: string
}

function useContactsPicker(search: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['contacts-picker', search],
    queryFn: async () => {
      const response = await apiClient.get<any>('/contacts', {
        params: { search: search || undefined, limit: 100 },
      })
      const body = response.data as any
      return (Array.isArray(body) ? body : (body?.data ?? [])) as Contact[]
    },
    enabled: !!user?.business_id,
    staleTime: 30_000,
  })
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Basic Info', 'Template', 'Variables', 'Audience', 'Schedule', 'Review']

const VARIABLE_SOURCES: { value: VariableSource; label: string }[] = [
  { value: 'contact.name',        label: 'Contact Name' },
  { value: 'contact.phone',       label: 'Contact Phone' },
  { value: 'system.current_date', label: 'Current Date' },
  { value: 'system.current_time', label: 'Current Time' },
]

const TIMEZONES = [
  { value: 'Asia/Kolkata',        label: 'IST — Asia/Kolkata' },
  { value: 'Asia/Dubai',          label: 'GST — Asia/Dubai' },
  { value: 'Asia/Singapore',      label: 'SGT — Asia/Singapore' },
  { value: 'Asia/Tokyo',          label: 'JST — Asia/Tokyo' },
  { value: 'Europe/London',       label: 'GMT — Europe/London' },
  { value: 'Europe/Paris',        label: 'CET — Europe/Paris' },
  { value: 'America/New_York',    label: 'EST — America/New_York' },
  { value: 'America/Los_Angeles', label: 'PST — America/Los_Angeles' },
  { value: 'UTC',                 label: 'UTC' },
]

const CRON_PRESETS = [
  { value: '0 9 * * *', label: 'Daily at 9:00 AM' },
  { value: '0 9 * * 1', label: 'Every Monday at 9:00 AM' },
  { value: '0 9 1 * *', label: 'Monthly on 1st at 9:00 AM' },
  { value: 'custom',    label: 'Custom expression…' },
]

type FieldMeta = {
  label: string
  valueType: 'number' | 'string' | 'date'
  operators: { value: AudienceOperator; label: string }[]
}

const FIELD_CONFIG: Record<AudienceField, FieldMeta> = {
  engagement_score: {
    label: 'Engagement Score',
    valueType: 'number',
    operators: [
      { value: 'gte', label: '≥' }, { value: 'gt', label: '>' },
      { value: 'lte', label: '≤' }, { value: 'lt', label: '<' },
      { value: 'eq',  label: '=' }, { value: 'ne',  label: '≠' },
    ],
  },
  total_orders: {
    label: 'Total Orders',
    valueType: 'number',
    operators: [
      { value: 'gte', label: '≥' }, { value: 'gt', label: '>' },
      { value: 'lte', label: '≤' }, { value: 'lt', label: '<' },
      { value: 'eq',  label: '=' }, { value: 'ne',  label: '≠' },
    ],
  },
  total_spent: {
    label: 'Total Spent (₹)',
    valueType: 'number',
    operators: [
      { value: 'gte', label: '≥' }, { value: 'gt', label: '>' },
      { value: 'lte', label: '≤' }, { value: 'lt', label: '<' },
      { value: 'eq',  label: '=' }, { value: 'ne',  label: '≠' },
    ],
  },
  last_order_date: {
    label: 'Last Order Date',
    valueType: 'date',
    operators: [
      { value: 'gt',  label: 'After' },
      { value: 'gte', label: 'On or After' },
      { value: 'lt',  label: 'Before' },
      { value: 'lte', label: 'On or Before' },
    ],
  },
  name: {
    label: 'Name',
    valueType: 'string',
    operators: [
      { value: 'contains', label: 'Contains' },
      { value: 'eq',       label: 'Equals' },
    ],
  },
  phone: {
    label: 'Phone',
    valueType: 'string',
    operators: [
      { value: 'contains', label: 'Contains' },
      { value: 'eq',       label: 'Equals' },
    ],
  },
}

type Condition = { field: AudienceField; operator: AudienceOperator; value: string }
type MappingRow = { variableIndex: number; source: VariableSource | '' }

// ── Step progress indicator ───────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center w-full mb-8">
      {STEPS.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : num}
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:block ${
                  active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-10px] rounded ${
                  done ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter()

  // Wizard step
  const [step, setStep] = useState(1)

  // Step 1 — Basic Info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CampaignType>('ONE_TIME')

  // Step 2 — Template
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [templateSearch, setTemplateSearch] = useState('')

  // Step 3 — Variables
  const [variableMappings, setVariableMappings] = useState<MappingRow[]>([])

  // Step 4 — Audience
  const [audienceMode, setAudienceMode] = useState<'contacts' | 'explicit' | 'filter'>('contacts')
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set())
  const [phoneInput, setPhoneInput] = useState('')
  const [filterOp, setFilterOp] = useState<'AND' | 'OR'>('AND')
  const [conditions, setConditions] = useState<Condition[]>([
    { field: 'engagement_score', operator: 'gte', value: '' },
  ])

  // Step 5 — Schedule
  const [sendAt, setSendAt] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [cronPreset, setCronPreset] = useState(CRON_PRESETS[0].value)
  const [cronExpression, setCronExpression] = useState(CRON_PRESETS[0].value)
  const [endsAt, setEndsAt] = useState('')

  const createMutation = useCreateCampaign()

  const { data: pickerContacts = [], isLoading: contactsLoading } = useContactsPicker(contactSearch)

  const { data: templatesData, isLoading: templatesLoading } = useWhatsAppTemplates({
    status: 'APPROVED',
    limit: 50,
  })
  const approvedTemplates = (templatesData?.data ?? []).filter((t) =>
    templateSearch ? t.name.toLowerCase().includes(templateSearch.toLowerCase()) : true
  )

  // Derived
  const varCount = selectedTemplate ? extractVariableCount(selectedTemplate.components.body) : 0
  const explicitPhones = parsePhones(phoneInput)

  const canProceed = (): boolean => {
    if (step === 1) return name.trim().length > 0
    if (step === 2) return !!selectedTemplate
    if (step === 3) return varCount === 0 || variableMappings.every((m) => m.source !== '')
    if (step === 4) {
      if (audienceMode === 'contacts') return selectedContactIds.size > 0
      if (audienceMode === 'explicit') return explicitPhones.length > 0
      return conditions.length > 0 && conditions.every((c) => c.value !== '')
    }
    if (step === 5) {
      if (type === 'RECURRING' && !cronExpression) return false
      return true
    }
    return true
  }

  const handleTemplateSelect = (tpl: WhatsAppTemplate) => {
    setSelectedTemplate(tpl)
    const count = extractVariableCount(tpl.components.body)
    setVariableMappings(Array.from({ length: count }, (_, i) => ({ variableIndex: i, source: '' })))
  }

  const updateCondition = (i: number, field: keyof Condition, val: string) => {
    setConditions((prev) => prev.map((c, idx) => {
      if (idx !== i) return c
      if (field === 'field') {
        const meta = FIELD_CONFIG[val as AudienceField]
        return { ...c, field: val as AudienceField, operator: meta.operators[0].value, value: '' }
      }
      return { ...c, [field]: val }
    }))
  }

  const addCondition = () => setConditions((prev) => [
    ...prev,
    { field: 'engagement_score', operator: 'gte', value: '' },
  ])

  const removeCondition = (i: number) =>
    setConditions((prev) => prev.filter((_, idx) => idx !== i))

  const handleCronPreset = (val: string) => {
    setCronPreset(val)
    if (val !== 'custom') setCronExpression(val)
    else setCronExpression('')
  }

  const handleCreate = async () => {
    if (!selectedTemplate) return
    const numericFields: AudienceField[] = ['engagement_score', 'total_orders', 'total_spent']

    const contactPhones = pickerContacts
      .filter((c) => selectedContactIds.has(c.customer_id))
      .map((c) => c.whatsapp_number ?? c.phone ?? '')
      .filter(Boolean)

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      templateId: selectedTemplate._id,
      templateLanguage: selectedTemplate.language,
      variableMappings: variableMappings
        .filter((m) => m.source)
        .map((m) => ({ variableIndex: m.variableIndex, source: m.source as VariableSource })),
      ...(audienceMode === 'contacts'
        ? { explicitPhoneNumbers: contactPhones }
        : audienceMode === 'explicit'
        ? { explicitPhoneNumbers: explicitPhones }
        : {
            audienceFilter: {
              operator: filterOp,
              conditions: conditions.map((c) => ({
                field: c.field,
                operator: c.operator,
                value: numericFields.includes(c.field) ? Number(c.value) : c.value,
              })),
            },
          }),
      schedule:
        sendAt || (type === 'RECURRING' && cronExpression)
          ? {
              sendAt: sendAt || undefined,
              timezone: sendAt ? timezone : undefined,
              ...(type === 'RECURRING'
                ? { cronExpression: cronExpression || undefined, endsAt: endsAt || undefined }
                : {}),
            }
          : undefined,
    }

    const campaign = await createMutation.mutateAsync(payload)
    if (campaign?._id) {
      router.push(`/crm/campaigns/${campaign._id}`)
    } else {
      router.push('/crm/campaigns')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/crm/campaigns')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Campaign</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Step {step} of {STEPS.length} — {STEPS[step - 1]}
            </p>
          </div>
        </div>

        {/* Step progress */}
        <StepProgress current={step} />

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{STEPS[step - 1]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* ── Step 1: Basic Info ─────────────────────────────────────── */}
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="cname">Campaign Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="cname"
                    placeholder="e.g. Flash Sale — March"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cdesc">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Textarea
                    id="cdesc"
                    placeholder="Brief description of this campaign"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Campaign Type</Label>
                  <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900 w-fit gap-0.5">
                    {(['ONE_TIME', 'RECURRING'] as CampaignType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          type === t
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {t === 'ONE_TIME' ? 'One-Time' : 'Recurring'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {type === 'RECURRING'
                      ? 'Sent on a schedule (daily, weekly, etc.) until an end date.'
                      : 'Sent once at a specified time or immediately on launch.'}
                  </p>
                </div>
              </>
            )}

            {/* ── Step 2: Template ───────────────────────────────────────── */}
            {step === 2 && (
              <>
                <Input
                  placeholder="Search templates…"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="h-9"
                />
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {templatesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : approvedTemplates.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                      {templateSearch ? 'No templates match your search' : 'No approved templates yet'}
                    </div>
                  ) : (
                    approvedTemplates.map((tpl) => (
                      <button
                        key={tpl._id}
                        type="button"
                        onClick={() => handleTemplateSelect(tpl)}
                        className={`w-full text-left rounded-lg border px-3.5 py-3 transition-all ${
                          selectedTemplate?._id === tpl._id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold font-mono text-gray-800 dark:text-gray-200 truncate">
                              {tpl.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                              {tpl.components.body}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                                {tpl.category}
                              </span>
                              <span className="text-[10px] text-gray-400">{tpl.language}</span>
                            </div>
                          </div>
                          {selectedTemplate?._id === tpl._id && (
                            <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ── Step 3: Variable Mapping ───────────────────────────────── */}
            {step === 3 && (
              <>
                {varCount === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-400" />
                    This template has no variables — no mapping needed.
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Map each template variable to a data source. Variables are numbered in the
                      order they appear in the template body.
                    </p>
                    <div className="space-y-3">
                      {variableMappings.map((row, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-10 flex-shrink-0">
                            {`{{${row.variableIndex + 1}}}`}
                          </span>
                          <Select
                            value={row.source}
                            onValueChange={(val) =>
                              setVariableMappings((prev) =>
                                prev.map((m, idx) =>
                                  idx === i ? { ...m, source: val as VariableSource } : m
                                )
                              )
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select data source…" />
                            </SelectTrigger>
                            <SelectContent>
                              {VARIABLE_SOURCES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── Step 4: Audience ───────────────────────────────────────── */}
            {step === 4 && (
              <>
                {/* Mode toggle */}
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900 w-fit gap-0.5">
                  {([
                    { id: 'contacts', label: 'From Contacts' },
                    { id: 'explicit', label: 'Specific Numbers' },
                    { id: 'filter',   label: 'Filter Segments' },
                  ] as const).map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAudienceMode(id)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        audienceMode === id
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* From Contacts */}
                {audienceMode === 'contacts' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Search contacts…"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>

                    {pickerContacts.length > 0 && !contactsLoading && (() => {
                      const reachable = pickerContacts.filter((c) => c.whatsapp_number ?? c.phone)
                      const allSelected = reachable.length > 0 && reachable.every((c) => selectedContactIds.has(c.customer_id))
                      return (
                        <div className="flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (allSelected) {
                                setSelectedContactIds(new Set())
                              } else {
                                setSelectedContactIds(new Set(reachable.map((c) => c.customer_id)))
                              }
                            }}
                            className="text-blue-500 hover:text-blue-600 font-medium"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                          {selectedContactIds.size > 0 && (
                            <span className="text-gray-500">{selectedContactIds.size} selected</span>
                          )}
                        </div>
                      )
                    })()}

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                      {contactsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      ) : pickerContacts.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          {contactSearch ? 'No contacts match your search' : 'No contacts found'}
                        </div>
                      ) : (
                        pickerContacts.map((c) => {
                          const phone = c.whatsapp_number ?? c.phone
                          const checked = selectedContactIds.has(c.customer_id)
                          return (
                            <button
                              key={c.customer_id}
                              type="button"
                              disabled={!phone}
                              onClick={() => {
                                setSelectedContactIds((prev) => {
                                  const next = new Set(prev)
                                  next.has(c.customer_id) ? next.delete(c.customer_id) : next.add(c.customer_id)
                                  return next
                                })
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                !phone
                                  ? 'opacity-40 cursor-not-allowed'
                                  : checked
                                  ? 'bg-blue-50 dark:bg-blue-950/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                                checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {checked && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                  {c.name || <span className="italic text-gray-400">No name</span>}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                  {phone ?? 'No phone — will be skipped'}
                                </p>
                              </div>
                              {c.whatsapp_number && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex-shrink-0">
                                  WA
                                </span>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      WhatsApp number is preferred over phone. Contacts without either are skipped.
                    </p>
                  </div>
                )}

                {audienceMode === 'explicit' && (
                  <div className="space-y-2">
                    <Label>Phone Numbers</Label>
                    <Textarea
                      placeholder={`+919876543210\n+919876543211\nor comma-separated`}
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      rows={5}
                      className="resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-400">
                      One number per line, or comma / semicolon separated.
                      {phoneInput && ` · ${explicitPhones.length} valid numbers.`}
                    </p>
                  </div>
                )}

                {audienceMode === 'filter' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Match</span>
                      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900 gap-0.5">
                        {(['AND', 'OR'] as const).map((op) => (
                          <button
                            key={op}
                            type="button"
                            onClick={() => setFilterOp(op)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                              filterOp === op
                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">conditions</span>
                    </div>

                    <div className="space-y-2">
                      {conditions.map((cond, i) => {
                        const meta = FIELD_CONFIG[cond.field]
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <Select value={cond.field} onValueChange={(v) => updateCondition(i, 'field', v)}>
                              <SelectTrigger className="w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(FIELD_CONFIG) as AudienceField[]).map((f) => (
                                  <SelectItem key={f} value={f}>{FIELD_CONFIG[f].label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select value={cond.operator} onValueChange={(v) => updateCondition(i, 'operator', v)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {meta.operators.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              type={meta.valueType === 'date' ? 'date' : meta.valueType === 'number' ? 'number' : 'text'}
                              value={cond.value}
                              onChange={(e) => updateCondition(i, 'value', e.target.value)}
                              className="flex-1 min-w-0"
                              placeholder="value"
                            />

                            <button
                              type="button"
                              onClick={() => removeCondition(i)}
                              className="text-gray-400 hover:text-red-500 flex-shrink-0"
                              disabled={conditions.length === 1}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={addCondition}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Condition
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* ── Step 5: Schedule ───────────────────────────────────────── */}
            {step === 5 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="sendAt">
                    Send At{' '}
                    <span className="text-gray-400 font-normal text-xs">
                      (optional — leave blank to send immediately on launch)
                    </span>
                  </Label>
                  <Input
                    id="sendAt"
                    type="datetime-local"
                    value={sendAt}
                    onChange={(e) => setSendAt(e.target.value)}
                  />
                </div>

                {sendAt && (
                  <div className="space-y-1.5">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {type === 'RECURRING' && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Frequency</Label>
                      <Select value={cronPreset} onValueChange={handleCronPreset}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRON_PRESETS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {cronPreset === 'custom' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="cron">Cron Expression <span className="text-red-500">*</span></Label>
                        <Input
                          id="cron"
                          placeholder="e.g. 0 9 * * 1"
                          value={cronExpression}
                          onChange={(e) => setCronExpression(e.target.value)}
                          className="font-mono"
                        />
                        <p className="text-xs text-gray-400">Format: minute hour day month weekday</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="endsAt">
                        End Date <span className="text-gray-400 font-normal text-xs">(optional)</span>
                      </Label>
                      <Input
                        id="endsAt"
                        type="date"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── Step 6: Review ─────────────────────────────────────────── */}
            {step === 6 && selectedTemplate && (
              <div className="space-y-4">
                {[
                  { label: 'Campaign Name', value: name },
                  { label: 'Description',   value: description || '—' },
                  { label: 'Type',          value: type === 'ONE_TIME' ? 'One-Time' : 'Recurring' },
                  { label: 'Template',      value: selectedTemplate.name },
                  { label: 'Language',      value: selectedTemplate.language.toUpperCase() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 font-mono text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}

                {varCount > 0 && (
                  <div className="text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">Variable Mappings</span>
                    {variableMappings.map((m) => (
                      <div key={m.variableIndex} className="flex justify-between">
                        <span className="font-mono text-gray-600 dark:text-gray-400">{`{{${m.variableIndex + 1}}}`}</span>
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{m.source || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Audience</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {audienceMode === 'contacts'
                      ? `${selectedContactIds.size} contact${selectedContactIds.size !== 1 ? 's' : ''} from list`
                      : audienceMode === 'explicit'
                      ? `${explicitPhones.length} phone number${explicitPhones.length !== 1 ? 's' : ''}`
                      : `${conditions.length} filter condition${conditions.length !== 1 ? 's' : ''} (${filterOp})`}
                  </span>
                </div>

                {(sendAt || (type === 'RECURRING' && cronExpression)) && (
                  <div className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Schedule</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-right">
                      {sendAt
                        ? new Date(sendAt).toLocaleString()
                        : type === 'RECURRING' ? `Cron: ${cronExpression}` : 'Send immediately'}
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                  Campaign will be created as a <strong>Draft</strong>. You can review and launch it from the campaign detail page.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => (step === 1 ? router.push('/crm/campaigns') : setStep((s) => s - 1))}
            disabled={createMutation.isPending}
          >
            {step === 1 ? (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </>
            )}
          </Button>

          {step < 6 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !canProceed()}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
