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
      color: 'text-blue-600',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      change: stats.ordersChange,
      subtitle: `${stats.pendingOrders} pending, ${stats.completedOrders} completed`,
      icon: ShoppingCart,
      color: 'text-green-600',
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      subtitle: 'Total sales this period',
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      title: 'Inventory Alerts',
      value: stats.lowStockCount,
      change: stats.inventoryChange,
      subtitle: `Value: ${formatCurrency(stats.inventoryValue)}`,
      icon: Package,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const isPositive = card.change >= 0
        const showTrend = card.title !== 'Inventory Alerts'

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                {showTrend && (
                  <div className="flex items-center">
                    {isPositive ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isPositive ? 'text-green-500' : 'text-red-500'
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
