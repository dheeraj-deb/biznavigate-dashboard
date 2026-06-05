'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, Coffee, Edit3, Loader2, PauseCircle, Save, UserRound, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AppointmentAvailabilityWindow,
  AppointmentSalesStaff,
  useAppointmentSalesStaff,
  useUpsertAppointmentSalesStaff,
} from '@/hooks/use-appointment-sales'

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

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

function buildAvailability(params: {
  days: number[]
  start: string
  end: string
  lunchStart?: string
  lunchEnd?: string
  breakStart?: string
  breakEnd?: string
}) {
  const windows: AppointmentAvailabilityWindow[] = params.days.map((day) => ({
    day_of_week: day,
    start_time: params.start,
    end_time: params.end,
    window_type: 'working',
    label: 'Working hours',
    is_active: true,
  }))

  if (params.lunchStart && params.lunchEnd) {
    windows.push(...params.days.map((day) => ({
      day_of_week: day,
      start_time: params.lunchStart!,
      end_time: params.lunchEnd!,
      window_type: 'lunch',
      label: 'Lunch',
      is_active: true,
    })))
  }

  if (params.breakStart && params.breakEnd) {
    windows.push(...params.days.map((day) => ({
      day_of_week: day,
      start_time: params.breakStart!,
      end_time: params.breakEnd!,
      window_type: 'break',
      label: 'Break',
      is_active: true,
    })))
  }

  return windows
}

function blankStaff(): AppointmentSalesStaff {
  return {
    name: '',
    phone: '',
    email: '',
    title: 'Sales Consultant',
    role: 'sales_consultant',
    priority: 1,
    is_active: true,
    availability: defaultAvailability(),
  }
}

function dayText(availability?: AppointmentAvailabilityWindow[]) {
  if (!availability?.length) return 'No timing set'
  const working = availability.filter((window) => (window.window_type ?? 'working') === 'working')
  const lunch = availability.find((window) => window.window_type === 'lunch')
  const breakWindow = availability.find((window) => window.window_type === 'break')
  const labels = working
    .map((window) => DAYS.find((day) => day.value === window.day_of_week)?.label)
    .filter(Boolean)
    .join(', ')
  const start = working[0]?.start_time
  const end = working[0]?.end_time
  const blocked = [
    lunch ? `Lunch ${lunch.start_time}-${lunch.end_time}` : null,
    breakWindow ? `Break ${breakWindow.start_time}-${breakWindow.end_time}` : null,
  ].filter(Boolean).join(' | ')
  return `${labels} | ${start} - ${end}${blocked ? ` | ${blocked}` : ''}`
}

function optional(value?: string) {
  const clean = value?.trim()
  return clean ? clean : undefined
}

export default function AppointmentSalesStaffPage() {
  const staffQuery = useAppointmentSalesStaff()
  const upsertStaff = useUpsertAppointmentSalesStaff()
  const [form, setForm] = useState<AppointmentSalesStaff>(blankStaff())

  const staff = staffQuery.data ?? []
  const availability = form.availability?.length ? form.availability : defaultAvailability()
  const working = availability.filter((item) => (item.window_type ?? 'working') === 'working')
  const lunch = availability.find((item) => item.window_type === 'lunch')
  const breakWindow = availability.find((item) => item.window_type === 'break')
  const selectedDays = new Set(working.map((item) => item.day_of_week))
  const start = working[0]?.start_time ?? '10:00'
  const end = working[0]?.end_time ?? '18:00'
  const lunchStart = lunch?.start_time ?? '13:00'
  const lunchEnd = lunch?.end_time ?? '14:00'
  const breakStart = breakWindow?.start_time ?? ''
  const breakEnd = breakWindow?.end_time ?? ''

  function rebuildAvailability(patch: Partial<{
    days: number[]
    start: string
    end: string
    lunchStart: string | null
    lunchEnd: string | null
    breakStart: string | null
    breakEnd: string | null
  }>) {
    const days = patch.days ?? [...selectedDays].sort()
    const nextLunchStart = Object.prototype.hasOwnProperty.call(patch, 'lunchStart')
      ? patch.lunchStart ?? undefined
      : lunch ? lunchStart : undefined
    const nextLunchEnd = Object.prototype.hasOwnProperty.call(patch, 'lunchEnd')
      ? patch.lunchEnd ?? undefined
      : lunch ? lunchEnd : undefined
    const nextBreakStart = Object.prototype.hasOwnProperty.call(patch, 'breakStart')
      ? patch.breakStart ?? undefined
      : breakWindow ? breakStart : undefined
    const nextBreakEnd = Object.prototype.hasOwnProperty.call(patch, 'breakEnd')
      ? patch.breakEnd ?? undefined
      : breakWindow ? breakEnd : undefined
    setForm((current) => ({
      ...current,
      availability: buildAvailability({
        days,
        start: patch.start ?? start,
        end: patch.end ?? end,
        lunchStart: nextLunchStart,
        lunchEnd: nextLunchEnd,
        breakStart: nextBreakStart,
        breakEnd: nextBreakEnd,
      }),
    }))
  }

  function setDays(day: number, checked: boolean) {
    const days = new Set(selectedDays)
    if (checked) days.add(day)
    else days.delete(day)
    rebuildAvailability({ days: [...days].sort() })
  }

  function setTime(field: 'start_time' | 'end_time', value: string) {
    rebuildAvailability(field === 'start_time' ? { start: value } : { end: value })
  }

  function editStaff(person: AppointmentSalesStaff) {
    setForm({
      ...person,
      phone: person.phone ?? '',
      email: person.email ?? '',
      title: person.title ?? 'Sales Consultant',
      availability: person.availability?.length ? person.availability : defaultAvailability(),
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return
    upsertStaff.mutate({
      ...form,
      name: form.name.trim(),
      phone: optional(form.phone),
      email: optional(form.email),
      title: optional(form.title),
      role: form.role || 'sales_consultant',
      priority: Number(form.priority ?? staff.length + 1),
      is_active: form.is_active ?? true,
      availability,
    }, {
      onSuccess: () => setForm(blankStaff()),
    })
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-[#0066FF]">Visit scheduling</p>
                <h1 className="text-2xl font-bold text-slate-950">Sales Staff</h1>
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

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Team availability</h2>
                <p className="mt-1 text-sm text-slate-500">Slots are created only inside these timings.</p>
              </div>
              {staffQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#0066FF]" /> : null}
            </div>

            <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
              {staff.map((person) => (
                <div key={person.sales_staff_id ?? person.name} className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_120px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-950">{person.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${person.is_active === false ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700'}`}>
                        {person.is_active === false ? 'Paused' : 'Active'}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                      <span className="truncate">{person.title || 'Sales Consultant'}</span>
                      <span className="truncate">{person.phone || 'No phone'}</span>
                      <span className="truncate">{dayText(person.availability)}</span>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="gap-2 bg-white" onClick={() => editStaff(person)}>
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              ))}
              {!staff.length ? (
                <div className="p-4 text-sm text-slate-500">Add one salesperson to start saving customer visit times.</div>
              ) : null}
            </div>
          </Card>

          <Card className="border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-[#0066FF]" />
              <h2 className="text-lg font-bold text-slate-950">{form.sales_staff_id ? 'Edit salesperson' : 'Add salesperson'}</h2>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase text-slate-500">Name</span>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Salesperson name" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Phone</span>
                  <Input value={form.phone ?? ''} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="WhatsApp number" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Title</span>
                  <Input value={form.title ?? ''} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Sales Consultant" />
                </label>
              </div>
              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase text-slate-500">Email</span>
                <Input value={form.email ?? ''} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Optional" />
              </label>

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Available days</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <label key={day.value} className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                      <input type="checkbox" checked={selectedDays.has(day.value)} onChange={(event) => setDays(day.value, event.target.checked)} />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">Start</span>
                  <Input type="time" value={start} onChange={(event) => setTime('start_time', event.target.value)} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">End</span>
                  <Input type="time" value={end} onChange={(event) => setTime('end_time', event.target.value)} />
                </label>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-950">
                    <Coffee className="h-4 w-4 text-amber-600" />
                    Lunch time
                  </span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(lunch)}
                      onChange={(event) => rebuildAvailability({
                        lunchStart: event.target.checked ? lunchStart : undefined,
                        lunchEnd: event.target.checked ? lunchEnd : undefined,
                      })}
                    />
                    Block
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    type="time"
                    value={lunchStart}
                    disabled={!lunch}
                    onChange={(event) => rebuildAvailability({ lunchStart: event.target.value })}
                  />
                  <Input
                    type="time"
                    value={lunchEnd}
                    disabled={!lunch}
                    onChange={(event) => rebuildAvailability({ lunchEnd: event.target.value })}
                  />
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-950">
                    <PauseCircle className="h-4 w-4 text-blue-600" />
                    Break
                  </span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(breakWindow)}
                      onChange={(event) => rebuildAvailability({
                        breakStart: event.target.checked ? '16:00' : undefined,
                        breakEnd: event.target.checked ? '16:15' : undefined,
                      })}
                    />
                    Block
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    type="time"
                    value={breakStart || '16:00'}
                    disabled={!breakWindow}
                    onChange={(event) => rebuildAvailability({ breakStart: event.target.value })}
                  />
                  <Input
                    type="time"
                    value={breakEnd || '16:15'}
                    disabled={!breakWindow}
                    onChange={(event) => rebuildAvailability({ breakEnd: event.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Taking visits now
              </label>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={upsertStaff.isPending || !form.name.trim()} className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                  {upsertStaff.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save salesperson
                </Button>
                {form.sales_staff_id ? (
                  <Button type="button" variant="outline" className="bg-white" onClick={() => setForm(blankStaff())}>
                    New
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>
        </section>

        <Card className="border-slate-200 bg-slate-950 p-5 text-white">
          <div className="flex gap-3">
            <CalendarClock className="mt-1 h-5 w-5 text-blue-300" />
            <div>
              <h2 className="text-lg font-bold">How slots work</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Ask the customer for their visit time and save it. BizNavigo allows up to 10 customers at the same time, then asks you to check the next hour.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
