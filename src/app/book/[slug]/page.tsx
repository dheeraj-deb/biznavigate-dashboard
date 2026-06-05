'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CalendarDays, CheckCircle2, Loader2, Mail, Package, Phone, User, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface PublicBookingItem {
  item_id: string
  item_type?: string
  name: string
  description?: string
  base_price?: string | number
  primary_image_url?: string
  capacity?: number
  stock_quantity?: number | null
  variants?: Array<{
    variant_id: string
    name: string
    price?: string | number
    stock_quantity?: number | null
  }>
}

interface BookingFormState {
  itemId: string
  checkIn: string
  checkOut: string
  guests: string
  quantity: string
  variantId: string
  leadId: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
}

function unwrapData(value: any) {
  return value?.data?.data ?? value?.data ?? value
}

function normalizeItems(raw: any): PublicBookingItem[] {
  const payload = unwrapData(raw)
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.services)
        ? payload.services
        : Array.isArray(payload?.data)
          ? payload.data
          : []

  return list.map((item: any) => ({
    item_id: item.item_id ?? item.service_id ?? item.id ?? '',
    name: item.name ?? item.title ?? 'Stay option',
    item_type: item.item_type,
    description: item.description,
    base_price: item.base_price ?? item.price,
    primary_image_url: item.primary_image_url ?? item.image_url,
    capacity: item.capacity ?? item.max_guests,
    stock_quantity: item.stock_quantity ?? null,
    variants: Array.isArray(item.variants) ? item.variants : [],
  })).filter((item: PublicBookingItem) => item.item_id)
}

function formatPrice(value?: string | number) {
  if (value == null || value === '') return null
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount)) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function PublicBookingForm() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const slug = params.slug

  const [businessName, setBusinessName] = useState('Book your stay')
  const [experienceType, setExperienceType] = useState('hospitality')
  const [items, setItems] = useState<PublicBookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState('We have received your request. Our team will contact you shortly.')

  const [form, setForm] = useState<BookingFormState>(() => ({
    itemId: searchParams.get('itemId') ?? '',
    checkIn: searchParams.get('checkIn') ?? '',
    checkOut: searchParams.get('checkOut') ?? '',
    guests: searchParams.get('guests') ?? '1',
    quantity: searchParams.get('quantity') ?? searchParams.get('guests') ?? '1',
    variantId: searchParams.get('variantId') ?? '',
    leadId: searchParams.get('leadId') ?? '',
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  }))

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      itemId: searchParams.get('itemId') ?? prev.itemId,
      checkIn: searchParams.get('checkIn') ?? prev.checkIn,
      checkOut: searchParams.get('checkOut') ?? prev.checkOut,
      guests: searchParams.get('guests') ?? prev.guests,
      quantity: searchParams.get('quantity') ?? searchParams.get('guests') ?? prev.quantity,
      variantId: searchParams.get('variantId') ?? prev.variantId,
      leadId: searchParams.get('leadId') ?? prev.leadId,
    }))
  }, [searchParams])

  useEffect(() => {
    let cancelled = false

    apiClient.get(`/public-booking/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (cancelled) return
        const payload = unwrapData(res)
        const business = payload?.business ?? {}
        const type = payload?.config?.experience_type ?? business?.business_type ?? 'hospitality'
        setExperienceType(type)
        setBusinessName(business?.business_name ?? business?.name ?? payload?.businessName ?? payload?.name ?? 'Book your stay')
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load booking options')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    let cancelled = false

    const isProduct = experienceType === 'products'
    const params: Record<string, string> = {}
    if (!isProduct && form.checkIn) params.checkIn = form.checkIn
    if (!isProduct && form.checkOut) params.checkOut = form.checkOut
    if (isProduct && form.quantity) params.guests = form.quantity
    if (!isProduct && form.guests) params.guests = form.guests

    setAvailabilityLoading(true)
    apiClient.get(`/public-booking/${encodeURIComponent(slug)}/items`, { params })
      .then((res) => {
        if (cancelled) return
        const normalized = normalizeItems(res)
        setItems(normalized)
        setForm((prev) => ({
          ...prev,
          itemId: prev.itemId || normalized[0]?.item_id || '',
        }))

        if (!isProduct && form.itemId && form.checkIn && form.checkOut) {
          const stillAvailable = normalized.some((item) => item.item_id === form.itemId)
          setAvailabilityMessage(stillAvailable ? '' : 'This option is no longer available for the selected dates.')
        } else {
          setAvailabilityMessage('')
        }
      })
      .catch(() => {
        if (!cancelled) setAvailabilityMessage('Could not check live availability. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug, experienceType, form.checkIn, form.checkOut, form.guests, form.quantity, form.itemId])

  const selectedItem = useMemo(
    () => items.find((item) => item.item_id === form.itemId),
    [form.itemId, items],
  )
  const isProductLink = experienceType === 'products'
  const selectedVariant = selectedItem?.variants?.find((variant) => variant.variant_id === form.variantId)
  const requestedQuantity = Math.max(Number(isProductLink ? form.quantity : form.guests) || 1, 1)
  const availableStock = selectedVariant?.stock_quantity ?? selectedItem?.stock_quantity ?? null
  const isProductStockUnavailable = Boolean(isProductLink && availableStock !== null && availableStock < requestedQuantity)
  const selectedPrice = formatPrice((isProductLink ? selectedVariant?.price : undefined) ?? selectedItem?.base_price)
  const pageTitle = selectedItem
    ? isProductLink ? `Order ${selectedItem.name}` : `Booking for ${selectedItem.name}`
    : businessName
  const isSelectedUnavailable = isProductLink
    ? Boolean(form.itemId && (!selectedItem || isProductStockUnavailable))
    : Boolean(form.itemId && form.checkIn && form.checkOut && !selectedItem && !availabilityLoading)

  const set = (key: keyof BookingFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (!isProductLink) return
    setForm((prev) => {
      const variants = selectedItem?.variants ?? []
      if (!variants.length) {
        return prev.variantId ? { ...prev, variantId: '' } : prev
      }
      if (variants.some((variant) => variant.variant_id === prev.variantId)) return prev
      const availableVariant = variants.find((variant) => variant.stock_quantity == null || variant.stock_quantity > 0)
      return { ...prev, variantId: (availableVariant ?? variants[0]).variant_id }
    })
  }, [isProductLink, selectedItem])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.itemId) return toast.error('Please choose an option')
    if (!isProductLink && !form.checkIn) return toast.error('Please choose a check-in date')
    if (!isProductLink && !form.checkOut) return toast.error('Please choose a check-out date')
    if (isProductLink && selectedItem?.variants?.length && !form.variantId && selectedItem.stock_quantity == null) {
      return toast.error('Please choose a variant')
    }
    if (!form.name.trim()) return toast.error('Please enter your name')
    if (!form.phone.trim()) return toast.error('Please enter your phone number')
    if (isSelectedUnavailable) return toast.error(isProductLink ? 'Requested quantity is not available' : 'This room is no longer available for the selected dates')

    setSubmitting(true)
    try {
      const latest = await apiClient.get(`/public-booking/${encodeURIComponent(slug)}/items`, {
        params: isProductLink
          ? { guests: form.quantity, quantity: form.quantity }
          : { checkIn: form.checkIn, checkOut: form.checkOut, guests: form.guests },
      })
      const latestItems = normalizeItems(latest)
      const latestItem = latestItems.find((item) => item.item_id === form.itemId)
      const latestVariant = latestItem?.variants?.find((variant) => variant.variant_id === form.variantId)
      const latestStock = latestVariant?.stock_quantity ?? latestItem?.stock_quantity ?? null
      if (!latestItem || (isProductLink && latestStock !== null && latestStock < requestedQuantity)) {
        setItems(latestItems)
        setAvailabilityMessage(isProductLink ? 'Requested quantity is not available now.' : 'This option was just booked for these dates. Please choose another date.')
        toast.error(isProductLink ? 'Requested quantity is not available now' : 'This room is no longer available for the selected dates')
        return
      }

      const response = await apiClient.post(`/public-booking/${encodeURIComponent(slug)}/requests`, {
        item_id: form.itemId,
        ...(isProductLink
          ? { quantity: requestedQuantity, variant_id: form.variantId || undefined }
          : { checkIn: form.checkIn, checkOut: form.checkOut, guests: Number(form.guests) || 1 }),
        leadId: form.leadId || undefined,
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
      })
      const result = unwrapData(response)
      setSubmittedMessage(result?.message ?? (isProductLink
        ? 'Your order request has been received and stock is held for confirmation.'
        : 'We have received your booking request. Our team will contact you shortly.'))
      setSubmitted(true)
    } catch (error: any) {
      toast.error(error?.message || 'Could not submit booking request')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <Card className="w-full border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{isProductLink ? 'Order received' : 'Request sent'}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {submittedMessage}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#0066FF]">{isProductLink ? 'Order request' : 'Booking request'}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {selectedItem
              ? isProductLink
                ? `${businessName} will confirm your ${selectedItem.name} order and payment.`
                : `${businessName} will confirm your ${selectedItem.name} booking request.`
              : isProductLink
                ? 'Choose a product, quantity, and share your contact number.'
                : 'Share your stay details and contact number. The team will confirm availability with you.'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              {loading ? (
                <div className="flex min-h-[360px] items-center justify-center text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading booking options...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <section className="space-y-4">
                    <h2 className="text-base font-bold text-slate-900">{isProductLink ? 'Product details' : 'Stay details'}</h2>

                    {(availabilityLoading || availabilityMessage || isSelectedUnavailable) && (
                      <div
                        className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                          availabilityMessage || isSelectedUnavailable
                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                            : 'border-blue-100 bg-blue-50 text-blue-800'
                        }`}
                      >
                        {availabilityLoading ? (
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <span>
                          {availabilityLoading
                            ? 'Checking live availability...'
                            : availabilityMessage || (isProductLink ? 'Requested quantity is not available.' : 'This option is no longer available for the selected dates.')}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label>{isProductLink ? 'Product' : 'Room or service'}</Label>
                      <Select value={form.itemId} onValueChange={(value) => set('itemId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.item_id} value={item.item_id}>
                              {item.name}{formatPrice(item.base_price) ? ` - ${formatPrice(item.base_price)}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isProductLink && Boolean(selectedItem?.variants?.length) && (
                      <div className="space-y-1.5">
                        <Label>Variant</Label>
                        <Select value={form.variantId} onValueChange={(value) => set('variantId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a variant" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedItem?.variants?.map((variant) => (
                              <SelectItem
                                key={variant.variant_id}
                                value={variant.variant_id}
                                disabled={variant.stock_quantity !== null && variant.stock_quantity !== undefined && variant.stock_quantity <= 0}
                              >
                                {variant.name}{formatPrice(variant.price) ? ` - ${formatPrice(variant.price)}` : ''}
                                {variant.stock_quantity === 0 ? ' - Out of stock' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {!isProductLink && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Check-in
                          </Label>
                          <Input
                            type="date"
                            value={form.checkIn}
                            onChange={(event) => set('checkIn', event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Check-out
                          </Label>
                          <Input
                            type="date"
                            value={form.checkOut}
                            min={form.checkIn}
                            onChange={(event) => set('checkOut', event.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 sm:max-w-[220px]">
                      <Label className="flex items-center gap-1.5">
                        {isProductLink ? <Package className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                        {isProductLink ? 'Quantity' : 'Guests'}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={isProductLink ? form.quantity : form.guests}
                        onChange={(event) => set(isProductLink ? 'quantity' : 'guests', event.target.value)}
                      />
                      {isProductLink && availableStock !== null && (
                        <p className="text-xs text-slate-500">{availableStock} available now</p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-base font-bold text-slate-900">Contact details</h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={form.name}
                            onChange={(event) => set('name', event.target.value)}
                            className="pl-9"
                            placeholder="Your name"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={form.phone}
                            onChange={(event) => set('phone', event.target.value)}
                            className="pl-9"
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(event) => set('email', event.target.value)}
                          className="pl-9"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Address</Label>
                      <Input
                        value={form.address}
                        onChange={(event) => set('address', event.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <textarea
                        value={form.notes}
                        onChange={(event) => set('notes', event.target.value)}
                        placeholder="Any special request?"
                        className="h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                  </section>

                  <Button
                    type="submit"
                    disabled={submitting || availabilityLoading || isSelectedUnavailable}
                    className="h-11 w-full bg-[#0066FF] hover:bg-[#0052CC]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isProductLink ? 'Placing order...' : 'Sending request...'}
                      </>
                    ) : (
                      isProductLink ? 'Place order request' : 'Send booking request'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-slate-900">{isProductLink ? 'Order summary' : 'Selected option'}</h2>
                {selectedItem ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-md border border-blue-100 bg-[#F7FAFF] px-3 py-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#0066FF]">{isProductLink ? 'Selected product' : 'Selected property'}</p>
                      <p className="mt-1 text-lg font-bold text-slate-950">{selectedItem.name}</p>
                    </div>
                    {selectedItem.primary_image_url && (
                      <img
                        src={selectedItem.primary_image_url}
                        alt={selectedItem.name}
                        className="aspect-video w-full rounded-md object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{selectedItem.name}</p>
                      {selectedItem.description && (
                        <p className="mt-1 text-sm text-slate-600">{selectedItem.description}</p>
                      )}
                    </div>
                    <div className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {selectedPrice ?? 'Price will be confirmed'}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">{isProductLink ? 'Choose a product to continue.' : 'Choose a room or service to continue.'}</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default function PublicBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <PublicBookingForm />
    </Suspense>
  )
}
