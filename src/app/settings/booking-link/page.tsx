'use client'

import { useEffect, useState } from 'react'
import { Copy, ExternalLink, Link, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  BookingLinkConfig,
  defaultBookingLink,
  normalizeBookingLink,
  publicBookingUrl,
  useBookingLink,
  useUpdateBookingLink,
} from '@/hooks/use-booking-link'

const experiences = [
  ['hospitality', 'Hospitality'],
  ['events', 'Events'],
  ['services', 'Services'],
  ['healthcare', 'Healthcare'],
  ['education', 'Education'],
  ['products', 'Products/Retail'],
  ['generic', 'Generic'],
] as const

const paymentModes = [
  ['manual', 'Manual / Pending'],
  ['advance', 'Advance Payment'],
  ['full', 'Full Payment'],
] as const

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
}

export default function BookingLinkSettingsPage() {
  const { data, isLoading } = useBookingLink()
  const updateBookingLink = useUpdateBookingLink()
  const [config, setConfig] = useState<BookingLinkConfig>(defaultBookingLink)

  useEffect(() => {
    if (data) setConfig(normalizeBookingLink(data))
  }, [data])

  const link = config.slug ? publicBookingUrl(config.slug) : ''

  const set = (key: keyof BookingLinkConfig, value: any) => setConfig((prev) => ({ ...prev, [key]: value }))
  const setGroup = <T extends 'theme' | 'policies' | 'contact' | 'required_fields'>(
    group: T,
    key: keyof BookingLinkConfig[T],
    value: any,
  ) => setConfig((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }))

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-80 items-center justify-center text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading booking link settings...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              <Link className="h-3.5 w-3.5" />
              Website Booking Link
            </span>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Booking Link</h1>
            <p className="text-sm text-gray-500">Configure your public customer booking/request page.</p>
          </div>
          <Button onClick={() => updateBookingLink.mutate(config)} disabled={updateBookingLink.isPending}>
            {updateBookingLink.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Public Link</CardTitle>
            <CardDescription>Use this link in WhatsApp, Instagram, ads, or your website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">Enable public booking link</p>
                <p className="text-sm text-gray-500">Disabled links return a not-found response.</p>
              </div>
              <Switch checked={config.enabled} onCheckedChange={(checked) => set('enabled', checked)} />
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={config.slug} onChange={(e) => set('slug', slugify(e.target.value))} placeholder="aslam-resort" />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!link}
                onClick={() => {
                  navigator.clipboard.writeText(link)
                  toast.success('Booking link copied')
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button type="button" variant="outline" disabled={!link} onClick={() => window.open(link, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
            {link && <p className="break-all rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600">{link}</p>}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Experience</CardTitle>
              <CardDescription>Choose the public page template for this client.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {experiences.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('experience_type', value)}
                  className={`rounded-lg border p-3 text-left text-sm font-semibold ${config.experience_type === value ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Manual payment is used as fallback when gateway setup is missing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {paymentModes.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('payment_mode', value)}
                    className={`rounded-lg border p-3 text-left text-sm font-semibold ${config.payment_mode === value ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Advance Type</Label>
                  <select className="h-10 w-full rounded-md border px-3 text-sm" value={config.advance_type} onChange={(e) => set('advance_type', e.target.value)}>
                    <option value="fixed">Fixed amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Advance Amount</Label>
                  <Input type="number" min="0" value={config.advance_amount} onChange={(e) => set('advance_amount', Number(e.target.value) || 0)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Primary Color</Label>
                <Input value={config.theme.primary_color} onChange={(e) => setGroup('theme', 'primary_color', e.target.value)} />
              </div>
              <div className="flex items-center justify-between"><Label>Show logo</Label><Switch checked={config.theme.show_logo} onCheckedChange={(v) => setGroup('theme', 'show_logo', v)} /></div>
              <div className="flex items-center justify-between"><Label>Show banner</Label><Switch checked={config.theme.show_banner} onCheckedChange={(v) => setGroup('theme', 'show_banner', v)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Phone" value={config.contact.phone} onChange={(e) => setGroup('contact', 'phone', e.target.value)} />
              <Input placeholder="WhatsApp" value={config.contact.whatsapp} onChange={(e) => setGroup('contact', 'whatsapp', e.target.value)} />
              <Input placeholder="Address" value={config.contact.address} onChange={(e) => setGroup('contact', 'address', e.target.value)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(config.required_fields).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="capitalize">{key}</Label>
                  <Switch checked={Boolean(value)} onCheckedChange={(v) => setGroup('required_fields', key as any, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Policies</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <textarea className="min-h-28 rounded-md border p-3 text-sm" placeholder="Cancellation policy" value={config.policies.cancellation} onChange={(e) => setGroup('policies', 'cancellation', e.target.value)} />
            <textarea className="min-h-28 rounded-md border p-3 text-sm" placeholder="Refund policy" value={config.policies.refund} onChange={(e) => setGroup('policies', 'refund', e.target.value)} />
            <textarea className="min-h-28 rounded-md border p-3 text-sm" placeholder="Terms" value={config.policies.terms} onChange={(e) => setGroup('policies', 'terms', e.target.value)} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
