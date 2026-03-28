'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package } from 'lucide-react'
import { DashboardStats } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface OverviewCardsProps {
  stats: DashboardStats
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  const cards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      change: stats.leadsChange,
      subtitle: `${stats.newLeadsThisWeek} new this week`,
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-950',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      changeColor: 'positive',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      change: stats.ordersChange,
      subtitle: `${stats.pendingOrders} pending, ${stats.completedOrders} completed`,
      icon: ShoppingCart,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-950',
      bgGradient: 'from-purple-500/10 to-purple-600/10',
      changeColor: 'positive',
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      subtitle: 'Total sales this period',
      icon: DollarSign,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-950',
      bgGradient: 'from-green-500/10 to-green-600/10',
      changeColor: 'positive',
    },
    {
      title: 'Inventory Alerts',
      value: stats.lowStockCount,
      change: stats.inventoryChange,
      subtitle: `Value: ${formatCurrency(stats.inventoryValue)}`,
      icon: Package,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-950',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      changeColor: 'neutral',
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const isPositive = card.change >= 0
        const showTrend = card.title !== 'Inventory Alerts'

        return (
          <Card
            key={card.title}
            className="group relative overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 transition-opacity group-hover:opacity-100`} />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} transition-all group-hover:scale-110`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {card.value}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>
                {showTrend && (
                  <div className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-900 px-2 py-1">
                    {isPositive ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {card.change}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
