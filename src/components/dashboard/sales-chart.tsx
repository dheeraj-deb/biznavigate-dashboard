'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SalesChartData } from '@/types'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface SalesChartProps {
  data: SalesChartData[]
  timeframe: 'weekly' | 'monthly'
  onTimeframeChange: (timeframe: 'weekly' | 'monthly') => void
}

export function SalesChart({ data, timeframe, onTimeframeChange }: SalesChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-sm text-muted-foreground">
            Sales: <span className="font-semibold text-foreground">{formatCurrency(payload[0].value)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Orders: <span className="font-semibold text-foreground">{payload[1]?.value || 0}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sales Summary</CardTitle>
            <CardDescription>
              {timeframe === 'weekly' ? 'Past 7 days' : 'Past 30 days'} performance
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeframe === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeframeChange('weekly')}
            >
              7 Days
            </Button>
            <Button
              variant={timeframe === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeframeChange('monthly')}
            >
              30 Days
            </Button>
            <div className="ml-2 border-l pl-2">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                Line
              </Button>
            </div>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="Sales ($)"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))' }}
                name="Orders"
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="sales"
                fill="hsl(var(--primary))"
                name="Sales ($)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
