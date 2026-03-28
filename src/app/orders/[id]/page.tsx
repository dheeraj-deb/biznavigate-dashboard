'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  MoreVertical,
  Edit,
  Truck,
  CreditCard,
  XCircle,
  Package,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatus, PaymentStatus } from '@/types'
import {
  useOrder,
  useUpdateOrderStatus,
  useUpdateOrderPayment,
} from '@/hooks/use-orders'

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
    [PaymentStatus.PARTIAL]: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
    [PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400',
    [PaymentStatus.FAILED]: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400',
  }
  return colors[status]
}

const getStatusIcon = (status: OrderStatus) => {
  const icons = {
    [OrderStatus.PENDING]: Clock,
    [OrderStatus.CONFIRMED]: CheckCircle2,
    [OrderStatus.PROCESSING]: Package,
    [OrderStatus.SHIPPED]: Truck,
    [OrderStatus.DELIVERED]: CheckCircle2,
    [OrderStatus.CANCELLED]: XCircle,
  }
  return icons[status] || Clock
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: orderData, isLoading, error, refetch } = useOrder(params.id)
  const updateStatusMutation = useUpdateOrderStatus()
  const updatePaymentMutation = useUpdateOrderPayment()

  const order = orderData as any

  // Handle quick actions
  const handleMarkAsPaid = async () => {
    try {
      await updatePaymentMutation.mutateAsync({
        id: params.id,
        payment_status: 'paid',
        payment_method: 'other',
      })
      refetch()
    } catch (error) {
      console.error('Failed to update payment:', error)
    }
  }

  const handleMarkAsProcessing = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        id: params.id,
        status: 'processing',
      })
      refetch()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleMarkAsShipped = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        id: params.id,
        status: 'shipped',
      })
      refetch()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleMarkAsDelivered = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        id: params.id,
        status: 'delivered',
      })
      refetch()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleCancelOrder = async () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        await updateStatusMutation.mutateAsync({
          id: params.id,
          status: 'cancelled',
        })
        refetch()
      } catch (error) {
        console.error('Failed to cancel order:', error)
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/orders')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error ? 'Failed to load order details. Please try again.' : 'Order not found.'}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const customerName = order.customer
    ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
    : 'N/A'

  const StatusIcon = getStatusIcon(order.status)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/orders')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Order {order.orderNumber || order.order_number}
              </h1>
              <p className="text-muted-foreground">
                Placed on {formatDate(order.createdAt || order.created_at)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="mr-2 h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Order
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Payment actions */}
              {(order.paymentStatus || order.payment_status) !== PaymentStatus.PAID &&
               (order.paymentStatus || order.payment_status) !== 'paid' && (
                <DropdownMenuItem onClick={handleMarkAsPaid}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Mark as Paid
                </DropdownMenuItem>
              )}

              {/* Status transition actions based on current status */}
              {/* paid → processing */}
              {order && String(order.status).toLowerCase() === 'paid' && (
                <DropdownMenuItem onClick={handleMarkAsProcessing}>
                  <Package className="mr-2 h-4 w-4" />
                  Mark as Processing
                </DropdownMenuItem>
              )}

              {/* processing → shipped */}
              {order && String(order.status).toLowerCase() === 'processing' && (
                <DropdownMenuItem onClick={handleMarkAsShipped}>
                  <Truck className="mr-2 h-4 w-4" />
                  Mark as Shipped
                </DropdownMenuItem>
              )}

              {/* shipped → delivered */}
              {order && String(order.status).toLowerCase() === 'shipped' && (
                <DropdownMenuItem onClick={handleMarkAsDelivered}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Delivered
                </DropdownMenuItem>
              )}

              {/* Cancel order (allowed from most statuses except delivered/cancelled) */}
              {order &&
                String(order.status).toLowerCase() !== 'delivered' &&
                String(order.status).toLowerCase() !== 'cancelled' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleCancelOrder}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-950">
                    <StatusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                      <Badge className={getPaymentStatusColor(order.paymentStatus || order.payment_status)}>
                        {order.paymentStatus || order.payment_status}
                      </Badge>
                    </div>
                    {order.trackingNumber || order.tracking_number ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Tracking: {order.trackingNumber || order.tracking_number}
                        {(order.carrier || order.shipping_carrier) && ` (${order.carrier || order.shipping_carrier})`}
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 border-b pb-4 last:border-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name || item.productName || 'Product'}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × {formatCurrency(Number(item.unit_price || item.unitPrice || 0))}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(Number(item.quantity || 0) * Number(item.unit_price || item.unitPrice || 0))}
                      </p>
                    </div>
                  ))}

                  {/* Order Summary */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(Number(order.subtotal || order.subtotal_amount || 0))}</span>
                    </div>
                    {Number(order.tax || order.tax_amount || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatCurrency(Number(order.tax || order.tax_amount || 0))}</span>
                      </div>
                    )}
                    {Number(order.discount || order.discount_amount || 0) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(Number(order.discount || order.discount_amount || 0))}</span>
                      </div>
                    )}
                    {Number(order.shippingCost || order.shipping_cost || order.shipping_fee || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{formatCurrency(Number(order.shippingCost || order.shipping_cost || order.shipping_fee || 0))}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(Number(order.total || order.total_amount || 0))}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Placed */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt || order.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Received */}
                  {((order.paymentStatus || order.payment_status) === PaymentStatus.PAID ||
                    (order.paymentStatus || order.payment_status) === 'paid' ||
                    (order.paid_at)) && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                          <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        {(String(order.status).toLowerCase() === 'paid' ||
                          String(order.status).toLowerCase() === 'processing' ||
                          String(order.status).toLowerCase() === 'shipped' ||
                          String(order.status).toLowerCase() === 'delivered') && (
                          <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium">Payment Received</p>
                        <p className="text-sm text-muted-foreground">
                          {order.paid_at ? formatDate(order.paid_at) :
                           `${order.payment_method || order.paymentMethod || 'Manual'}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Processing */}
                  {(String(order.status).toLowerCase() === 'processing' ||
                    String(order.status).toLowerCase() === 'shipped' ||
                    String(order.status).toLowerCase() === 'delivered') && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950">
                          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        {(String(order.status).toLowerCase() === 'shipped' ||
                          String(order.status).toLowerCase() === 'delivered') && (
                          <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium">Order Processing</p>
                        <p className="text-sm text-muted-foreground">
                          Order is being prepared for shipment
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shipped */}
                  {(String(order.status).toLowerCase() === 'shipped' ||
                    String(order.status).toLowerCase() === 'delivered') && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-950">
                          <Truck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        {String(order.status).toLowerCase() === 'delivered' && (
                          <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium">Order Shipped</p>
                        {order.shipped_at ? (
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.shipped_at)}
                          </p>
                        ) : null}
                        {order.trackingNumber || order.tracking_number ? (
                          <p className="text-sm text-muted-foreground">
                            Tracking: {order.trackingNumber || order.tracking_number}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Delivered */}
                  {String(order.status).toLowerCase() === 'delivered' && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Order Delivered</p>
                        <p className="text-sm text-muted-foreground">
                          {order.delivered_at ? formatDate(order.delivered_at) :
                           formatDate(order.updatedAt || order.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cancelled */}
                  {String(order.status).toLowerCase() === 'cancelled' && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-red-100 p-2 dark:bg-red-950">
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Order Cancelled</p>
                        <p className="text-sm text-muted-foreground">
                          {order.cancelled_at ? formatDate(order.cancelled_at) :
                           formatDate(order.updatedAt || order.updated_at)}
                        </p>
                        {(order.cancellation_reason || order.notes) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {order.cancellation_reason || order.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{customerName}</p>
                  </div>
                </div>

                {order.customer?.email && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{order.customer.email}</p>
                    </div>
                  </div>
                )}

                {order.customer?.phone && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                      <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{order.customer.phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {(order.shippingAddress || order.shipping_address) && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="whitespace-pre-line text-sm">
                        {order.shippingAddress || order.shipping_address}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getPaymentStatusColor(order.paymentStatus || order.payment_status)}>
                    {order.paymentStatus || order.payment_status}
                  </Badge>
                </div>
                {(order.payment_method || order.paymentMethod) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Method</p>
                    <p className="font-medium capitalize">
                      {order.payment_method || order.paymentMethod}
                    </p>
                  </div>
                )}
                {(order.payment_reference || order.paymentReference) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-mono text-sm">
                      {order.payment_reference || order.paymentReference}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
