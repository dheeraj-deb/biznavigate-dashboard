'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  UserRound,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useBusinessType } from '@/hooks/use-business-type'
import {
  AppointmentSalesListing,
  AppointmentSalesStaff,
  AppointmentSalesVisit,
  useAssignAppointmentVisit,
  useAppointmentSalesListings,
  useAppointmentSalesOverview,
  useAppointmentSalesStaff,
  useAppointmentSalesVisits,
  useCreateAppointmentSalesVisit,
  useUpdateAppointmentVisitStatus,
} from '@/hooks/use-appointment-sales'

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function visitDateTime(dateKey: string, time: string) {
  return `${dateKey}T${time}:00+05:30`
}

function dayStart(dateKey: string) {
  return `${dateKey}T00:00:00+05:30`
}

function dayEnd(dateKey: string) {
  return `${dateKey}T23:59:59+05:30`
}

function money(value?: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num <= 0) return 'Price on request'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

function timeLabel(value?: string) {
  if (!value) return 'Any time'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
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

function statusTone(status: string) {
  if (status === 'completed' || status === 'converted') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'cancelled' || status === 'no_show' || status === 'lost') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'confirmed' || status === 'arrived') return 'border-blue-200 bg-blue-50 text-[#0066FF]'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function VisitRow({
  visit,
  staff,
  onStatus,
  onAssign,
  busy,
  assignBusy,
}: {
  visit: AppointmentSalesVisit
  staff: AppointmentSalesStaff[]
  onStatus: (visitId: string, status: string) => void
  onAssign: (visitId: string, salesStaffId?: string) => void
  busy?: boolean
  assignBusy?: boolean
}) {
  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 xl:grid-cols-[minmax(0,1fr)_190px_220px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-950">{visit.customer_name || visit.customer_phone || 'Customer'}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${statusTone(visit.status)}`}>
            {visit.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            {timeLabel(visit.scheduled_start)}
          </span>
          <span className="truncate">{visit.item_name || 'General visit'}</span>
          <span className="truncate">{visit.sales_staff_name || 'Auto assign'}</span>
        </div>
      </div>
      <label className="space-y-1 xl:self-center">
        <span className="text-[10px] font-bold uppercase text-slate-400">Salesperson</span>
        <select
          value={visit.sales_staff_id ?? ''}
          disabled={assignBusy}
          onChange={(event) => onAssign(visit.visit_id, event.target.value || undefined)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
        >
          <option value="">Auto next free</option>
          {staff.map((person) => (
            <option
              key={person.sales_staff_id}
              value={person.sales_staff_id}
              disabled={person.is_active === false && person.sales_staff_id !== visit.sales_staff_id}
            >
              {person.name}{person.is_active === false ? ' (paused)' : ''}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {visit.customer_phone ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 bg-white"
            onClick={() => window.open(`https://wa.me/${visit.customer_phone?.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </Button>
        ) : null}
        {['arrived', 'completed', 'no_show', 'lost'].map((status) => (
          <Button
            key={status}
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy || visit.status === status}
            onClick={() => onStatus(visit.visit_id, status)}
            className={status === 'no_show' || status === 'lost' ? 'text-rose-600' : 'text-slate-700'}
          >
            {status === 'arrived' ? 'Arrived' : status === 'completed' ? 'Done' : status === 'no_show' ? 'No show' : 'Lost'}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default function AppointmentSalesPage() {
  const { businessType } = useBusinessType()
  const isProperty = businessType === 'real_estate'
  const copy = useMemo(() => ({
    title: isProperty ? 'Property Visit Desk' : 'Vehicle Visit Desk',
    eyebrow: isProperty ? 'Property sales' : 'Used car sales',
    noun: isProperty ? 'property' : 'vehicle',
    plural: isProperty ? 'properties' : 'vehicles',
    visit: isProperty ? 'site visit' : 'showroom visit',
    icon: isProperty ? Building2 : Car,
  }), [isProperty])

  const overviewQuery = useAppointmentSalesOverview()
  const listingsQuery = useAppointmentSalesListings()
  const staffQuery = useAppointmentSalesStaff()
  const todayVisitsQuery = useAppointmentSalesVisits({
    from_date: dayStart(localDateKey()),
    to_date: dayEnd(localDateKey()),
    limit: 100,
  })
  const createVisit = useCreateAppointmentSalesVisit()
  const updateVisit = useUpdateAppointmentVisitStatus()
  const assignVisit = useAssignAppointmentVisit()

  const listings = listingsQuery.data ?? []
  const staff = staffQuery.data ?? []
  const todayVisits = todayVisitsQuery.data ?? []
  const overview = overviewQuery.data
  const [selectedDate, setSelectedDate] = useState(localDateKey())
  const [selectedListingId, setSelectedListingId] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [selectedTime, setSelectedTime] = useState('10:00')
  const [customer, setCustomer] = useState({
    customer_name: '',
    customer_phone: '',
    notes: '',
  })

  const Icon = copy.icon
  const maxVisitsPerTime = overview?.settings?.max_visits_per_time ?? 10

  useEffect(() => {
    if (!selectedListingId && listings[0]?.item_id) {
      setSelectedListingId(listings[0].item_id)
    }
  }, [listings, selectedListingId])

  function submitVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTime) return
    createVisit.mutate({
      item_id: selectedListingId || undefined,
      sales_staff_id: selectedStaffId || undefined,
      customer_name: customer.customer_name,
      customer_phone: customer.customer_phone,
      scheduled_start: visitDateTime(selectedDate, selectedTime),
      location: overview?.settings?.default_visit_location,
      visit_type: isProperty ? 'site_visit' : 'showroom_visit',
      notes: customer.notes,
    }, {
      onSuccess: () => {
        setCustomer({ customer_name: '', customer_phone: '', notes: '' })
      },
    })
  }

  function updateStatus(visitId: string, status: string) {
    updateVisit.mutate({ visit_id: visitId, status })
  }

  function assignSalesperson(visitId: string, salesStaffId?: string) {
    assignVisit.mutate({ visit_id: visitId, sales_staff_id: salesStaffId })
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
                <p className="text-xs font-bold uppercase text-[#0066FF]">{copy.eyebrow}</p>
                <h1 className="truncate text-2xl font-bold text-slate-950">{copy.title}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/crm/inbox">
                  <MessageCircle className="h-4 w-4" />
                  Inbox
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/appointment-sales/staff">
                  <Users className="h-4 w-4" />
                  Staff
                </Link>
              </Button>
              <Button asChild className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                <Link href="/appointment-sales-setup">
                  <Plus className="h-4 w-4" />
                  Setup
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">Active {copy.plural}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{overview?.summary.active_listings ?? listings.length}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">Sales staff</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{overview?.summary.active_staff ?? staff.length}</p>
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-[#0066FF]">Visits today</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{overview?.summary.visits_today ?? 0}</p>
          </div>
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-green-700">Upcoming visits</p>
            <p className="mt-2 text-2xl font-bold text-green-950">{overview?.summary.upcoming_visits ?? 0}</p>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Book a {copy.visit}</h2>
                <p className="mt-1 text-sm text-slate-500">Ask the customer their available time and save that time.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="w-fit text-[#0066FF]">
                <Link href="/appointment-sales/visits">All visits</Link>
              </Button>
            </div>

            <form onSubmit={submitVisit} className="mt-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Customer name</span>
                  <Input
                    value={customer.customer_name}
                    onChange={(event) => setCustomer((current) => ({ ...current, customer_name: event.target.value }))}
                    placeholder="Customer name"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">WhatsApp number</span>
                  <Input
                    value={customer.customer_phone}
                    onChange={(event) => setCustomer((current) => ({ ...current, customer_phone: event.target.value }))}
                    placeholder="Customer phone"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_130px_180px]">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">{copy.noun}</span>
                  <select
                    value={selectedListingId}
                    onChange={(event) => setSelectedListingId(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  >
                    <option value="">General visit</option>
                    {listings.map((listing) => (
                      <option key={listing.item_id} value={listing.item_id}>
                        {listing.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Date</span>
                  <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Time</span>
                  <Input type="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Salesperson</span>
                  <select
                    value={selectedStaffId}
                    onChange={(event) => setSelectedStaffId(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  >
                    <option value="">Auto assign</option>
                    {staff.map((person) => (
                      <option key={person.sales_staff_id} value={person.sales_staff_id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-slate-700">
                Up to {maxVisitsPerTime} customers can be saved for the same time. If that time is full, BizNavigo will ask you to check the next hour with the customer.
              </div>

              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase text-slate-500">Notes</span>
                <Textarea
                  value={customer.notes}
                  onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))}
                  placeholder={isProperty ? 'Budget, locality, family visit, loan query...' : 'Model interest, exchange, finance, test-drive request...'}
                />
              </label>

              <Button type="submit" disabled={!selectedTime || createVisit.isPending} className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                {createVisit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Book visit
              </Button>
            </form>
          </Card>

          <div className="space-y-5">
            <Card className="border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">AI employees</h2>
                  <p className="mt-1 text-sm text-slate-500">Simple work status.</p>
                </div>
                <Bot className="h-5 w-5 text-[#0066FF]" />
              </div>
              <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
                {(overview?.ai_employees ?? []).map((employee) => (
                  <div key={employee.key} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-slate-950">{employee.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {employee.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{employee.summary}</p>
                    <p className="mt-2 text-xs font-semibold text-[#0066FF]">{employee.next}</p>
                  </div>
                ))}
                {!overview?.ai_employees?.length ? (
                  <div className="p-4 text-sm text-slate-500">AI visit employees will appear after setup.</div>
                ) : null}
              </div>
            </Card>

            <Card className="border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-950">Saved {copy.plural}</h2>
                <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
                  <Link href="/appointment-sales/listings">Edit</Link>
                </Button>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {listings.slice(0, 5).map((listing) => (
                  <div key={listing.item_id} className="py-3">
                    <p className="truncate text-sm font-bold text-slate-950">{listing.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{listingLine(listing, isProperty) || 'Details not added'}</p>
                    <p className="mt-1 text-xs font-bold text-slate-900">{money(listing.price)}</p>
                  </div>
                ))}
                {!listings.length ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Add at least one {copy.noun} to start answering enquiries.
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-slate-200 p-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Today's work</h2>
                <p className="mt-1 text-sm text-slate-500">Call, reassign, and update visits from here.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
                <Link href="/appointment-sales/visits">
                  Open
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {todayVisitsQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
              </div>
            ) : todayVisits.length ? (
              todayVisits.map((visit) => (
                <VisitRow
                  key={visit.visit_id}
                  visit={visit}
                  staff={staff}
                  onStatus={updateStatus}
                  onAssign={assignSalesperson}
                  busy={updateVisit.isPending}
                  assignBusy={assignVisit.isPending}
                />
              ))
            ) : (
              <div className="p-4 text-sm text-slate-500">No customer visits for today.</div>
            )}
          </Card>

          <Card className="border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-xs font-bold uppercase text-slate-300">Customer flow</p>
            <div className="mt-4 space-y-4 text-sm text-slate-200">
              <div className="flex gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 text-blue-300" />
                <p>Customer asks from WhatsApp, Instagram, Google ad or direct chat.</p>
              </div>
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 text-blue-300" />
                <p>AI shows saved {copy.plural} and answers simple questions from business data.</p>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-blue-300" />
                <p>Interested customers share a visit time that is saved directly.</p>
              </div>
              <div className="flex gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-blue-300" />
                <p>A salesperson is assigned from the available team for that time.</p>
              </div>
            </div>
            {overview?.settings?.default_visit_location ? (
              <div className="mt-5 rounded-md bg-white/10 p-3 text-sm">
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{overview.settings.default_visit_location}</span>
                </div>
              </div>
            ) : null}
            {staff[0]?.phone ? (
              <div className="mt-3 rounded-md bg-white/10 p-3 text-sm">
                <div className="flex gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{staff[0].name}: {staff[0].phone}</span>
                </div>
              </div>
            ) : null}
          </Card>
        </section>
      </div>
    </DashboardLayout>
  )
}
