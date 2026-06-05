'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AlertCircle, ArrowLeft, Building2, Car, CheckCircle2, Edit3, ImageIcon, Loader2, Plus, RefreshCw, Save, Star, Trash2, Upload, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api-client'
import { useBusinessType } from '@/hooks/use-business-type'
import { useSyncCatalog } from '@/hooks/use-whatsapp-catalog'
import {
  AppointmentSalesListing,
  useAppointmentSalesListings,
  useDeleteAppointmentSalesListing,
  useUpdateAppointmentListingStatus,
  useUpsertAppointmentSalesListing,
} from '@/hooks/use-appointment-sales'

const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'inactive', label: 'Hidden' },
]

function optional(value?: string) {
  const clean = value?.trim()
  return clean ? clean : undefined
}

function numberOrUndefined(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function money(value?: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 'Price on request'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(parsed)
}

function statusClass(status?: string) {
  if (status === 'available') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'reserved') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'sold') return 'border-blue-200 bg-blue-50 text-[#0066FF]'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function syncClass(status?: string) {
  if (status === 'synced' || status === 'imported') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'pending' || status === 'pending_delete') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'needs_review') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (status === 'failed') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-slate-200 bg-slate-100 text-slate-500'
}

function syncLabel(status?: string) {
  if (status === 'needs_review') return 'needs details'
  if (status === 'pending_delete') return 'removing'
  return (status ?? 'not synced').replace(/_/g, ' ')
}

function blankListing(isProperty: boolean): AppointmentSalesListing {
  return isProperty
    ? {
        name: '',
        price: 0,
        status: 'available',
        property_type: 'flat',
        listing_type: 'sale',
        bedrooms: 2,
        bathrooms: 2,
        area_sqft: 1000,
        city: '',
        locality: '',
        loan_support_available: false,
      }
    : {
        name: '',
        price: 0,
        status: 'available',
        category: 'Car',
        make: '',
        model_name: '',
        year: new Date().getFullYear(),
        fuel_type: 'Petrol',
        transmission: 'Manual',
        condition: 'used',
        finance_available: false,
        exchange_accepted: false,
        test_drive_available: true,
      }
}

function listingImages(listing: AppointmentSalesListing) {
  const urls = [
    listing.primary_image_url,
    ...(listing.image_urls ?? []),
  ].filter(Boolean) as string[]
  return Array.from(new Set(urls))
}

function listingLine(listing: AppointmentSalesListing, isProperty: boolean) {
  if (isProperty) {
    return [
      listing.property_type,
      listing.bedrooms ? `${listing.bedrooms} BHK` : null,
      listing.area_sqft ? `${listing.area_sqft} sqft` : null,
      listing.locality,
      listing.city,
    ].filter(Boolean).join(' | ')
  }
  return [
    listing.year,
    listing.make,
    listing.model_name,
    listing.fuel_type,
    listing.km_driven ? `${listing.km_driven.toLocaleString('en-IN')} km` : null,
  ].filter(Boolean).join(' | ')
}

export default function AppointmentSalesListingsPage() {
  const { businessType } = useBusinessType()
  const isProperty = businessType === 'real_estate'
  const copy = useMemo(() => ({
    title: isProperty ? 'Property Listings' : 'Vehicle Listings',
    noun: isProperty ? 'property' : 'vehicle',
    plural: isProperty ? 'properties' : 'vehicles',
    icon: isProperty ? Building2 : Car,
  }), [isProperty])
  const listingsQuery = useAppointmentSalesListings()
  const upsertListing = useUpsertAppointmentSalesListing()
  const updateStatus = useUpdateAppointmentListingStatus()
  const deleteListing = useDeleteAppointmentSalesListing()
  const syncCatalog = useSyncCatalog()
  const [form, setForm] = useState<AppointmentSalesListing>(blankListing(isProperty))
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [imageLink, setImageLink] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const listings = listingsQuery.data ?? []
  const readyCount = listings.filter((listing) => listing.is_ready_for_whatsapp).length
  const Icon = copy.icon

  function editListing(listing: AppointmentSalesListing) {
    setForm({
      ...blankListing(isProperty),
      ...listing,
      price: Number(listing.price ?? 0),
      status: listing.status ?? 'available',
      finance_available: Boolean(listing.finance_available),
      exchange_accepted: Boolean(listing.exchange_accepted),
      test_drive_available: listing.test_drive_available !== false,
      loan_support_available: Boolean(listing.loan_support_available),
    })
    const images = listingImages(listing)
    setImagePreviews(images)
    setPrimaryImageIndex(0)
  }

  function resetForm() {
    setForm(blankListing(isProperty))
    setImagePreviews([])
    setImageLink('')
    setPrimaryImageIndex(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`)
        continue
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((current) => [...current, reader.result as string])
      }
      reader.readAsDataURL(file)
    }
  }

  function removeImage(index: number) {
    setImagePreviews((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setPrimaryImageIndex((current) => {
      if (current === index) return 0
      if (current > index) return current - 1
      return current
    })
  }

  function addImageLink() {
    const clean = imageLink.trim()
    if (!clean) return
    setImagePreviews((current) => [...current, clean])
    setImageLink('')
  }

  async function uploadNewImages() {
    const newImages = imagePreviews.filter((image) => image.startsWith('data:image/'))
    if (!newImages.length) return imagePreviews

    setUploadingImages(true)
    toast.loading(`Uploading ${newImages.length} photo${newImages.length === 1 ? '' : 's'}...`, { id: 'listing-images' })

    try {
      const response = await apiClient.post('/s3/upload-base64-multiple', {
        images: newImages,
        folder: isProperty ? 'property-listings' : 'vehicle-listings',
      })
      const data = (response as any)?.data?.data ?? (response as any)?.data ?? response
      const uploadedUrls = Array.isArray(data)
        ? data.map((item: any) => item.url ?? item.file_url).filter(Boolean)
        : []
      let uploadIndex = 0
      const finalImages = imagePreviews.map((image) => {
        if (!image.startsWith('data:image/')) return image
        const uploaded = uploadedUrls[uploadIndex]
        uploadIndex += 1
        return uploaded
      }).filter(Boolean)
      toast.success('Photos uploaded', { id: 'listing-images' })
      return finalImages
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Photo upload failed', { id: 'listing-images' })
      throw error
    } finally {
      setUploadingImages(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return

    let imageUrls: string[] = []
    try {
      imageUrls = await uploadNewImages()
    } catch {
      return
    }

    const primaryImage = imageUrls[primaryImageIndex] ?? imageUrls[0]
    upsertListing.mutate({
      ...form,
      name: form.name.trim(),
      description: optional(form.description),
      category: optional(form.category),
      price: Number(form.price ?? 0),
      primary_image_url: primaryImage,
      image_urls: imageUrls.length ? imageUrls : undefined,
      year: numberOrUndefined(form.year),
      km_driven: numberOrUndefined(form.km_driven),
      ownership_count: numberOrUndefined(form.ownership_count),
      bedrooms: numberOrUndefined(form.bedrooms),
      bathrooms: numberOrUndefined(form.bathrooms),
      area_sqft: numberOrUndefined(form.area_sqft),
      floor_number: numberOrUndefined(form.floor_number),
      total_floors: numberOrUndefined(form.total_floors),
    }, {
      onSuccess: resetForm,
    })
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-[#0066FF]">Listings</p>
                <h1 className="truncate text-2xl font-bold text-slate-950">{copy.title}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/appointment-sales">
                  <ArrowLeft className="h-4 w-4" />
                  Visit Desk
                </Link>
              </Button>
              <Button type="button" className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                New {copy.noun}
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
          <Card className="border-slate-200 p-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Saved {copy.plural}</h2>
                <p className="mt-1 text-sm text-slate-500">{readyCount} ready for WhatsApp, {listings.length} total</p>
              </div>
              {listingsQuery.isFetching ? <Loader2 className="h-5 w-5 animate-spin text-[#0066FF]" /> : null}
            </div>

            <div className="divide-y divide-slate-100">
              {listings.map((listing) => (
                <div key={listing.item_id ?? listing.name} className="grid gap-3 p-4 lg:grid-cols-[88px_minmax(0,1fr)_150px]">
                  <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    {listing.primary_image_url ? (
                      <img src={listing.primary_image_url} alt={listing.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-950">{listing.name}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(listing.status)}`}>
                        {listing.status ?? 'available'}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${syncClass(listing.whatsapp_sync_status)}`}>
                        {syncLabel(listing.whatsapp_sync_status)}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-xs text-slate-500">{listingLine(listing, isProperty) || 'Details not added'}</p>
                    <p className="mt-1 text-sm font-bold text-slate-950">{money(listing.price)}</p>
                    {listing.readiness_missing?.length ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                          <AlertCircle className="h-3 w-3" />
                          Fix
                        </span>
                        {listing.readiness_missing.slice(0, 4).map((item) => (
                          <span key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-green-700">Ready for WhatsApp</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <select
                      value={listing.status ?? 'available'}
                      disabled={updateStatus.isPending || !listing.item_id}
                      onChange={(event) => listing.item_id && updateStatus.mutate({ item_id: listing.item_id, status: event.target.value })}
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                    >
                      {STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" size="sm" className="gap-2 bg-white" onClick={() => editListing(listing)}>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    {listing.item_id && listing.is_ready_for_whatsapp && (listing.whatsapp_sync_status === 'failed' || listing.whatsapp_sync_status === 'pending' || listing.whatsapp_sync_status === 'needs_review' || listing.whatsapp_sync_status === 'not_synced') ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-white"
                        disabled={syncCatalog.isPending}
                        onClick={() => syncCatalog.mutate({ productIds: [listing.item_id!] })}
                      >
                        {syncCatalog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Sync
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-rose-600"
                      disabled={deleteListing.isPending || !listing.item_id}
                      onClick={() => listing.item_id && deleteListing.mutate(listing.item_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!listings.length ? (
                <div className="p-8 text-center text-sm text-slate-500">No {copy.plural} added yet.</div>
              ) : null}
            </div>
          </Card>

          <Card className="border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-[#0066FF]" />
              <h2 className="text-lg font-bold text-slate-950">{form.item_id ? 'Edit listing' : `Add ${copy.noun}`}</h2>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase text-slate-500">Name</span>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder={isProperty ? '2 BHK near Kakkanad' : '2021 Honda City VX'} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Price</span>
                  <Input type="number" value={form.price || ''} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Status</span>
                  <select
                    value={form.status ?? 'available'}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  >
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase text-slate-500">Description</span>
                <Textarea value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </label>

              {isProperty ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-bold uppercase text-slate-500">Property type</span>
                      <Input value={form.property_type ?? ''} onChange={(event) => setForm((current) => ({ ...current, property_type: event.target.value }))} />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-bold uppercase text-slate-500">Sale/Rent</span>
                      <select
                        value={form.listing_type ?? 'sale'}
                        onChange={(event) => setForm((current) => ({ ...current, listing_type: event.target.value as AppointmentSalesListing['listing_type'] }))}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                      >
                        <option value="sale">Sale</option>
                        <option value="rent">Rent</option>
                        <option value="lease">Lease</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input type="number" placeholder="Bedrooms" value={form.bedrooms ?? ''} onChange={(event) => setForm((current) => ({ ...current, bedrooms: Number(event.target.value) }))} />
                    <Input type="number" placeholder="Bathrooms" value={form.bathrooms ?? ''} onChange={(event) => setForm((current) => ({ ...current, bathrooms: Number(event.target.value) }))} />
                    <Input type="number" placeholder="Sqft" value={form.area_sqft ?? ''} onChange={(event) => setForm((current) => ({ ...current, area_sqft: Number(event.target.value) }))} />
                    <Input placeholder="Locality" value={form.locality ?? ''} onChange={(event) => setForm((current) => ({ ...current, locality: event.target.value }))} />
                    <Input placeholder="City" value={form.city ?? ''} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                    <Input placeholder="Furnishing" value={form.furnishing ?? ''} onChange={(event) => setForm((current) => ({ ...current, furnishing: event.target.value }))} />
                    <Input type="number" placeholder="Floor" value={form.floor_number ?? ''} onChange={(event) => setForm((current) => ({ ...current, floor_number: Number(event.target.value) }))} />
                    <Input type="number" placeholder="Total floors" value={form.total_floors ?? ''} onChange={(event) => setForm((current) => ({ ...current, total_floors: Number(event.target.value) }))} />
                    <Input placeholder="Parking" value={form.parking ?? ''} onChange={(event) => setForm((current) => ({ ...current, parking: event.target.value }))} />
                    <Input placeholder="Possession" value={form.possession_status ?? ''} onChange={(event) => setForm((current) => ({ ...current, possession_status: event.target.value }))} />
                    <Input placeholder="Facing" value={form.facing ?? ''} onChange={(event) => setForm((current) => ({ ...current, facing: event.target.value }))} />
                    <Input placeholder="RERA ID" value={form.rera_id ?? ''} onChange={(event) => setForm((current) => ({ ...current, rera_id: event.target.value }))} />
                    <Input placeholder="Map link" value={form.map_url ?? ''} onChange={(event) => setForm((current) => ({ ...current, map_url: event.target.value }))} />
                    <Input placeholder="Documents" value={form.documents_status ?? ''} onChange={(event) => setForm((current) => ({ ...current, documents_status: event.target.value }))} />
                    <Input placeholder="Visit landmark" value={form.visit_landmark ?? ''} onChange={(event) => setForm((current) => ({ ...current, visit_landmark: event.target.value }))} />
                  </div>
                  <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={Boolean(form.loan_support_available)} onChange={(event) => setForm((current) => ({ ...current, loan_support_available: event.target.checked }))} />
                    Loan support
                  </label>
                </>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Make" value={form.make ?? ''} onChange={(event) => setForm((current) => ({ ...current, make: event.target.value }))} />
                    <Input placeholder="Model" value={form.model_name ?? ''} onChange={(event) => setForm((current) => ({ ...current, model_name: event.target.value }))} />
                    <Input type="number" placeholder="Year" value={form.year ?? ''} onChange={(event) => setForm((current) => ({ ...current, year: Number(event.target.value) }))} />
                    <Input type="number" placeholder="KM driven" value={form.km_driven ?? ''} onChange={(event) => setForm((current) => ({ ...current, km_driven: Number(event.target.value) }))} />
                    <Input placeholder="Fuel" value={form.fuel_type ?? ''} onChange={(event) => setForm((current) => ({ ...current, fuel_type: event.target.value }))} />
                    <Input placeholder="Transmission" value={form.transmission ?? ''} onChange={(event) => setForm((current) => ({ ...current, transmission: event.target.value }))} />
                    <Input placeholder="Color" value={form.color ?? ''} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} />
                    <Input type="number" placeholder="Ownership count" value={form.ownership_count ?? ''} onChange={(event) => setForm((current) => ({ ...current, ownership_count: Number(event.target.value) }))} />
                    <Input placeholder="Registration number" value={form.registration_number ?? ''} onChange={(event) => setForm((current) => ({ ...current, registration_number: event.target.value }))} />
                    <Input placeholder="RC status" value={form.rc_status ?? ''} onChange={(event) => setForm((current) => ({ ...current, rc_status: event.target.value }))} />
                    <Input type="date" value={form.insurance_valid_until ?? ''} onChange={(event) => setForm((current) => ({ ...current, insurance_valid_until: event.target.value }))} />
                    <Input placeholder="Accident history" value={form.accident_history ?? ''} onChange={(event) => setForm((current) => ({ ...current, accident_history: event.target.value }))} />
                  </div>
                  <Textarea placeholder="Service history" value={form.service_history ?? ''} onChange={(event) => setForm((current) => ({ ...current, service_history: event.target.value }))} />
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      ['finance_available', 'Finance'],
                      ['exchange_accepted', 'Exchange'],
                      ['test_drive_available', 'Test drive'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean((form as any)[key])}
                          onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </>
              )}

              <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click()
                  }}
                  className="rounded-md border-2 border-dashed border-slate-300 bg-white p-5 text-center transition hover:border-[#0066FF] hover:bg-blue-50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Upload className="mx-auto h-7 w-7 text-[#0066FF]" />
                  <p className="mt-2 text-sm font-bold text-slate-950">Add photos</p>
                  <p className="mt-1 text-xs text-slate-500">Select car/property photos from your phone or computer.</p>
                </div>

                {imagePreviews.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={`${preview}-${index}`} className={`group relative overflow-hidden rounded-md border ${index === primaryImageIndex ? 'border-[#0066FF] ring-2 ring-blue-100' : 'border-slate-200'}`}>
                        <button
                          type="button"
                          className="block aspect-square w-full bg-white"
                          onClick={() => setPrimaryImageIndex(index)}
                          title="Set as main photo"
                        >
                          <img src={preview} alt={`Listing photo ${index + 1}`} className="h-full w-full object-cover" />
                        </button>
                        {index === primaryImageIndex ? (
                          <span className="absolute left-1 top-1 rounded-full bg-[#0066FF] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            Main
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="absolute left-1 top-1 rounded-full bg-white/90 p-1 text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100"
                            onClick={() => setPrimaryImageIndex(index)}
                            title="Make main photo"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-rose-600 shadow-sm"
                          onClick={() => removeImage(index)}
                          title="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                    <ImageIcon className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-2">No photos added yet.</p>
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_90px]">
                  <Input
                    placeholder="Or paste one photo link"
                    value={imageLink}
                    onChange={(event) => setImageLink(event.target.value)}
                  />
                  <Button type="button" variant="outline" className="bg-white" onClick={addImageLink}>
                    Add link
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={upsertListing.isPending || uploadingImages || !form.name.trim()} className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                  {upsertListing.isPending || uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save listing
                </Button>
                <Button type="button" variant="outline" className="gap-2 bg-white" onClick={resetForm}>
                  <CheckCircle2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </form>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  )
}
