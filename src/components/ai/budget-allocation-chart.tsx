'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

interface BudgetAllocation {
  channel: string
  current: number
  recommended: number
  color: string
}

interface BudgetAllocationChartProps {
  data: BudgetAllocation[]
  title?: string
  showComparison?: boolean
}

export function BudgetAllocationChart({
  data,
  title = 'Budget Allocation',
  showComparison = false,
}: BudgetAllocationChartProps) {
  const currentData = data.map((item) => ({
    name: item.channel,
    value: item.current,
    color: item.color,
  }))

  const recommendedData = data.map((item) => ({
    name: item.channel,
    value: item.recommended,
    color: item.color,
  }))

  const comparisonData = data.map((item) => ({
    channel: item.channel,
    current: item.current,
    recommended: item.recommended,
    change: item.recommended - item.current,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {payload[0].name}
          </p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {((payload[0].value / data.reduce((acc, item) => acc + item.current, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (showComparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title} - Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <XAxis dataKey="channel" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const change = payload[0].payload.change
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {payload[0].payload.channel}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Current:</span>
                            <span className="text-sm font-semibold">{formatCurrency(payload[0].value)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Recommended:</span>
                            <span className="text-sm font-semibold">{formatCurrency(payload[1].value)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Change:</span>
                            <span className={`text-sm font-bold ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {change >= 0 ? '+' : ''}{formatCurrency(change)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="current" fill="#94a3b8" name="Current Budget" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recommended" fill="#8b5cf6" name="Recommended Budget" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Changes Summary */}
          <div className="mt-4 space-y-2">
            {comparisonData.map((item) => {
              const changePercent = ((item.change / item.current) * 100).toFixed(1)
              const isIncrease = item.change > 0

              if (item.change === 0) return null

              return (
                <div
                  key={item.channel}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.find(d => d.channel === item.channel)?.color }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.channel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.current)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.recommended)}
                    </span>
                    <span className={`text-xs font-bold ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ({isIncrease ? '+' : ''}{changePercent}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Allocation */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
              Current Allocation
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {currentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recommended Allocation */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
              AI Recommended
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={recommendedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {recommendedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {data.map((item) => (
            <div key={item.channel} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item.channel}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
