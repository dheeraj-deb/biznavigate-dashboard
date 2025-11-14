'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Loader2,
  AlertCircle,
  MoreVertical,
  Edit,
  CheckCircle,
  Truck,
  XCircle,
  ArrowUpDown,
  Package,
  CreditCard,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatus, PaymentStatus } from '@/types'
import {
  useOrders,
  useUpdateOrderStatus,
  useUpdateOrderPayment,
  useDeleteOrder,
} from '@/hooks/use-orders'

// Business ID from seed data
const BUSINESS_ID = '37689a7a-a45e-4c96-82ce-d695871d4e0c'

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
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'total'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Fetch orders from API with filters
  const { data: ordersResponse, isLoading, error, refetch } = useOrders({
    business_id: BUSINESS_ID,
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
    page,
    limit: 20,
  })

  // Mutations for quick actions
  const updateStatusMutation = useUpdateOrderStatus()
  const updatePaymentMutation = useUpdateOrderPayment()
  const deleteOrderMutation = useDeleteOrder()

  const ordersData = ordersResponse?.data || []
  const totalPages = Math.ceil((ordersResponse?.total || 0) / 20)

  // Calculate statistics
  const stats = {
    total: ordersData.length,
    pending: ordersData.filter((o: any) => o.status === OrderStatus.PENDING).length,
    inTransit: ordersData.filter((o: any) => o.status === OrderStatus.SHIPPED).length,
    delivered: ordersData.filter((o: any) => o.status === OrderStatus.DELIVERED).length,
  }

  // Handle quick actions
  const handleMarkAsPaid = async (orderId: string) => {
    try {
      await updatePaymentMutation.mutateAsync({
        id: orderId,
        payment_status: PaymentStatus.PAID,
        payment_method: 'manual',
      })
      refetch()
    } catch (error) {
      console.error('Failed to update payment:', error)
    }
  }

  const handleMarkAsShipped = async (orderId: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: orderId,
        status: OrderStatus.SHIPPED,
      })
      refetch()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        await updateStatusMutation.mutateAsync({
          id: orderId,
          status: OrderStatus.CANCELLED,
        })
        refetch()
      } catch (error) {
        console.error('Failed to cancel order:', error)
      }
    }
  }

  const toggleSort = (column: 'createdAt' | 'total') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Orders</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Manage customer orders and shipments</p>
          </div>
          <Button onClick={() => router.push('/orders/new')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to connect to backend API. Please ensure backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                  <ShoppingCart className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-950">
                  <Package className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                  <Truck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">In Transit</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.inTransit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                  <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Delivered</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.delivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders by number or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Order Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={OrderStatus.CONFIRMED}>Confirmed</SelectItem>
                    <SelectItem value={OrderStatus.PROCESSING}>Processing</SelectItem>
                    <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                    <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                    <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                    <SelectItem value={PaymentStatus.PARTIAL}>Partial</SelectItem>
                    <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
                    <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3">Order Number</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3 text-right">
                      <button
                        onClick={() => toggleSort('total')}
                        className="inline-flex items-center hover:text-foreground"
                      >
                        Total
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3">Order Status</th>
                    <th className="pb-3">Payment Status</th>
                    <th className="pb-3">
                      <button
                        onClick={() => toggleSort('createdAt')}
                        className="inline-flex items-center hover:text-foreground"
                      >
                        Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.map((order: any) => {
                    const customerName = order.customer
                      ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
                      : 'N/A'

                    return (
                      <tr key={order.id || order.order_id} className="border-b">
                        <td className="py-4 font-mono text-sm font-medium">
                          {order.orderNumber || order.order_number}
                        </td>
                        <td className="py-4">{customerName}</td>
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
                              order.paymentStatus || order.payment_status
                            )}`}
                          >
                            {order.paymentStatus || order.payment_status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {formatDate(order.createdAt || order.created_at)}
                        </td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/orders/${order.id || order.order_id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Order
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(order.paymentStatus || order.payment_status) !== PaymentStatus.PAID && (
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsPaid(order.id || order.order_id)}
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {order.status !== OrderStatus.SHIPPED &&
                                order.status !== OrderStatus.DELIVERED && (
                                  <DropdownMenuItem
                                    onClick={() => handleMarkAsShipped(order.id || order.order_id)}
                                  >
                                    <Truck className="mr-2 h-4 w-4" />
                                    Mark as Shipped
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleCancelOrder(order.id || order.order_id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {ordersData.length === 0 && !isLoading && (
              <div className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No orders found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first order to get started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
