'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, Filter, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatus, PaymentStatus } from '@/types'

const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customerName: 'John Doe',
    total: 1299.99,
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    createdAt: '2024-03-15T10:30:00',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customerName: 'Jane Smith',
    total: 549.99,
    status: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.PAID,
    createdAt: '2024-03-14T14:20:00',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customerName: 'Bob Johnson',
    total: 2399.99,
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
    createdAt: '2024-03-13T09:15:00',
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-004',
    customerName: 'Alice Brown',
    total: 899.99,
    status: OrderStatus.PROCESSING,
    paymentStatus: PaymentStatus.PAID,
    createdAt: '2024-03-12T16:45:00',
  },
]

const getStatusBadgeColor = (status: OrderStatus) => {
  const colors = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400',
    [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
    [OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400',
    [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400',
    [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400',
  }
  return colors[status]
}

const getPaymentStatusColor = (status: PaymentStatus) => {
  const colors = {
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400',
    [PaymentStatus.PAID]: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400',
    [PaymentStatus.PARTIAL]: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400',
    [PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400',
    [PaymentStatus.FAILED]: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400',
  }
  return colors[status]
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [orders] = useState(mockOrders)

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Manage customer orders and shipments</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders by number or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3">Order Number</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3">Order Status</th>
                    <th className="pb-3">Payment Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="py-4 font-mono text-sm font-medium">{order.orderNumber}</td>
                      <td className="py-4">{order.customerName}</td>
                      <td className="py-4 text-right font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
