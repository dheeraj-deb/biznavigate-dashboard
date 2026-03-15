'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Loader2, Package, CheckCircle2, IndianRupee, Users,
} from 'lucide-react'
import { InventoryConfig, Service, ServiceFormData } from './types'
import { ServiceFormPanel } from './form-panel'
import { AvailabilitySection } from './availability'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function initAttrs(fields: { key: string; type: string }[]) {
  const a: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.type === 'boolean') a[f.key] = false
    else if (f.type === 'number') a[f.key] = 0
    else if (f.type === 'multi-select') a[f.key] = []
    else a[f.key] = ''
  }
  return a
}

const ACCENT = '#0066FF'

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/60 bg-white p-5 space-y-4">
      <div className="flex gap-3">
        <div className="h-14 w-14 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-3 w-48 rounded bg-slate-100" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-20 rounded-full bg-slate-200" />
        <div className="h-7 w-20 rounded-full bg-slate-100" />
      </div>
    </div>
  )
}

// ── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({ service, accent, onEdit, onDeactivate }: {
  service: Service
  accent: string
  onEdit: (s: Service) => void
  onDeactivate: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const handleDeactivate = async () => {
    if (!confirm(`Deactivate "${service.name}"?`)) return
    setDeactivating(true)
    try {
      await onDeactivate(service.id)
    } finally {
      setDeactivating(false)
    }
  }

  const attrEntries = Object.entries(service.attributes ?? {}).slice(0, 4)

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Card body */}
      <div className="p-5 space-y-4">
        {/* Top row: image + name */}
        <div className="flex items-start gap-4">
          {service.image_urls?.[0] ? (
            <img src={service.image_urls[0]} alt={service.name}
              className="h-16 w-16 rounded-xl object-cover shrink-0 border border-slate-100" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <Package className="h-6 w-6 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${service.is_active ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {service.is_active ? '● Active' : '○ Inactive'}
              </span>
            </div>
            <h3 className="font-bold text-[15px] text-[#4B4B4B] truncate">{service.name}</h3>
            {service.description && (
              <p className="text-[12px] text-[#6E6E6E] mt-0.5 line-clamp-1">{service.description}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[13px]">
          <span className="flex items-center gap-1 font-bold text-[#4B4B4B]">
            <IndianRupee className="h-3.5 w-3.5 text-[#0066FF]" />
            {fmt(service.base_price)}
          </span>
          <span className="flex items-center gap-1 text-[#6E6E6E] font-semibold">
            <Users className="h-3.5 w-3.5" />
            {service.capacity} units
          </span>
        </div>

        {/* Attributes preview */}
        {attrEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attrEntries.map(([k, v]) => (
              <span key={k} className="rounded-full border border-[#E5E5E5] bg-slate-50 px-2.5 py-0.5 text-[11px] text-[#6E6E6E] font-medium">
                {k}: {Array.isArray(v) ? (v as string[]).join(', ') || '—' : String(v || '—')}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => onEdit(service)}
            className="flex items-center gap-1.5 rounded-full border border-[#E5E5E5] px-3 py-1.5 text-[12px] font-bold text-[#4B4B4B] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={handleDeactivate} disabled={deactivating}
            className="flex items-center gap-1.5 rounded-full border border-[#E5E5E5] px-3 py-1.5 text-[12px] font-bold text-[#4B4B4B] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50">
            {deactivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Deactivate
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-[#0066FF] hover:text-blue-700 transition-colors">
            {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Hide Availability</> : <><ChevronDown className="h-3.5 w-3.5" /> Availability</>}
          </button>
        </div>

        {/* Availability (expandable) */}
        {expanded && <AvailabilitySection serviceId={service.id} accent={accent} />}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InventoryServicesPage() {
  const [config, setConfig] = useState<InventoryConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [services, setServices] = useState<Record<string, Service[]>>({})
  const [servicesLoading, setServicesLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Load config on mount
  useEffect(() => {
    apiClient.get('/api/v1/inventory/config')
      .then(res => {
        const raw = res.data as { data?: InventoryConfig } | InventoryConfig
        const cfg: InventoryConfig = (raw as { data?: InventoryConfig }).data ?? (raw as InventoryConfig)
        setConfig(cfg)
        if (cfg.service_types?.length) setActiveTab(cfg.service_types[0])
      })
      .catch(() => toast.error('Failed to load inventory config'))
      .finally(() => setConfigLoading(false))
  }, [])

  // Load services when tab changes
  const loadServices = useCallback(async (type: string) => {
    if (services[type]) return // cached
    setServicesLoading(true)
    try {
      const res = await apiClient.get('/api/v1/inventory/services', { params: { type } })
      const raw = res.data as { data?: Service[] } | Service[]
      const list: Service[] = (raw as { data?: Service[] }).data ?? (raw as Service[]) ?? []
      setServices(p => ({ ...p, [type]: list }))
    } catch {
      toast.error('Failed to load services')
    } finally {
      setServicesLoading(false)
    }
  }, [services])

  useEffect(() => { if (activeTab) loadServices(activeTab) }, [activeTab, loadServices])

  // Blank form data
  const blankForm = (): ServiceFormData => ({
    name: '', description: '', base_price: '', capacity: '', image_urls: [],
    attributes: config?.attribute_schema[activeTab]
      ? initAttrs(config.attribute_schema[activeTab].fields)
      : {},
  })

  const formFromService = (s: Service): ServiceFormData => ({
    name: s.name, description: s.description ?? '',
    base_price: String(s.base_price), capacity: String(s.capacity),
    image_urls: s.image_urls ?? [],
    attributes: { ...initAttrs(config?.attribute_schema[activeTab]?.fields ?? []), ...s.attributes },
  })

  const openAdd = () => { setEditingService(null); setFormOpen(true) }
  const openEdit = (s: Service) => { setEditingService(s); setFormOpen(true) }
  const closeForm = () => { setFormOpen(false); setEditingService(null) }

  const handleSubmit = async (data: ServiceFormData) => {
    setSubmitting(true)
    try {
      if (editingService) {
        // PATCH existing
        const res = await apiClient.patch(`/api/v1/inventory/services/${editingService.id}`, {
          name: data.name, description: data.description,
          base_price: Number(data.base_price), capacity: Number(data.capacity),
          image_urls: data.image_urls, attributes: data.attributes,
        })
        const rawU = res.data as { data?: Service } | Service
        const updated: Service = (rawU as { data?: Service }).data ?? (rawU as Service)
        setServices(p => ({ ...p, [activeTab]: p[activeTab]?.map(s => s.id === updated.id ? updated : s) ?? [] }))
        toast.success('Service updated!')
      } else {
        // POST new
        const res = await apiClient.post('/api/v1/inventory/services', {
          name: data.name, description: data.description, type: activeTab,
          base_price: Number(data.base_price), capacity: Number(data.capacity),
          image_urls: data.image_urls, attributes: data.attributes,
        })
        const rawC = res.data as { data?: Service } | Service
        const created: Service = (rawC as { data?: Service }).data ?? (rawC as Service)
        setServices(p => ({ ...p, [activeTab]: [created, ...(p[activeTab] ?? [])] }))
        toast.success('Service added!')
      }
      closeForm()
    } catch {
      toast.error('Failed to save service')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/inventory/services/${id}`)
      setServices(p => ({ ...p, [activeTab]: p[activeTab]?.filter(s => s.id !== id) ?? [] }))
      toast.success('Service deactivated')
    } catch {
      toast.error('Failed to deactivate service')
    }
  }

  // ── Loading ──
  if (configLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          {/* Skeleton header */}
          <div className="animate-pulse space-y-3">
            <div className="h-7 w-48 rounded bg-slate-200" />
            <div className="h-4 w-64 rounded bg-slate-100" />
          </div>
          {/* Skeleton tabs */}
          <div className="flex gap-2 animate-pulse">
            {[80, 100, 90].map((w, i) => <div key={i} className="h-9 rounded-full bg-slate-200" style={{ width: w }} />)}
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Retail special case ──
  if (['products', 'retail'].includes(config?.business_type ?? '')) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0066FF]/10 mx-auto">
            <Package className="h-8 w-8 text-[#0066FF]" />
          </div>
          <h2 className="text-xl font-bold text-[#4B4B4B]">Product Inventory is Managed Separately</h2>
          <p className="text-[14px] text-[#6E6E6E]">For retail/product businesses, manage your inventory in the <strong>Products</strong> section.</p>
          <a href="/inventory/products" className="inline-flex items-center gap-2 rounded-full bg-[#0066FF] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#0052CC] transition-colors">
            Go to Products →
          </a>
        </div>
      </DashboardLayout>
    )
  }

  if (!config || !config.service_types?.length) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto mt-20 text-center">
          <p className="text-[14px] text-[#6E6E6E]">Inventory configuration not available. Contact support.</p>
        </div>
      </DashboardLayout>
    )
  }

  const currentSchema = config.attribute_schema[activeTab] ?? { label: activeTab, fields: [] }
  const currentServices = services[activeTab] ?? []

  return (
    <DashboardLayout>
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.012)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-70" />

      <div className="relative max-w-5xl mx-auto pb-12 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                <CheckCircle2 className="h-3 w-3" />
                {config.business_type.charAt(0).toUpperCase() + config.business_type.slice(1)}
              </span>
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#4B4B4B]">Inventory Services</h1>
            <p className="text-[13px] text-[#6E6E6E] mt-0.5">Manage your service listings, pricing, and date availability</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`, boxShadow: `0 6px 20px ${ACCENT}40` }}>
            <Plus className="h-4 w-4" />
            Add {currentSchema.label}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {config.service_types.map(type => {
            const label = config.attribute_schema[type]?.label ?? type
            const active = activeTab === type
            return (
              <button key={type} onClick={() => setActiveTab(type)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-all duration-200 ${active ? 'text-white shadow-sm' : 'border border-[#E5E5E5] text-[#6E6E6E] bg-white hover:border-[#0066FF] hover:text-[#0066FF]'}`}
                style={active ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` } : {}}>
                {label}
                {services[type] && (
                  <span className={`ml-1.5 text-[10px] rounded-full px-1.5 py-0.5 ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#6E6E6E]'}`}>
                    {services[type].length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Services grid */}
        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : currentServices.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#E5E5E5] p-14 text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-[#0066FF]/10 flex items-center justify-center mx-auto">
              <Package className="h-6 w-6 text-[#0066FF]" />
            </div>
            <p className="font-bold text-[#4B4B4B]">No {currentSchema.label}s yet</p>
            <p className="text-[13px] text-[#6E6E6E]">Click "Add {currentSchema.label}" to create your first listing</p>
            <button onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white mt-2 transition-all"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` }}>
              <Plus className="h-4 w-4" /> Add {currentSchema.label}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentServices.map(s => (
              <ServiceCard key={s.id} service={s} accent={ACCENT}
                onEdit={openEdit} onDeactivate={handleDeactivate} />
            ))}
          </div>
        )}
      </div>

      {/* Form panel */}
      <ServiceFormPanel
        open={formOpen}
        schema={currentSchema.fields}
        editData={editingService ? formFromService(editingService) : blankForm()}
        serviceType={activeTab}
        typeLabel={currentSchema.label}
        accent={ACCENT}
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </DashboardLayout>
  )
}
