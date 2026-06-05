'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CalendarClock, Car, Download, Loader2, Plus, Save, Trash2, UserRound } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBusinessType } from '@/hooks/use-business-type'
import {
  AppointmentSalesListing,
  AppointmentSalesStaff,
  useAppointmentSalesSetup,
  useCompleteAppointmentSalesSetup,
} from '@/hooks/use-appointment-sales'
import { useImportWhatsAppCatalog, useWhatsAppCatalogPreview } from '@/hooks/use-whatsapp-catalog'

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

function moneyNumber(value: string) {
  const parsed = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function optionalText(value?: string) {
  const clean = value?.trim()
  return clean ? clean : undefined
}

function defaultAvailability(days = [1, 2, 3, 4, 5, 6], start = '10:00', end = '18:00') {
  return days.map((day) => ({
    day_of_week: day,
    start_time: start,
    end_time: end,
    window_type: 'working',
    label: 'Working hours',
    is_active: true,
  }))
}

function blankStaff(): AppointmentSalesStaff {
  return {
    name: '',
    phone: '',
    email: '',
    role: 'sales_consultant',
    title: 'Sales Consultant',
    priority: 1,
    is_active: true,
    availability: defaultAvailability(),
  }
}

function blankListing(vertical: string): AppointmentSalesListing {
  return vertical === 'real_estate'
    ? {
        name: '',
        price: 0,
        property_type: 'flat',
        listing_type: 'sale',
        bedrooms: 2,
        bathrooms: 2,
        area_sqft: 1000,
        locality: '',
        city: '',
        category: 'Flat',
      }
    : {
        name: '',
        price: 0,
        make: '',
        model_name: '',
        year: new Date().getFullYear(),
        fuel_type: 'Petrol',
        transmission: 'Manual',
        km_driven: 0,
        condition: 'used',
        category: 'Car',
      }
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-bold uppercase text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export default function AppointmentSalesSetupPage() {
  const router = useRouter()
  const { businessType } = useBusinessType()
  const setupQuery = useAppointmentSalesSetup()
  const completeSetup = useCompleteAppointmentSalesSetup()
  const catalogPreview = useWhatsAppCatalogPreview(true)
  const importCatalog = useImportWhatsAppCatalog()
  const vertical = businessType === 'real_estate' ? 'real_estate' : 'used_cars'
  const isProperty = vertical === 'real_estate'
  const copy = useMemo(() => ({
    title: isProperty ? 'Property Sales Setup' : 'Vehicle Sales Setup',
    noun: isProperty ? 'property' : 'vehicle',
    plural: isProperty ? 'properties' : 'vehicles',
    visit: isProperty ? 'site visit' : 'showroom visit',
    icon: isProperty ? Building2 : Car,
  }), [isProperty])

  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState(isProperty ? 60 : 45)
  const [staff, setStaff] = useState<AppointmentSalesStaff[]>([blankStaff()])
  const [listings, setListings] = useState<AppointmentSalesListing[]>([blankListing(vertical)])

  useEffect(() => {
    const data = setupQuery.data
    if (!data) return
    setLocation(data.settings.default_visit_location ?? '')
    setDuration(Number(data.settings.slot_duration_minutes ?? (isProperty ? 60 : 45)))
    if (data.staff?.length) setStaff(data.staff)
    if (data.listings?.length) {
      setListings(data.listings.map((listing) => ({
        ...listing,
        price: Number(listing.price ?? 0),
      })))
    }
  }, [setupQuery.data, isProperty])

  function updateStaff(index: number, patch: Partial<AppointmentSalesStaff>) {
    setStaff((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function updateStaffDays(index: number, day: number, checked: boolean) {
    const current = staff[index]?.availability ?? []
    const working = current.filter((item) => (item.window_type ?? 'working') === 'working')
    const blocks = current.filter((item) => (item.window_type ?? 'working') !== 'working')
    const start = working[0]?.start_time ?? '10:00'
    const end = working[0]?.end_time ?? '18:00'
    const days = new Set(working.map((item) => item.day_of_week))
    if (checked) days.add(day)
    else days.delete(day)
    const nextDays = [...days].sort()
    updateStaff(index, {
      availability: [
        ...defaultAvailability(nextDays, start, end),
        ...blocks.filter((item) => nextDays.includes(item.day_of_week)),
      ],
    })
  }

  function updateStaffTime(index: number, field: 'start_time' | 'end_time', value: string) {
    const current = staff[index]?.availability ?? defaultAvailability()
    updateStaff(index, {
      availability: current.map((item) =>
        (item.window_type ?? 'working') === 'working'
          ? { ...item, [field]: value }
          : item,
      ),
    })
  }

  function updateListing(index: number, patch: Partial<AppointmentSalesListing>) {
    setListings((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  function handleSubmit() {
    const cleanStaff = staff
      .filter((person) => person.name.trim())
      .map((person, index) => ({
        ...person,
        name: person.name.trim(),
        phone: optionalText(person.phone),
        email: optionalText(person.email),
        title: optionalText(person.title),
        priority: index + 1,
        availability: person.availability?.length ? person.availability : defaultAvailability(),
      }))
    const cleanListings = listings
      .filter((listing) => listing.name.trim())
      .map((listing) => ({
        ...listing,
        price: Number(listing.price ?? 0),
      }))

    completeSetup.mutate({
      vertical_type: vertical,
      default_visit_type: isProperty ? 'site_visit' : 'showroom_visit',
      default_visit_location: location,
      slot_duration_minutes: duration,
      visit_buffer_minutes: 0,
      auto_assign_visits: true,
      staff: cleanStaff,
      listings: cleanListings,
    }, {
      onSuccess: () => router.push('/appointment-sales'),
    })
  }

  const Icon = copy.icon

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-[#0066FF]">Appointment sales</p>
                <h1 className="text-2xl font-bold text-slate-950">{copy.title}</h1>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={completeSetup.isPending} className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
              {completeSetup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save setup
            </Button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className="border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[#0066FF]" />
                <h2 className="text-lg font-bold text-slate-950">WhatsApp catalog</h2>
              </div>
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                {catalogPreview.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking connected catalog...
                  </div>
                ) : catalogPreview.data?.hasCatalog ? (
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {catalogPreview.data.count} item{catalogPreview.data.count === 1 ? '' : 's'} found
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Import existing WhatsApp items as {copy.plural}. You can edit details after import.
                    </p>
                    {catalogPreview.data.products?.[0]?.name ? (
                      <p className="mt-2 truncate text-xs font-semibold text-slate-600">
                        Latest: {catalogPreview.data.products[0].name}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm leading-5 text-slate-500">
                    {catalogPreview.data?.message || 'No WhatsApp catalog is linked yet.'}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full gap-2 bg-white"
                disabled={importCatalog.isPending || !catalogPreview.data?.hasCatalog || catalogPreview.data.count === 0}
                onClick={() => importCatalog.mutate({ limit: 100 })}
              >
                {importCatalog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Import from WhatsApp
              </Button>
            </Card>

            <Card className="border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-[#0066FF]" />
                <h2 className="text-lg font-bold text-slate-950">Sales staff</h2>
              </div>
              <div className="mt-4 space-y-3">
                {staff.map((person, index) => {
                  const working = (person.availability ?? []).filter((item) => (item.window_type ?? 'working') === 'working')
                  const days = new Set(working.map((item) => item.day_of_week))
                  const start = working[0]?.start_time ?? '10:00'
                  const end = working[0]?.end_time ?? '18:00'
                  return (
                    <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Name">
                          <Input value={person.name} onChange={(event) => updateStaff(index, { name: event.target.value })} placeholder="Salesperson name" />
                        </Field>
                        <Field label="Phone">
                          <Input value={person.phone ?? ''} onChange={(event) => updateStaff(index, { phone: event.target.value })} placeholder="WhatsApp number" />
                        </Field>
                        <Field label="Title">
                          <Input value={person.title ?? ''} onChange={(event) => updateStaff(index, { title: event.target.value })} placeholder="Sales Executive" />
                        </Field>
                      </div>
                      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_120px_120px_auto]">
                        <div>
                          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Available days</p>
                          <div className="flex flex-wrap gap-2">
                            {DAYS.map((day) => (
                              <label key={day.value} className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={days.has(day.value)}
                                  onChange={(event) => updateStaffDays(index, day.value, event.target.checked)}
                                />
                                {day.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <Field label="Start">
                          <Input type="time" value={start} onChange={(event) => updateStaffTime(index, 'start_time', event.target.value)} />
                        </Field>
                        <Field label="End">
                          <Input type="time" value={end} onChange={(event) => updateStaffTime(index, 'end_time', event.target.value)} />
                        </Field>
                        <Button
                          type="button"
                          variant="outline"
                          className="self-end bg-white"
                          onClick={() => setStaff((current) => current.filter((_, i) => i !== index))}
                          disabled={staff.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button type="button" variant="outline" className="mt-4 gap-2 bg-white" onClick={() => setStaff((current) => [...current, blankStaff()])}>
                <Plus className="h-4 w-4" />
                Add salesperson
              </Button>
            </Card>

            <Card className="border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-[#0066FF]" />
                <h2 className="text-lg font-bold text-slate-950">First {copy.plural}</h2>
              </div>
              <div className="mt-4 space-y-3">
                {listings.map((listing, index) => (
                  <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_160px_140px]">
                      <Field label={isProperty ? 'Property name' : 'Vehicle name'}>
                        <Input value={listing.name} onChange={(event) => updateListing(index, { name: event.target.value })} placeholder={isProperty ? '2 BHK near Kakkanad' : '2021 Honda City VX'} />
                      </Field>
                      <Field label="Price">
                        <Input value={String(listing.price || '')} onChange={(event) => updateListing(index, { price: moneyNumber(event.target.value) })} placeholder="4500000" />
                      </Field>
                      <Field label="Category">
                        <Input value={listing.category ?? ''} onChange={(event) => updateListing(index, { category: event.target.value })} placeholder={isProperty ? 'Flat' : 'Sedan'} />
                      </Field>
                    </div>

                    {isProperty ? (
                      <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <Field label="Locality">
                          <Input value={listing.locality ?? ''} onChange={(event) => updateListing(index, { locality: event.target.value })} />
                        </Field>
                        <Field label="City">
                          <Input value={listing.city ?? ''} onChange={(event) => updateListing(index, { city: event.target.value })} />
                        </Field>
                        <Field label="Bedrooms">
                          <Input type="number" value={listing.bedrooms ?? ''} onChange={(event) => updateListing(index, { bedrooms: Number(event.target.value) })} />
                        </Field>
                        <Field label="Area sqft">
                          <Input type="number" value={listing.area_sqft ?? ''} onChange={(event) => updateListing(index, { area_sqft: Number(event.target.value) })} />
                        </Field>
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-3 md:grid-cols-5">
                        <Field label="Make">
                          <Input value={listing.make ?? ''} onChange={(event) => updateListing(index, { make: event.target.value })} />
                        </Field>
                        <Field label="Model">
                          <Input value={listing.model_name ?? ''} onChange={(event) => updateListing(index, { model_name: event.target.value })} />
                        </Field>
                        <Field label="Year">
                          <Input type="number" value={listing.year ?? ''} onChange={(event) => updateListing(index, { year: Number(event.target.value) })} />
                        </Field>
                        <Field label="Fuel">
                          <Input value={listing.fuel_type ?? ''} onChange={(event) => updateListing(index, { fuel_type: event.target.value })} />
                        </Field>
                        <Field label="KM">
                          <Input type="number" value={listing.km_driven ?? ''} onChange={(event) => updateListing(index, { km_driven: Number(event.target.value) })} />
                        </Field>
                      </div>
                    )}
                    <div className="mt-3 flex justify-end">
                      <Button type="button" variant="ghost" className="text-red-600" onClick={() => setListings((current) => current.filter((_, i) => i !== index))} disabled={listings.length === 1}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" className="mt-4 gap-2 bg-white" onClick={() => setListings((current) => [...current, blankListing(vertical)])}>
                <Plus className="h-4 w-4" />
                Add {copy.noun}
              </Button>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[#0066FF]" />
                <h2 className="text-lg font-bold text-slate-950">Visit rules</h2>
              </div>
              <div className="mt-4 space-y-3">
                <Field label={`${copy.visit} location`}>
                  <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder={isProperty ? 'Site office or project address' : 'Showroom address'} />
                </Field>
                <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-slate-700">
                  Ask the customer for a visit time and save that time. Lunch, break and temporary pause can be changed from Sales Staff.
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 bg-slate-950 p-5 text-white">
              <p className="text-xs font-bold uppercase text-slate-300">Simple flow</p>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <p>1. Customer asks about a {copy.noun}.</p>
                <p>2. AI or staff shares saved listing details.</p>
                <p>3. Interested customer gives their available visit time.</p>
                <p>4. If that time is already full, ask for the next hour.</p>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
