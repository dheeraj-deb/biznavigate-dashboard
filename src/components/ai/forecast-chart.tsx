'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ForecastDataPoint } from '@/types/forecast'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ForecastChartProps {
  data: ForecastDataPoint[]
  title?: string
  type?: 'line' | 'area'
  showBounds?: boolean
  currency?: boolean
}

export function ForecastChart({
  data,
  title = 'Revenue Forecast',
  type = 'area',
  showBounds = true,
  currency = true,
}: ForecastChartProps) {
  // Calculate trend
  const firstPredicted = data[0]?.predicted || 0
  const lastPredicted = data[data.length - 1]?.predicted || 0
  const trend = lastPredicted > firstPredicted ? 'up' : lastPredicted < firstPredicted ? 'down' : 'stable'
  const trendPercentage = firstPredicted > 0
    ? (((lastPredicted - firstPredicted) / firstPredicted) * 100).toFixed(1)
    : '0'

  const formatValue = (value: number) => {
    if (currency) {
      return formatCurrency(value)
    }
    return value.toLocaleString()
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {payload[0].payload.date}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {trend === 'up' && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{trendPercentage}%</span>
              </div>
            )}
            {trend === 'down' && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">{trendPercentage}%</span>
              </div>
            )}
            {trend === 'stable' && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Stable</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {type === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />

              {showBounds && (
                <>
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="transparent"
                    fill="#93c5fd"
                    fillOpacity={0.2}
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="transparent"
                    fill="#93c5fd"
                    fillOpacity={0.2}
                    name="Lower Bound"
                  />
                </>
              )}

              <Area
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                strokeWidth={2}
                name="Actual"
              />

              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.4}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />

              {showBounds && (
                <>
                  <Line
                    type="monotone"
                    dataKey="upperBound"
                    stroke="#93c5fd"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Upper Bound"
                  />
                  <Line
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="#93c5fd"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Lower Bound"
                  />
                </>
              )}

              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Actual"
              />

              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Predicted"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
