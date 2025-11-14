'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Star,
  Crown,
  Clock,
  Package,
  Edit,
  MessageSquare,
} from 'lucide-react'
import {
  useCustomer,
  getCustomerSegment,
  getSegmentBadgeColor,
  getEngagementScoreColor,
  getEngagementLevel,
  formatCurrency,
  formatPhoneNumber,
  formatRelativeTime,
  getAverageOrderValue,
  getDaysSinceLastOrder,
} from '@/hooks/use-customers'
import { useOrders } from '@/hooks/use-orders'
import { OrderStatus, PaymentStatus } from '@/types'

interface CustomerDetailsPageProps {
  params: Promise<{ id: string }>
}

const getStatusBadgeColor = (status: OrderStatus) => {
  const colors = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
    [OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800',
    [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  }
  return colors[status]
}

const getPaymentStatusColor = (status: PaymentStatus) => {
  const colors = {
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
    [PaymentStatus.PARTIAL]: 'bg-orange-100 text-orange-800',
    [PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
    [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
  }
  return colors[status]
}

export default function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const customerId = resolvedParams.id

  const [activeTab, setActiveTab] = useState('overview')

  // Fetch customer data
  const { data: customer, isLoading: loadingCustomer, error: customerError } = useCustomer(customerId)

  // Fetch customer orders
  const { data: ordersData, isLoading: loadingOrders, error: ordersError } = useOrders({
    customer_id: customerId,
    limit: 100,
  })

  const orders = ordersData?.data || []

  // Loading state
  if (loadingCustomer) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading customer details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (customerError || !customer) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Customer Not Found</h1>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load customer details. Please ensure the backend is running on port 3006.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const segment = getCustomerSegment(customer)
  const segmentColor = getSegmentBadgeColor(segment)
  const engagementColor = getEngagementScoreColor(customer.engagement_score)
  const engagementLevel = getEngagementLevel(customer.engagement_score)
  const avgOrderValue = getAverageOrderValue(customer)
  const daysSinceLastOrder = getDaysSinceLastOrder(customer)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">
                  {customer.name || formatPhoneNumber(customer.phone)}
                </h1>
                <Badge variant="outline" className={segmentColor}>
                  {segment === 'VIP' && <Crown className="mr-1 h-3 w-3" />}
                  {segment}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Customer since {new Date(customer.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>
            <Button variant="outline" onClick={() => router.push(`/customers`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customer.total_orders}</div>
              <p className="text-xs text-muted-foreground">Lifetime orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(customer.total_spent)}</div>
              <p className="text-xs text-muted-foreground">Customer lifetime value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
              <p className="text-xs text-muted-foreground">Per order average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Star className={`h-4 w-4 ${engagementColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${engagementColor}`}>
                {customer.engagement_score}%
              </div>
              <p className="text-xs text-muted-foreground">{engagementLevel} engagement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Order</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {daysSinceLastOrder !== null ? `${daysSinceLastOrder}d` : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(customer.last_order_date)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">
              Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPhoneNumber(customer.phone)}
                      </p>
                    </div>
                  </div>

                  {customer.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                  )}

                  {customer.whatsapp_number && (
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPhoneNumber(customer.whatsapp_number)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Customer Since</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Customer Segment</span>
                      <Badge variant="outline" className={segmentColor}>
                        {segment === 'VIP' && <Crown className="mr-1 h-3 w-3" />}
                        {segment}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {segment === 'VIP' && 'High-value customer with significant purchase history'}
                      {segment === 'Regular' && 'Established customer with consistent orders'}
                      {segment === 'New' && 'New customer, joined within last 30 days'}
                      {segment === 'Dormant' && 'No orders in the last 90 days - consider re-engagement'}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Engagement Level</span>
                      <span className={`text-sm font-medium ${engagementColor}`}>
                        {engagementLevel} ({customer.engagement_score}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          customer.engagement_score >= 80
                            ? 'bg-green-600'
                            : customer.engagement_score >= 50
                            ? 'bg-yellow-600'
                            : customer.engagement_score >= 20
                            ? 'bg-orange-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${customer.engagement_score}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Purchase Behavior</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Avg Order Value</p>
                        <p className="font-semibold">{formatCurrency(avgOrderValue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Orders</p>
                        <p className="font-semibold">{customer.total_orders}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>
                      All orders placed by this customer
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push('/orders/new')}>
                    <Package className="mr-2 h-4 w-4" />
                    New Order
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="py-8 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading orders...</p>
                  </div>
                ) : ordersError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Unable to load orders. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No orders yet</p>
                    <Button className="mt-4" onClick={() => router.push('/orders/new')}>
                      Create First Order
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div
                        key={order.order_id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 cursor-pointer"
                        onClick={() => router.push(`/orders/${order.order_id}`)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold">#{order.order_number}</p>
                            <Badge variant="outline" className={getStatusBadgeColor(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge variant="outline" className={getPaymentStatusColor(order.payment_status)}>
                              {order.payment_status}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{order.items?.length || 0} items</span>
                            {order.payment_method && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{order.payment_method}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{formatCurrency(order.total)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatRelativeTime(order.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Activity</CardTitle>
                <CardDescription>
                  Recent interactions and engagement history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 mb-4" />
                  <p>Activity tracking coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
