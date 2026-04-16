'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, CalendarCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface Booking {
  booking_id: string
  booking_reference?: string
  customer_name: string
  total_price: string | number
  status: string
  created_at: string
  services?: { name: string; type?: string }
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function fmtRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400',
  checked_in: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400',
  cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400',
  completed: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400',
}

export function RecentBookingsWidget() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['dashboard-recent-bookings'],
    queryFn: async () => {
      const res = await apiClient.get('/bookings', { params: { limit: 5 } })
      return (res.data?.data ?? res.data ?? []) as Booking[]
    },
    retry: 1,
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
            <CardDescription>{bookings.length} recent bookings</CardDescription>
          </div>
          <Link href="/inventory/bookings">
            <Button variant="ghost" size="sm">View All<ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarCheck className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Bookings will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const amount = typeof b.total_price === 'string' ? parseFloat(b.total_price) || 0 : b.total_price
              return (
                <div key={b.booking_id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{b.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{b.services?.name ?? 'Service'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-sm">{fmt(amount)}</p>
                      <p className="text-xs text-muted-foreground">{fmtRelative(b.created_at)}</p>
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[b.status] ?? STATUS_STYLES.pending}>
                      {b.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
