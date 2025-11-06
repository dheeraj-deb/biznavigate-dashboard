'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Order, OrderStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface RecentOrdersProps {
  orders: Order[]
  maxItems?: number
}

export function RecentOrders({ orders, maxItems = 5 }: RecentOrdersProps) {
  const displayedOrders = orders.slice(0, maxItems)

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'default'
      case 'SHIPPED':
        return 'secondary'
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'outline'
      case 'PENDING':
        return 'secondary'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'text-green-600'
      case 'SHIPPED':
        return 'text-blue-600'
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'text-purple-600'
      case 'PENDING':
        return 'text-yellow-600'
      case 'CANCELLED':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>
              {displayedOrders.length} recent orders
            </CardDescription>
          </div>
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                  <Badge variant={getStatusVariant(order.status)} className="text-xs">
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.customer?.firstName} {order.customer?.lastName}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{order.items.length} items</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="font-bold text-sm">{formatCurrency(order.total)}</p>
                <Badge
                  variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        {displayedOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">Orders will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
