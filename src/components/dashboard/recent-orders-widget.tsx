'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShoppingCart, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRecentOrders } from '@/hooks/use-dashboard'

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
  DELIVERED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400',
  SHIPPED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400',
  PROCESSING: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400',
  CONFIRMED: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400',
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400',
}

export function RecentOrdersWidget() {
  const { data: orders = [], isLoading } = useRecentOrders(5)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>{orders.length} recent orders</CardDescription>
          </div>
          <Link href="/orders">
            <Button variant="ghost" size="sm">View All<ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">Orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{o.orderNumber ?? o.order_number ?? `#${o.id?.slice(-6)}`}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {o.customer?.firstName ?? o.customer_name ?? 'Customer'} {o.customer?.lastName ?? ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-sm">{fmt(o.total ?? o.amount ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">{o.createdAt ? fmtRelative(o.createdAt) : ''}</p>
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[o.status] ?? STATUS_STYLES.PENDING}>
                    {(o.status ?? 'PENDING').toLowerCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
