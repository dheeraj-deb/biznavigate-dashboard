'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Loader2, Package, CheckCircle2, IndianRupee, Users,
  BedDouble, Star, Clock, MapPin, ShieldCheck,
  Wifi, Car, Utensils, Waves, Dumbbell, Wind, Coffee,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
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

/** API returns either service_id or id depending on the endpoint */
function sid(s: Service) { return s.service_id }

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, parking: Car, restaurant: Utensils, pool: Waves,
  gym: Dumbbell, ac: Wind, breakfast: Coffee,
}
const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi', parking: 'Parking', restaurant: 'Restaurant', pool: 'Pool',
  gym: 'Gym', ac: 'AC', breakfast: 'Breakfast', spa: 'Spa',
  rooftop: 'Rooftop', campfire: 'Campfire', trekking: 'Trekking',
}

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

// ── Hospitality Card (hotel / resort / villa) ────────────────────────────────

function HospitalityCard({ service, onEdit, onDeactivate }: {
  service: Service
  onEdit: (s: Service) => void
  onDeactivate: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const attrs = service.attributes ?? {}
  const starRating = Number(attrs.star_rating) || 0
  const checkIn = attrs.check_in as string | undefined
  const checkOut = attrs.check_out as string | undefined
  const location = attrs.location as string | undefined
  const cancellation = attrs.cancellation_policy as string | undefined
  const amenities = (attrs.amenities as string[]) ?? []
  const roomTypes = attrs.rooms as Array<{ type: string; capacity: string; price: string; qty: string }> | undefined

  const handleDeactivate = async () => {
    if (!confirm(`Deactivate "${service.name}"?`)) return
    setDeactivating(true)
    try { await onDeactivate(sid(service)) } finally { setDeactivating(false) }
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">

      {/* Cover image */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {service.image_urls?.[0] ? (
          <img src={service.image_urls[0]} alt={service.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
            <BedDouble className="h-12 w-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${service.is_active ? 'bg-green-500/90 text-white' : 'bg-slate-700/80 text-white'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${service.is_active ? 'bg-white' : 'bg-slate-400'}`} />
            {service.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1 text-[12px] font-bold text-[#4B4B4B] shadow-sm">
            <IndianRupee className="h-3 w-3 text-[#0066FF]" />
            {fmt(service.base_price).replace('₹', '')}
            <span className="text-[10px] font-normal text-[#6E6E6E] ml-0.5">/night</span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">

        {/* Name + stars */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-[15px] text-[#4B4B4B] leading-snug">{service.name}</h3>
            {service.description && (
              <p className="text-[11px] text-[#6E6E6E] mt-0.5 line-clamp-1">{service.description}</p>
            )}
          </div>
          {starRating > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="h-3 w-3" fill={starRating >= s ? '#F59E0B' : 'none'} stroke={starRating >= s ? '#F59E0B' : '#D1D5DB'} />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <span className="flex items-center gap-1 font-semibold text-[#4B4B4B]">
            <Users className="h-3.5 w-3.5 text-[#0066FF]" />{service.capacity} guests
          </span>
          {checkIn && <span className="flex items-center gap-1 text-[#6E6E6E]"><Clock className="h-3.5 w-3.5" />In: {checkIn}</span>}
          {checkOut && <span className="flex items-center gap-1 text-[#6E6E6E]"><Clock className="h-3.5 w-3.5" />Out: {checkOut}</span>}
          {location && (
            <span className="flex items-center gap-1 text-[#6E6E6E] truncate max-w-[120px]">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />{location}
            </span>
          )}
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 5).map(a => {
              const Icon = AMENITY_ICONS[a]
              return (
                <span key={a} className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-slate-50 px-2 py-0.5 text-[11px] text-[#6E6E6E] font-medium">
                  {Icon && <Icon className="h-3 w-3" />}{AMENITY_LABELS[a] ?? a}
                </span>
              )
            })}
            {amenities.length > 5 && (
              <span className="rounded-full border border-[#E5E5E5] bg-slate-50 px-2 py-0.5 text-[11px] text-[#6E6E6E] font-medium">+{amenities.length - 5}</span>
            )}
          </div>
        )}

        {/* Cancellation */}
        {cancellation && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#6E6E6E] bg-slate-50 rounded-lg px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />{cancellation}
          </div>
        )}

        {/* Actions */}
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
          {roomTypes && roomTypes.length > 0 && (
            <button onClick={() => setExpanded(v => !v)}
              className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-[#0066FF] hover:text-blue-700 transition-colors">
              {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Hide</> : <><ChevronDown className="h-3.5 w-3.5" /> {roomTypes.length} room type{roomTypes.length !== 1 ? 's' : ''}</>}
            </button>
          )}
        </div>

        {/* Room types table */}
        {expanded && roomTypes && roomTypes.length > 0 && (
          <div className="rounded-xl border border-[#E5E5E5] overflow-hidden">
            <div className="bg-[#F9F9F9] px-4 py-2 grid grid-cols-4 gap-2 text-[11px] font-bold text-[#6E6E6E]">
              <span>Type</span><span className="text-center">Guests</span>
              <span className="text-center">Price/Night</span><span className="text-center">Available</span>
            </div>
            {roomTypes.map((r, i) => (
              <div key={i} className="border-t border-[#E5E5E5] px-4 py-2.5 grid grid-cols-4 gap-2 items-center text-[12px]">
                <span className="font-semibold text-[#4B4B4B]">{r.type}</span>
                <span className="text-center text-[#6E6E6E]">{r.capacity}</span>
                <span className="text-center font-bold text-[#4B4B4B]">{r.price ? fmt(Number(r.price)) : '—'}</span>
                <span className="text-center text-[#6E6E6E]">{r.qty}</span>
              </div>
            ))}
          </div>
        )}

        {/* Availability */}
        {expanded && sid(service) && <AvailabilitySection serviceId={sid(service)} accent={ACCENT} />}
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
      await onDeactivate(sid(service))
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
        {expanded && sid(service) && <AvailabilitySection serviceId={sid(service)} accent={accent} />}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const HOSPITALITY_TYPES = ['hospitality', 'hotel', 'resort', 'camping']
const HOSPITALITY_SERVICE_TYPES = ['room', 'villa', 'dormitory', 'tent_site', 'cabin', 'glamping']
const BIZ_TYPE_MAP: Record<string, string> = {
  hotel: 'hospitality', resort: 'hospitality', camping: 'hospitality',
}

export default function InventoryServicesPage() {
  const { user } = useAuthStore()
  const rawBizType = user?.business_type ?? ''
  const bizType = BIZ_TYPE_MAP[rawBizType] ?? rawBizType
  const isHospitality = HOSPITALITY_TYPES.includes(bizType)

  const [config, setConfig] = useState<InventoryConfig | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Load config (for form schema only)
  useEffect(() => {
    apiClient.get('/api/v1/inventory/config')
      .then(res => {
        const raw = res.data as { data?: InventoryConfig } | InventoryConfig
        const cfg: InventoryConfig = (raw as { data?: InventoryConfig }).data ?? (raw as InventoryConfig)
        setConfig(cfg)
      })
      .catch(() => {})
  }, [])

  // Load services — hospitality fetches all 6 sub-types in parallel
  useEffect(() => {
    if (!bizType) return
    setServicesLoading(true)

    const fetchAll = apiClient
      .get('/api/v1/inventory/services', isHospitality ? {} : { params: { type: bizType } })
      .then(res => {
        const body = res.data as { data?: Service[] } | Service[]
        return (body as { data?: Service[] }).data ?? (body as Service[]) ?? []
      })

    fetchAll
      .then(list => setServices(list))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setServicesLoading(false))
  }, [bizType, isHospitality])

  const schemaKey = isHospitality ? 'hospitality' : bizType
  const schemaFields = config?.attribute_schema?.[schemaKey]?.fields ?? []

  const blankForm = (): ServiceFormData => ({
    name: '', description: '', base_price: '', capacity: '', image_urls: [],
    attributes: initAttrs(schemaFields),
  })

  const formFromService = (s: Service): ServiceFormData => ({
    name: s.name, description: s.description ?? '',
    base_price: String(s.base_price), capacity: String(s.capacity),
    image_urls: s.image_urls ?? [],
    attributes: { ...initAttrs(schemaFields), ...s.attributes },
  })

  const openAdd = () => { setEditingService(null); setFormOpen(true) }
  const openEdit = (s: Service) => { setEditingService(s); setFormOpen(true) }
  const closeForm = () => { setFormOpen(false); setEditingService(null) }

  const handleSubmit = async (data: ServiceFormData) => {
    const serviceType = isHospitality ? 'hospitality' : bizType
    setSubmitting(true)
    try {
      if (editingService) {
        const res = await apiClient.patch(`/api/v1/inventory/services/${sid(editingService)}`, {
          name: data.name, description: data.description,
          base_price: Number(data.base_price), capacity: Number(data.capacity),
          image_urls: data.image_urls, attributes: data.attributes,
        })
        const rawU = res.data as { data?: Service } | Service
        const updated: Service = (rawU as { data?: Service }).data ?? (rawU as Service)
        setServices(p => p.map(s => sid(s) === sid(updated) ? updated : s))
        toast.success('Updated!')
      } else {
        const res = await apiClient.post('/api/v1/inventory/services', {
          name: data.name, description: data.description, type: serviceType,
          base_price: Number(data.base_price), capacity: Number(data.capacity),
          image_urls: data.image_urls, attributes: data.attributes,
        })
        const rawC = res.data as { data?: Service } | Service
        const created: Service = (rawC as { data?: Service }).data ?? (rawC as Service)
        setServices(p => [created, ...p])
        toast.success('Added!')
      }
      closeForm()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/inventory/services/${id}`)
      setServices(p => p.filter(s => sid(s) !== id))
      toast.success('Deactivated')
    } catch {
      toast.error('Failed to deactivate')
    }
  }

  // ── Products redirect ──
  if (['products', 'retail'].includes(bizType)) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0066FF]/10 mx-auto">
            <Package className="h-8 w-8 text-[#0066FF]" />
          </div>
          <h2 className="text-xl font-bold text-[#4B4B4B]">Product Inventory is Managed Separately</h2>
          <p className="text-[14px] text-[#6E6E6E]">Manage your inventory in the <strong>Products</strong> section.</p>
          <a href="/inventory/products" className="inline-flex items-center gap-2 rounded-full bg-[#0066FF] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#0052CC] transition-colors">
            Go to Products →
          </a>
        </div>
      </DashboardLayout>
    )
  }

  const typeLabel = isHospitality ? 'Property' : (bizType.charAt(0).toUpperCase() + bizType.slice(1))
  const addHref = '/inventory/add'

  return (
    <DashboardLayout>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.012)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-70" />

      <div className="relative max-w-5xl mx-auto pb-12 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                {isHospitality ? <BedDouble className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {typeLabel}
              </span>
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#4B4B4B]">
              {isHospitality ? 'Properties & Rooms' : 'Inventory Services'}
            </h1>
            <p className="text-[13px] text-[#6E6E6E] mt-0.5">
              {services.length} listing{services.length !== 1 ? 's' : ''} · manage pricing and availability
            </p>
          </div>
          <a href={addHref}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`, boxShadow: `0 6px 20px ${ACCENT}40` }}>
            <Plus className="h-4 w-4" /> Add {typeLabel}
          </a>
        </div>

        {/* Grid */}
        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#E5E5E5] p-16 text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${ACCENT}10` }}>
              {isHospitality ? <BedDouble className="h-7 w-7" style={{ color: ACCENT }} /> : <Package className="h-7 w-7" style={{ color: ACCENT }} />}
            </div>
            <p className="font-bold text-[#4B4B4B]">No {typeLabel.toLowerCase()}s yet</p>
            <p className="text-[13px] text-[#6E6E6E]">Add your first listing to get started</p>
            <a href={addHref}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white mt-2 transition-all"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` }}>
              <Plus className="h-4 w-4" /> Add {typeLabel}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map(s =>
              isHospitality ? (
                <HospitalityCard key={sid(s)} service={s}
                  onEdit={openEdit} onDeactivate={handleDeactivate} />
              ) : (
                <ServiceCard key={sid(s)} service={s} accent={ACCENT}
                  onEdit={openEdit} onDeactivate={handleDeactivate} />
              )
            )}
          </div>
        )}
      </div>

      <ServiceFormPanel
        open={formOpen}
        schema={schemaFields}
        editData={editingService ? formFromService(editingService) : blankForm()}
        serviceType={isHospitality ? 'hospitality' : bizType}
        typeLabel={typeLabel}
        accent={ACCENT}
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </DashboardLayout>
  )
}
