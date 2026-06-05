'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, MessageCircle, UserRound, XCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AppointmentSalesStaff,
  AppointmentSalesVisit,
  useAssignAppointmentVisit,
  useAppointmentSalesStaff,
  useAppointmentSalesVisits,
  useUpdateAppointmentVisitStatus,
} from '@/hooks/use-appointment-sales'

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function displayDate(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function visitDayKey(value?: string) {
  if (!value) return 'No date'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'No date'
  return parsed.toLocaleDateString('en-CA')
}

function visitDayLabel(value?: string) {
  if (!value) return 'No date'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

function statusTone(status: string) {
  if (status === 'completed' || status === 'converted') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'lost') return 'border-slate-300 bg-slate-100 text-slate-600'
  if (status === 'cancelled' || status === 'no_show') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'confirmed' || status === 'arrived') return 'border-blue-200 bg-blue-50 text-[#0066FF]'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function VisitCard({
  visit,
  staff,
  busy,
  assignBusy,
  onStatus,
  onAssign,
}: {
  visit: AppointmentSalesVisit
  staff: AppointmentSalesStaff[]
  busy?: boolean
  assignBusy?: boolean
  onStatus: (visitId: string, status: string) => void
  onAssign: (visitId: string, salesStaffId?: string) => void
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-950">{visit.customer_name || visit.customer_phone || 'Customer'}</h3>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${statusTone(visit.status)}`}>
              {visit.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {displayDate(visit.scheduled_start)}
            </span>
            <span className="truncate">{visit.item_name || 'General visit'}</span>
            <span className="flex items-center gap-2 truncate">
              <UserRound className="h-4 w-4 text-slate-400" />
              {visit.sales_staff_name || 'Auto assigned'}
            </span>
            <span className="truncate">{visit.customer_phone || 'No phone'}</span>
          </div>
          {visit.notes ? <p className="mt-3 text-sm leading-5 text-slate-500">{visit.notes}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <label className="min-w-[180px] space-y-1">
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
          {[
            ['confirmed', 'Confirm'],
            ['arrived', 'Arrived'],
            ['completed', 'Done'],
            ['converted', 'Converted'],
            ['no_show', 'No show'],
            ['lost', 'Lost'],
            ['cancelled', 'Cancel'],
          ].map(([nextStatus, label]) => (
            <Button
              key={nextStatus}
              type="button"
              variant={nextStatus === 'cancelled' || nextStatus === 'lost' || nextStatus === 'no_show' ? 'ghost' : 'outline'}
              size="sm"
              disabled={busy || visit.status === nextStatus}
              onClick={() => onStatus(visit.visit_id, nextStatus)}
              className={`gap-2 ${nextStatus === 'cancelled' || nextStatus === 'lost' || nextStatus === 'no_show' ? 'text-rose-600' : 'bg-white'}`}
            >
              {nextStatus === 'cancelled' || nextStatus === 'lost' || nextStatus === 'no_show' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AppointmentSalesVisitsPage() {
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState(localDateKey())
  const visitsQuery = useAppointmentSalesVisits({
    status: status || undefined,
    from_date: fromDate || undefined,
    limit: 80,
  })
  const staffQuery = useAppointmentSalesStaff()
  const updateStatus = useUpdateAppointmentVisitStatus()
  const assignVisit = useAssignAppointmentVisit()
  const visits = visitsQuery.data ?? []
  const staff = staffQuery.data ?? []
  const groupedVisits = visits.reduce<Record<string, AppointmentSalesVisit[]>>((groups, visit) => {
    const key = visitDayKey(visit.scheduled_start)
    groups[key] = groups[key] ?? []
    groups[key].push(visit)
    return groups
  }, {})
  const groupKeys = Object.keys(groupedVisits).sort()

  function onStatus(visitId: string, nextStatus: string) {
    updateStatus.mutate({ visit_id: visitId, status: nextStatus })
  }

  function onAssign(visitId: string, salesStaffId?: string) {
    assignVisit.mutate({ visit_id: visitId, sales_staff_id: salesStaffId })
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-[#0066FF]">Customer visits</p>
                <h1 className="text-2xl font-bold text-slate-950">Visit Schedule</h1>
              </div>
            </div>
            <Button asChild variant="outline" className="gap-2 bg-white">
              <Link href="/appointment-sales">
                <ArrowLeft className="h-4 w-4" />
                Visit Desk
              </Link>
            </Button>
          </div>
        </section>

        <Card className="border-slate-200 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[180px_220px_1fr] md:items-end">
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-500">From date</span>
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-500">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
              >
                <option value="">All active and past</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="arrived">Arrived</option>
                <option value="completed">Completed</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No show</option>
              </select>
            </label>
            <div className="text-sm text-slate-500 md:text-right">
              {visitsQuery.isFetching ? 'Refreshing visits...' : `${visits.length} visit${visits.length === 1 ? '' : 's'} shown`}
            </div>
          </div>
        </Card>

        {visitsQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[#0066FF]" />
          </div>
        ) : visits.length ? (
          <section className="space-y-4">
            {groupKeys.map((key) => (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-bold text-slate-950">{visitDayLabel(groupedVisits[key][0]?.scheduled_start)}</p>
                  <span className="text-xs font-semibold text-slate-500">{groupedVisits[key].length} visit{groupedVisits[key].length === 1 ? '' : 's'}</span>
                </div>
                {groupedVisits[key].map((visit) => (
                  <VisitCard
                    key={visit.visit_id}
                    visit={visit}
                    staff={staff}
                    busy={updateStatus.isPending}
                    assignBusy={assignVisit.isPending}
                    onStatus={onStatus}
                    onAssign={onAssign}
                  />
                ))}
              </div>
            ))}
          </section>
        ) : (
          <Card className="border-slate-200 p-8 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-lg font-bold text-slate-950">No visits found</h2>
            <p className="mt-1 text-sm text-slate-500">When customer visit times are saved, they will appear here.</p>
            <Button asChild className="mt-4 bg-[#0066FF] hover:bg-[#0052CC]">
              <Link href="/appointment-sales">Book a visit</Link>
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
