'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useSalesCharts } from '@/hooks/use-dashboard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function RevenueChartWidget({ title = 'Revenue Trend' }: { title?: string }) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const { data, isLoading } = useSalesCharts(period)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{period === 'week' ? 'Past 7 days' : 'Past 30 days'}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant={period === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('week')}>7D</Button>
            <Button variant={period === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('month')}>30D</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-xs" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} className="text-xs" />
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
