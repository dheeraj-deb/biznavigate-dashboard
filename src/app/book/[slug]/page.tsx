'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Copy,
  IndianRupee,
  Loader2,
  MapPin,
  MessageCircle,
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

function defaultCheckoutFor(params: URLSearchParams) {
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

function paymentLabel(mode: 'manual' | 'advance' | 'full') {
  if (mode === 'advance') return 'Advance payment'
  if (mode === 'full') return 'Pay in full now'
  return 'Pay at the venue'
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
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState(() => defaultCheckoutFor(searchParams))

  const accent = page?.config.theme.primary_color || '#0066FF'
  const experience = page?.config.experience_type ?? 'generic'
  const isProduct = experience === 'products'
  const labels = page?.labels ?? { item: 'Item', items: 'Items', customer: 'Customer', request: 'Request' }
  const required = page?.config.required_fields ?? { name: true, phone: true, email: false, address: false, notes: false }
  const paymentMode = page?.config.payment_mode ?? 'manual'

  useEffect(() => {
    setForm((prev) => ({ ...defaultCheckoutFor(searchParams), name: prev.name, phone: prev.phone, email: prev.email, address: prev.address, notes: prev.notes }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience])

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
      const list = unwrap<PublicItem[]>(res) ?? []
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
    if (!page || !slug) return
    const timer = window.setTimeout(() => {
      loadItems()
    }, 300)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, slug, form.check_in, form.check_out, form.guests, form.quantity])

  const total = useMemo(() => {
    if (!selected) return 0
    if (isProduct) return selected.effective_price * (Number(form.quantity) || 1)
    const nights = Math.max(1, Math.round((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86_400_000))
    return selected.effective_price * nights
  }, [form.check_in, form.check_out, form.quantity, isProduct, selected])

  const nights = useMemo(() => {
    if (isProduct) return 0
    return Math.max(1, Math.round((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86_400_000))
  }, [form.check_in, form.check_out, isProduct])

  const formValid = useMemo(() => {
    if (required.name && !form.name.trim()) return false
    if (required.phone && !form.phone.trim()) return false
    if (required.email && !form.email.trim()) return false
    if (required.address && !form.address.trim()) return false
    if (required.notes && !form.notes.trim()) return false
    return true
  }, [form, required])

  const submit = async () => {
    if (!selected || !page || !formValid) return
    setSubmitting(true)
    setError(null)
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
      })
      setConfirmation(unwrap(res))
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not complete your booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyReference = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
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
    const supportUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : ''

    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">You&rsquo;re all set</h1>
            <p className="mt-2 text-sm text-gray-600">{confirmation.message}</p>
          </div>

          <div className="mt-6 space-y-3 rounded-xl border bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reference</p>
                <p className="mt-0.5 truncate font-mono text-xs text-gray-800">{confirmation.reference_id}</p>
              </div>
              <button
                onClick={() => copyReference(confirmation.reference_id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            {selected && (
              <div className="border-t pt-3">
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {isProduct
                    ? `Quantity: ${form.quantity}`
                    : `${form.check_in} → ${form.check_out} · ${form.guests} guest(s)`}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: accent }}>
                  {money(total, page.business.currency)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Next steps</p>
            <p className="mt-1">
              {paymentMode === 'manual'
                ? 'Payment will be collected by the business directly. We&rsquo;ll send confirmation details over WhatsApp.'
                : 'You&rsquo;ll receive payment instructions on WhatsApp shortly.'}
            </p>
          </div>

          {supportUrl && (
            <a
              href={supportUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md border bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <MessageCircle className="h-4 w-4" />
              Need help? Chat with us on WhatsApp
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 py-10 text-white" style={{ background: `linear-gradient(135deg, ${accent}, #111827)` }}>
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{labels.request}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            {heroTitle(experience, page.business.business_name)}
          </h1>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm opacity-90">
            {(page.config.contact.address || page.business.address) && (
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{page.config.contact.address || page.business.address}</span>
            )}
            {(page.config.contact.phone || page.business.phone) && (
              <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" />{page.config.contact.phone || page.business.phone}</span>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className={`grid gap-3 ${isProduct ? 'sm:grid-cols-[1fr_auto]' : 'md:grid-cols-[1fr_1fr_1fr_auto]'}`}>
              {!isProduct ? (
                <>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span className="flex items-center gap-1 text-gray-600"><CalendarDays className="h-4 w-4" />Check-in</span>
                    <input
                      className="h-10 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-gray-400"
                      type="date"
                      value={form.check_in}
                      onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span className="text-gray-600">Check-out</span>
                    <input
                      className="h-10 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-gray-400"
                      type="date"
                      min={form.check_in}
                      value={form.check_out}
                      onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span className="flex items-center gap-1 text-gray-600"><Users className="h-4 w-4" />Guests</span>
                    <input
                      className="h-10 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-gray-400"
                      type="number"
                      min="1"
                      value={form.guests}
                      onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    />
                  </label>
                </>
              ) : (
                <label className="space-y-1.5 text-sm font-medium">
                  <span className="flex items-center gap-1 text-gray-600"><ShoppingBag className="h-4 w-4" />Quantity</span>
                  <input
                    className="h-10 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-gray-400"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </label>
              )}
              <button
                onClick={loadItems}
                className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ background: accent }}
              >
                {itemsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </div>
          </div>

          {view === 'list' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {itemsLoading && items.length === 0 && (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <div className="aspect-[16/9] animate-pulse bg-slate-100" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))
              )}
              {items.map((item) => {
                const img = item.primary_image_url || item.image_urls?.[0]
                const isSelected = selected?.item_id === item.item_id
                return (
                  <button
                    key={item.item_id}
                    onClick={() => {
                      setSelected(item)
                      setView('detail')
                    }}
                    className="overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    style={isSelected ? { boxShadow: `0 0 0 2px ${accent}` } : {}}
                  >
                    <div className="aspect-[16/9] bg-slate-100">
                      {img ? (
                        <img src={img} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-sm text-slate-400">{labels.item}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-900">{item.name}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {item.description || item.details?.service_type || item.item_type}
                          </p>
                        </div>
                        <p className="whitespace-nowrap text-base font-bold" style={{ color: accent }}>
                          {money(item.effective_price, page.business.currency)}
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">
                        {isProduct
                          ? `${item.stock_quantity ?? 'Available'} in stock`
                          : `${item.available_slots ?? 'Available'} slot(s) available`}
                      </p>
                    </div>
                  </button>
                )
              })}
              {!itemsLoading && items.length === 0 && (
                <div className="col-span-full rounded-2xl border bg-white p-10 text-center text-gray-500">
                  No available {labels.items.toLowerCase()} found for the selected details.
                </div>
              )}
            </div>
          )}

          {view === 'detail' && selected && (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="aspect-[16/9] bg-slate-100">
                {(selected.primary_image_url || selected.image_urls?.[0]) ? (
                  <img src={selected.primary_image_url || selected.image_urls?.[0]} alt={selected.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-400">{labels.item}</div>
                )}
              </div>
              <div className="space-y-5 p-5">
                <button onClick={() => setView('list')} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  Back to {labels.items.toLowerCase()}
                </button>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selected.name}</h2>
                    <p className="mt-2 text-gray-600">{selected.description || selected.details?.service_type || selected.item_type}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total estimate</p>
                    <p className="mt-0.5 text-2xl font-bold" style={{ color: accent }}>{money(total, page.business.currency)}</p>
                    {!isProduct && <p className="text-xs text-gray-500">{nights} night{nights === 1 ? '' : 's'}</p>}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{isProduct ? 'Stock' : 'Availability'}</p>
                    <p className="mt-1 font-semibold text-gray-900">{isProduct ? `${selected.stock_quantity ?? 'Available'} in stock` : `${selected.available_slots ?? 'Available'} slot(s)`}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Price</p>
                    <p className="mt-1 font-semibold text-gray-900">{money(selected.effective_price, page.business.currency)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{isProduct ? 'Quantity' : 'Guests'}</p>
                    <p className="mt-1 font-semibold text-gray-900">{isProduct ? form.quantity : form.guests}</p>
                  </div>
                </div>
                {selected.details && Object.keys(selected.details).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900">Details</h3>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {Object.entries(selected.details).slice(0, 10).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="font-semibold capitalize text-gray-600">{key.replace(/_/g, ' ')}: </span>
                          <span className="text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setView('form')}
                  className="inline-flex h-11 w-full items-center justify-center rounded-md px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
                  style={{ background: accent }}
                >
                  Continue to {labels.request.toLowerCase()}
                </button>
              </div>
            </div>
          )}

          {view === 'form' && selected && (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <button onClick={() => setView('detail')} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to details
              </button>
              <h2 className="text-xl font-bold text-gray-900">Your details</h2>
              <p className="mt-1 text-sm text-gray-500">
                We&rsquo;ll use these to confirm your {labels.request.toLowerCase()}. {paymentLabel(paymentMode)}.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label={`${labels.customer} name`} required={required.name}>
                  <input
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Phone number" required={required.phone}>
                  <input
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Email" required={required.email}>
                  <input
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                    inputMode="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                {!isProduct && (
                  <Field label="Guest count">
                    <input
                      className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                      type="number"
                      min="1"
                      value={form.guests}
                      onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    />
                  </Field>
                )}
                <Field label="Address" required={required.address} className="sm:col-span-2">
                  <textarea
                    className="min-h-20 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </Field>
                <Field label="Notes" required={required.notes} className="sm:col-span-2">
                  <textarea
                    className="min-h-20 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="Anything we should know?"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </Field>
              </div>

              {error && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">{money(total, page.business.currency)}</p>
                </div>
                <p className="text-xs text-gray-500">{paymentLabel(paymentMode)}</p>
              </div>

              <button
                disabled={submitting || !formValid}
                onClick={submit}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: accent }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm {labels.request.toLowerCase()}
              </button>
            </div>
          )}
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Summary</h2>
            {selected ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                    <BedDouble className="h-4 w-4 text-gray-500" />
                    {selected.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {isProduct ? `Quantity: ${form.quantity}` : `${form.check_in} → ${form.check_out} · ${form.guests} guest(s)`}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="inline-flex items-center font-bold text-gray-900">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {money(total, page.business.currency).replace(/^₹/, '')}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{paymentLabel(paymentMode)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Select a {labels.item.toLowerCase()} to see details and continue.
              </p>
            )}
          </div>

          {(page.config.policies.cancellation || page.config.policies.terms || page.config.policies.refund) && (
            <div className="rounded-2xl border bg-white p-5 text-xs text-gray-600 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Policies</h3>
              <div className="mt-2 space-y-2">
                {page.config.policies.cancellation && <p><span className="font-semibold text-gray-800">Cancellation:</span> {page.config.policies.cancellation}</p>}
                {page.config.policies.refund && <p><span className="font-semibold text-gray-800">Refund:</span> {page.config.policies.refund}</p>}
                {page.config.policies.terms && <p><span className="font-semibold text-gray-800">Terms:</span> {page.config.policies.terms}</p>}
              </div>
            </div>
          )}

          {(page.config.contact.whatsapp || page.business.whatsapp_number) && (
            <a
              className="flex items-center justify-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              href={`https://wa.me/${(page.config.contact.whatsapp || page.business.whatsapp_number || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              Need help? Chat with us
            </a>
          )}
        </aside>
      </section>
    </main>
  )
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`space-y-1.5 text-sm font-medium ${className ?? ''}`}>
      <span className="flex items-center gap-1 text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
