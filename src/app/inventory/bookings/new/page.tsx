'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, CalendarDays, Users, User, Phone, Mail, IndianRupee, BedDouble } from 'lucide-react'

interface Service {
  service_id: string
  name: string
  base_price?: string | number
  type?: string
}

function NewBookingForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    customer_name: params.get('name') ?? '',
    customer_phone: params.get('phone') ?? '',
    customer_email: '',
    service_id: '',
    check_in_date: params.get('check_in') ?? '',
    check_out_date: params.get('check_out') ?? '',
    slots_booked: params.get('guests') ?? '1',
    total_price: '',
    special_requests: '',
    status: 'confirmed',
    payment_status: 'unpaid',
  })

  const fromLead = params.get('from_lead')
  const prefillRoom = params.get('room')

  useEffect(() => {
    apiClient.get('/catalog', { params: { item_type: 'accommodation', limit: 100 } })
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = (res as any).data?.data ?? (res as any).data
        const raw: any[] = Array.isArray(d) ? d : (d?.data ?? [])
        const list: Service[] = raw.map((item: any) => ({
          service_id: item.item_id ?? item.service_id ?? '',
          name: item.name,
          base_price: item.base_price,
          type: item.item_type,
        }))
        setServices(list)
        if (prefillRoom && list.length > 0) {
          const match = list.find((s) =>
            s.name.toLowerCase().includes(prefillRoom.toLowerCase())
          )
          if (match) {
            setForm((prev) => ({
              ...prev,
              service_id: match.service_id,
              total_price: match.base_price ? String(match.base_price) : prev.total_price,
            }))
          }
        }
      })
      .catch(() => toast.error('Could not load services'))
      .finally(() => setLoadingServices(false))
  }, [prefillRoom])

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleServiceChange = (serviceId: string) => {
    const svc = services.find((s) => s.service_id === serviceId)
    setForm((prev) => ({
      ...prev,
      service_id: serviceId,
      total_price: svc?.base_price ? String(svc.base_price) : prev.total_price,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name.trim()) return toast.error('Customer name is required')
    if (!form.service_id) return toast.error('Please select a room / service')
    if (!form.check_in_date) return toast.error('Check-in date is required')

    setSubmitting(true)
    try {
      await apiClient.post('/orders', {
        order_type: 'accommodation',
        total_amount: Number(form.total_price) || 0,
        payment_status: form.payment_status,
        delivery_status: form.status,
        ...(fromLead ? { lead_id: fromLead } : {}),
        items: [{
          item_id: form.service_id,
          check_in: form.check_in_date,
          check_out: form.check_out_date,
          num_guests: Number(form.slots_booked) || 1,
          guest_name: form.customer_name,
          phone: form.customer_phone,
          special_requests: form.special_requests || undefined,
        }],
      })
      toast.success('Booking created!')
      router.push('/inventory/bookings')
    } catch {
      toast.error('Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Booking</h1>
            {fromLead && (
              <p className="text-sm text-[#0066FF] mt-0.5">Pre-filled from lead</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-[#0066FF]" />
                Guest Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.customer_name}
                      onChange={(e) => set('customer_name', e.target.value)}
                      placeholder="Guest name"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.customer_phone}
                      onChange={(e) => set('customer_phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => set('customer_email', e.target.value)}
                    placeholder="guest@email.com (optional)"
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-[#0066FF]" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Room / Service *</Label>
                {loadingServices ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />Loading services...
                  </div>
                ) : (
                  <Select value={form.service_id} onValueChange={handleServiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room or service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.service_id} value={s.service_id}>
                          {s.name}
                          {s.base_price && ` — ₹${Number(s.base_price).toLocaleString('en-IN')}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {prefillRoom && !form.service_id && (
                  <p className="text-xs text-amber-600">Guest requested: &quot;{prefillRoom}&quot;</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />Check-in *
                  </Label>
                  <Input
                    type="date"
                    value={form.check_in_date}
                    onChange={(e) => set('check_in_date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />Check-out
                  </Label>
                  <Input
                    type="date"
                    value={form.check_out_date}
                    onChange={(e) => set('check_out_date', e.target.value)}
                    min={form.check_in_date}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />Guests
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.slots_booked}
                    onChange={(e) => set('slots_booked', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5" />Total Price (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.total_price}
                    onChange={(e) => set('total_price', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Special Requests</Label>
                <textarea
                  value={form.special_requests}
                  onChange={(e) => set('special_requests', e.target.value)}
                  placeholder="Any special requests from the guest..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Booking Status</Label>
                  <Select value={form.status} onValueChange={(v) => set('status', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Status</Label>
                  <Select value={form.payment_status} onValueChange={(v) => set('payment_status', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-[#0066FF] hover:bg-[#0052CC]">
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                'Create Booking'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <NewBookingForm />
    </Suspense>
  )
}
