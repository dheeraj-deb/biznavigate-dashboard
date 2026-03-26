'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, LogOut, BedDouble, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface CheckInData {
  arrivals: number
  departures: number
  inHouse: number
}

export function CheckInStatusWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-check-in-status'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bookings/today-summary')
        return (res.data?.data ?? res.data) as CheckInData
      } catch {
        return { arrivals: 0, departures: 0, inHouse: 0 }
      }
    },
    retry: 1,
  })

  const items = [
    { label: 'Arrivals', value: data?.arrivals ?? 0, icon: LogIn, color: 'text-green-600 bg-green-50 dark:bg-green-950/20' },
    { label: 'Departures', value: data?.departures ?? 0, icon: LogOut, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20' },
    { label: 'In-House', value: data?.inHouse ?? 0, icon: BedDouble, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            {items.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className={`p-2.5 rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
