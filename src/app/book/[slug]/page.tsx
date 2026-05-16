'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Users,
} from 'lucide-react'

type Experience = 'hospitality' | 'events' | 'services' | 'healthcare' | 'education' | 'products' | 'generic'

interface PublicPageData {
  business: {
    business_name: string
    business_type?: string
    phone?: string
    whatsapp_number?: string
    address?: string
    city?: string
    currency?: string
  }
  config: {
    enabled: boolean
    experience_type: Experience
    payment_mode: 'manual' | 'advance' | 'full'
    theme: { primary_color: string; show_banner: boolean }
    policies: { cancellation: string; refund: string; terms: string }
    contact: { phone: string; whatsapp: string; address: string }
    required_fields: { name: boolean; phone: boolean; email: boolean; address: boolean; notes: boolean }
  }
  labels: { item: string; items: string; customer: string; request: string }
}

interface PublicItem {
  item_id: string
  item_type: string
  name: string
  description?: string
  base_price: number
  effective_price: number
  available_slots?: number | null
  stock_quantity?: number | null
  primary_image_url?: string
  image_urls?: string[]
  details?: Record<string, any>
  variants?: Array<{ variant_id: string; name: string; price: number; stock_quantity: number }>
}

function unwrap<T>(response: any): T {
  return (response?.data?.data ?? response?.data ?? response) as T
}

function money(value: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0)
}

function defaultCheckoutFor(experience: Experience, params: URLSearchParams) {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  return {
    check_in: params.get('checkIn') ?? params.get('date') ?? today,
    check_out: params.get('checkOut') ?? tomorrow,
    guests: params.get('guests') ?? '1',
    quantity: params.get('quantity') ?? '1',
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  }
}

function heroTitle(experience: Experience, businessName: string) {
  if (experience === 'products') return `Shop from ${businessName}`
  if (experience === 'healthcare') return `Book an appointment with ${businessName}`
  if (experience === 'education') return `Explore programs at ${businessName}`
  if (experience === 'events') return `Reserve your spot with ${businessName}`
  if (experience === 'services') return `Request a service from ${businessName}`
  return `Book your stay at ${businessName}`
}

export default function PublicBookingPage() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const slug = params.slug
  const [page, setPage] = useState<PublicPageData | null>(null)
  const [items, setItems] = useState<PublicItem[]>([])
  const [selected, setSelected] = useState<PublicItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<any>(null)
  const [view, setView] = useState<'list' | 'detail' | 'form'>('list')
  const [form, setForm] = useState(() => defaultCheckoutFor('generic', searchParams))

  const accent = page?.config.theme.primary_color || '#0066FF'
  const experience = page?.config.experience_type ?? 'generic'
  const isProduct = experience === 'products'
  const labels = page?.labels ?? { item: 'Item', items: 'Items', customer: 'Customer', request: 'Request' }

  useEffect(() => {
    setForm(defaultCheckoutFor(experience, searchParams))
  }, [experience, searchParams])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    apiClient.get(`/public-booking/${slug}`)
      .then((res) => setPage(unwrap<PublicPageData>(res)))
      .catch(() => setPage(null))
      .finally(() => setLoading(false))
  }, [slug])

  const loadItems = async () => {
    if (!slug) return
    setItemsLoading(true)
    try {
      const res = await apiClient.get(`/public-booking/${slug}/items`, {
        params: {
          checkIn: form.check_in,
          checkOut: form.check_out,
          guests: form.guests,
          quantity: form.quantity,
        },
      })
      const list = unwrap<{ data: PublicItem[] }>(res).data ?? []
      setItems(list)
      const preselected = searchParams.get('itemId')
      const nextSelected = list.find((item) => item.item_id === preselected) ?? null
      setSelected(nextSelected)
      setView(nextSelected ? 'detail' : 'list')
    } finally {
      setItemsLoading(false)
    }
  }

  useEffect(() => {
    if (page) loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const total = useMemo(() => {
    if (!selected) return 0
    if (isProduct) return selected.effective_price * (Number(form.quantity) || 1)
    const nights = Math.max(1, Math.round((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86_400_000))
    return selected.effective_price * nights
  }, [form.check_in, form.check_out, form.quantity, isProduct, selected])

  const submit = async () => {
    if (!selected || !page) return
    setSubmitting(true)
    try {
      const res = await apiClient.post(`/public-booking/${slug}/requests`, {
        item_id: selected.item_id,
        check_in: form.check_in,
        check_out: form.check_out,
        guests: Number(form.guests) || 1,
        quantity: Number(form.quantity) || 1,
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          notes: form.notes,
        },
        notes: form.notes,
        continue_on_whatsapp: true,
      })
      setConfirmation(unwrap(res))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-gray-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  if (!page) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking link not found</h1>
          <p className="mt-2 text-gray-500">This public link is disabled or unavailable.</p>
        </div>
      </div>
    )
  }

  if (confirmation) {
    const whatsappNumber = page.config.contact.whatsapp || page.business.whatsapp_number || page.config.contact.phone || page.business.phone
    const whatsappText = selected
      ? [
          `Hi, I want to confirm this booking.`,
          `Reference: ${confirmation.reference_id}`,
          `${labels.item}: ${selected.name}`,
          isProduct ? `Quantity: ${form.quantity}` : `Dates: ${form.check_in} to ${form.check_out}`,
          `Name: ${form.name}`,
          `Phone: ${form.phone}`,
          form.address ? `Address: ${form.address}` : '',
          form.notes ? `Notes: ${form.notes}` : '',
        ].filter(Boolean).join('\n')
      : `Hi, I want to confirm my request. Reference: ${confirmation.reference_id}`
    const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}` : ''

    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Request received</h1>
          <p className="mt-2 text-gray-600">{confirmation.message}</p>
          <p className="mt-4 rounded-lg bg-slate-50 p-3 font-mono text-xs text-gray-600">Reference: {confirmation.reference_id}</p>
          {whatsappUrl && (
            <a href={whatsappUrl} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-bold text-white" style={{ background: accent }}>
              Continue on WhatsApp
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 py-8 text-white" style={{ background: `linear-gradient(135deg, ${accent}, #111827)` }}>
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{labels.request}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold md:text-5xl">{heroTitle(experience, page.business.business_name)}</h1>
          <div className="mt-5 flex flex-wrap gap-4 text-sm opacity-90">
            {(page.config.contact.address || page.business.address) && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{page.config.contact.address || page.business.address}</span>}
            {(page.config.contact.phone || page.business.phone) && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{page.config.contact.phone || page.business.phone}</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className={`grid gap-3 ${isProduct ? 'md:grid-cols-[1fr_auto]' : 'md:grid-cols-[1fr_1fr_1fr_auto]'}`}>
              {!isProduct && (
                <>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span className="flex items-center gap-1 text-gray-600"><CalendarDays className="h-4 w-4" />Check-in / Date</span>
                    <input className="h-10 w-full rounded-md border px-3" type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span className="text-gray-600">Check-out</span>
                    <input className="h-10 w-full rounded-md border px-3" type="date" min={form.check_in} value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span className="flex items-center gap-1 text-gray-600"><Users className="h-4 w-4" />Guests</span>
                    <input className="h-10 w-full rounded-md border px-3" type="number" min="1" value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
                  </label>
                </>
              )}
              {isProduct && (
                <label className="space-y-1.5 text-sm font-medium">
                  <span className="flex items-center gap-1 text-gray-600"><ShoppingBag className="h-4 w-4" />Quantity</span>
                  <input className="h-10 w-full rounded-md border px-3" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </label>
              )}
              <button onClick={loadItems} className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md px-4 text-sm font-bold text-white" style={{ background: accent }}>
                {itemsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </div>
          </div>

          {view === 'list' && (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <button
                key={item.item_id}
                onClick={() => {
                  setSelected(item)
                  setView('detail')
                }}
                className={`overflow-hidden rounded-xl border bg-white text-left shadow-sm transition ${selected?.item_id === item.item_id ? 'ring-2' : 'hover:border-slate-300'}`}
                style={selected?.item_id === item.item_id ? { boxShadow: `0 0 0 2px ${accent}` } : {}}
              >
                <div className="aspect-[16/9] bg-slate-100">
                  {item.primary_image_url ? <img src={item.primary_image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400">{labels.item}</div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description || item.details?.service_type || item.item_type}</p>
                    </div>
                    <p className="whitespace-nowrap font-bold" style={{ color: accent }}>{money(item.effective_price, page.business.currency)}</p>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    {isProduct ? `${item.stock_quantity ?? 'Available'} in stock` : `${item.available_slots ?? 'Available'} slot(s) available`}
                  </p>
                </div>
              </button>
            ))}
            {!itemsLoading && items.length === 0 && (
              <div className="col-span-full rounded-xl border bg-white p-10 text-center text-gray-500">
                No available {labels.items.toLowerCase()} found for the selected details.
              </div>
            )}
          </div>
          )}

          {view === 'detail' && selected && (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="aspect-[16/9] bg-slate-100">
                {selected.primary_image_url ? (
                  <img src={selected.primary_image_url} alt={selected.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-400">{labels.item}</div>
                )}
              </div>
              <div className="space-y-5 p-5">
                <button onClick={() => setView('list')} className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  Back to {labels.items}
                </button>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selected.name}</h2>
                    <p className="mt-2 text-gray-600">{selected.description || selected.details?.service_type || selected.item_type}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-right">
                    <p className="text-xs font-semibold uppercase text-gray-500">Total Estimate</p>
                    <p className="text-xl font-bold" style={{ color: accent }}>{money(total, page.business.currency)}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-bold uppercase text-gray-500">{isProduct ? 'Stock' : 'Availability'}</p>
                    <p className="mt-1 font-semibold text-gray-900">{isProduct ? `${selected.stock_quantity ?? 'Available'} in stock` : `${selected.available_slots ?? 'Available'} slot(s)`}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-bold uppercase text-gray-500">Price</p>
                    <p className="mt-1 font-semibold text-gray-900">{money(selected.effective_price, page.business.currency)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-bold uppercase text-gray-500">{isProduct ? 'Quantity' : 'Guests'}</p>
                    <p className="mt-1 font-semibold text-gray-900">{isProduct ? form.quantity : form.guests}</p>
                  </div>
                </div>
                {selected.details && Object.keys(selected.details).length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900">Details</h3>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {Object.entries(selected.details).slice(0, 10).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="font-semibold capitalize text-gray-600">{key.replace(/_/g, ' ')}: </span>
                          <span className="text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setView('form')} className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-bold text-white" style={{ background: accent }}>
                  Book / Continue
                </button>
              </div>
            </div>
          )}

          {view === 'form' && selected && (
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <button onClick={() => setView('detail')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to details
              </button>
              <h2 className="text-xl font-bold text-gray-900">Enter {labels.customer.toLowerCase()} details</h2>
              <p className="mt-1 text-sm text-gray-500">After this, you will continue on WhatsApp to confirm the booking.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {!isProduct && (
                  <input className="h-10 rounded-md border px-3 text-sm" placeholder="Guest count" type="number" min="1" value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
                )}
                <input className="h-10 rounded-md border px-3 text-sm" placeholder={`${labels.customer} name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="h-10 rounded-md border px-3 text-sm" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="h-10 rounded-md border px-3 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <textarea className="min-h-24 rounded-md border px-3 py-2 text-sm md:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <textarea className="min-h-24 rounded-md border px-3 py-2 text-sm md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <button disabled={submitting} onClick={submit} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-bold text-white disabled:opacity-50" style={{ background: accent }}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm and Continue on WhatsApp
              </button>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Summary</h2>
          {selected && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="flex items-center gap-2 font-semibold"><BedDouble className="h-4 w-4" />{selected.name}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-600"><IndianRupee className="h-4 w-4" />Total {money(total, page.business.currency)}</p>
              <p className="mt-1 text-xs text-gray-500">
                {isProduct ? `Quantity: ${form.quantity}` : `${form.check_in} to ${form.check_out} · ${form.guests} guest(s)`}
              </p>
            </div>
          )}

          {!selected && <p className="mt-3 text-sm text-gray-500">Select a {labels.item.toLowerCase()} to see details and continue.</p>}

          {(page.config.policies.cancellation || page.config.policies.terms) && (
            <div className="mt-5 space-y-2 border-t pt-4 text-xs text-gray-500">
              {page.config.policies.cancellation && <p><strong>Cancellation:</strong> {page.config.policies.cancellation}</p>}
              {page.config.policies.terms && <p><strong>Terms:</strong> {page.config.policies.terms}</p>}
            </div>
          )}

          {(page.config.contact.whatsapp || page.business.whatsapp_number) && (
            <a className="mt-4 flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-bold" href={`https://wa.me/${page.config.contact.whatsapp || page.business.whatsapp_number}`} target="_blank">
              <Mail className="h-4 w-4" />
              Contact on WhatsApp
            </a>
          )}
        </aside>
      </section>
    </main>
  )
}
