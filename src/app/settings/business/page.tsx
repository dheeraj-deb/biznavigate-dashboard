'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Phone, Mail, MapPin, Globe, IndianRupee, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useBusinessSettings, useUpdateBusinessSettings } from '@/hooks/use-settings'

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Colombo',
  'Asia/Kathmandu',
  'Asia/Dhaka',
  'Asia/Dubai',
  'UTC',
  'America/New_York',
  'Europe/London',
]

const CURRENCIES = [
  { code: 'INR', label: '₹ Indian Rupee' },
  { code: 'USD', label: '$ US Dollar' },
  { code: 'EUR', label: '€ Euro' },
  { code: 'GBP', label: '£ British Pound' },
  { code: 'AED', label: 'د.إ UAE Dirham' },
  { code: 'LKR', label: 'රු Sri Lankan Rupee' },
  { code: 'BDT', label: '৳ Bangladeshi Taka' },
]

export default function BusinessProfilePage() {
  const { data: business, isLoading, error } = useBusinessSettings()
  const updateBusiness = useUpdateBusinessSettings()

  const [form, setForm] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    timezone: '',
    currency: '',
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (business) {
      setForm({
        business_name: business.business_name ?? '',
        business_email: business.business_email ?? '',
        business_phone: business.business_phone ?? '',
        address: business.address ?? '',
        city: business.city ?? '',
        state: business.state ?? '',
        zip_code: business.zip_code ?? '',
        country: business.country ?? 'India',
        timezone: business.timezone ?? 'Asia/Kolkata',
        currency: business.currency ?? 'INR',
      })
    }
  }, [business])

  const set = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.business_name.trim()) return
    await updateBusiness.mutateAsync(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your business details used across the platform
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load business profile. Please refresh.</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#0066FF]" />
            <p className="text-gray-400 mt-3">Loading profile...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business Identity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0066FF]" />
                  Business Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Business Name *</Label>
                  <Input
                    value={form.business_name}
                    onChange={(e) => set('business_name', e.target.value)}
                    placeholder="Your resort / business name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />Business Email
                    </Label>
                    <Input
                      type="email"
                      value={form.business_email}
                      onChange={(e) => set('business_email', e.target.value)}
                      placeholder="hello@yourbusiness.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />Business Phone
                    </Label>
                    <Input
                      value={form.business_phone}
                      onChange={(e) => set('business_phone', e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#0066FF]" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Street Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="123 Resort Lane, Near Lake..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="Coorg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State</Label>
                    <Input
                      value={form.state}
                      onChange={(e) => set('state', e.target.value)}
                      placeholder="Karnataka"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>ZIP / PIN Code</Label>
                    <Input
                      value={form.zip_code}
                      onChange={(e) => set('zip_code', e.target.value)}
                      placeholder="571201"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />Country
                    </Label>
                    <Input
                      value={form.country}
                      onChange={(e) => set('country', e.target.value)}
                      placeholder="India"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#0066FF]" />
                  Regional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />Timezone
                    </Label>
                    <Select value={form.timezone} onValueChange={(v) => set('timezone', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <IndianRupee className="h-3.5 w-3.5" />Currency
                    </Label>
                    <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save */}
            <div className="flex items-center gap-3 pb-8">
              {saved && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />Saved
                </div>
              )}
              <Button
                type="submit"
                disabled={updateBusiness.isPending}
                className="ml-auto bg-[#0066FF] hover:bg-[#0052CC] px-8"
              >
                {updateBusiness.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
