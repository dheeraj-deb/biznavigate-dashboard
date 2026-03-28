'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { resolveIcon } from '@/lib/icon-resolver'
import { useBusinessType } from '@/hooks/use-business-type'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { dashboardConfig } from '@/config/dashboard.config'
import type { DashboardStatConfig, DashboardWidgetConfig } from '@/config/navigation.types'

// Widget registry — maps component string names to actual components
import { RecentBookingsWidget } from './recent-bookings'
import { CheckInStatusWidget } from './check-in-status'
import { RevenueChartWidget } from './revenue-chart'
import { OccupancyChartWidget } from './occupancy-chart'
import { TopProductsWidget } from './top-products-widget'
import { RecentOrdersWidget } from './recent-orders-widget'
import { ActivityFeedWidget } from './activity-feed-widget'

const WIDGET_REGISTRY: Record<string, React.ComponentType<{ title?: string }>> = {
  RecentBookings: RecentBookingsWidget,
  CheckInStatus: CheckInStatusWidget,
  RevenueChart: RevenueChartWidget,
  OccupancyChart: OccupancyChartWidget,
  TopProducts: TopProductsWidget,
  RecentOrders: RecentOrdersWidget,
  ActivityFeed: ActivityFeedWidget,
}

// Color map for stat card styling
const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', icon: 'text-purple-600' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-950/20', icon: 'text-pink-600' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', icon: 'text-amber-600' },
}

function formatStatValue(value: unknown, prefix?: string, suffix?: string): string {
  if (value == null) return '—'
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return String(value)
  if (prefix === '₹') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
  }
  const formatted = new Intl.NumberFormat('en-IN').format(num)
  return `${prefix ?? ''}${formatted}${suffix ?? ''}`
}

function StatCard({ config, data }: { config: DashboardStatConfig; data: Record<string, unknown> | undefined }) {
  const Icon = resolveIcon(config.icon)
  const colors = COLOR_MAP[config.color] ?? COLOR_MAP.blue
  const value = data?.[config.valueKey]
  const change = config.changeKey ? (data?.[config.changeKey] as number | undefined) : undefined
  const isPositive = change != null && change >= 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          {change != null && (
            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatStatValue(value, config.prefix, config.suffix)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{config.label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function WidgetSlot({ config }: { config: DashboardWidgetConfig }) {
  const Widget = WIDGET_REGISTRY[config.component]
  if (!Widget) return null
  return (
    <div className={`col-span-12 lg:col-span-${config.colSpan}`} style={{ gridColumn: `span ${config.colSpan} / span ${config.colSpan}` }}>
      <Widget title={config.title} />
    </div>
  )
}

export function DashboardRenderer() {
  const { businessType, isLoading: bizLoading } = useBusinessType()
  const { data: statsData, isLoading: statsLoading } = useDashboardStats()
  const layout = dashboardConfig[businessType]

  if (bizLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {layout.stats.map((stat) => (
          <StatCard key={stat.key} config={stat} data={statsData as Record<string, unknown> | undefined} />
        ))}
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-12 gap-6">
        {layout.widgets.map((widget) => (
          <WidgetSlot key={widget.key} config={widget} />
        ))}
      </div>
    </div>
  )
}
