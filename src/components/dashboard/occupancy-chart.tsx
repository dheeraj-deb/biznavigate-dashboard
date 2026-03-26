'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface OccupancyData {
  date: string
  occupancy: number
}

export function OccupancyChartWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-occupancy'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/analytics/occupancy', { params: { period: 'week' } })
        return (res.data?.data ?? []) as OccupancyData[]
      } catch {
        return []
      }
    },
    retry: 1,
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Occupancy Rate</CardTitle>
        <CardDescription>Room occupancy over the past week</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">No occupancy data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-xs" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} className="text-xs" />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
