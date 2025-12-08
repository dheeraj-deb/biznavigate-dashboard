'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProfileCompletionCheck } from '@/components/dashboard/ProfileCompletionCheck'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  IndianRupee,
  MessageSquare,
  Package,
  ArrowRight,
  Activity,
  Clock,
} from 'lucide-react'

// Quick Stats Data
const stats = [
  {
    title: 'Total Revenue',
    value: '₹2,45,320',
    change: '+12.5%',
    trend: 'up' as const,
    icon: IndianRupee,
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Orders',
    value: '145',
    change: '+8.2%',
    trend: 'up' as const,
    icon: ShoppingCart,
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Customers',
    value: '892',
    change: '+15.3%',
    trend: 'up' as const,
    icon: Users,
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    iconColor: 'text-purple-600',
  },
  {
    title: 'Conversations',
    value: '234',
    change: '+23.1%',
    trend: 'up' as const,
    icon: MessageSquare,
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    iconColor: 'text-pink-600',
  },
]

// Recent Orders
const recentOrders = [
  {
    id: 'ORD-001',
    customer: 'Priya Sharma',
    product: 'Red Kurti',
    amount: '₹2,499',
    status: 'completed',
    time: '2 mins ago',
  },
  {
    id: 'ORD-002',
    customer: 'Rahul Kumar',
    product: 'Blue Saree',
    amount: '₹3,999',
    status: 'processing',
    time: '15 mins ago',
  },
  {
    id: 'ORD-003',
    customer: 'Anjali Verma',
    product: 'Lehenga Set',
    amount: '₹8,999',
    status: 'pending',
    time: '1 hour ago',
  },
  {
    id: 'ORD-004',
    customer: 'Vikram Singh',
    product: 'Ethnic Jewelry',
    amount: '₹1,499',
    status: 'completed',
    time: '2 hours ago',
  },
  {
    id: 'ORD-005',
    customer: 'Sneha Patel',
    product: 'Designer Dupatta',
    amount: '₹899',
    status: 'completed',
    time: '3 hours ago',
  },
]

// Recent Activities
const recentActivities = [
  {
    id: 1,
    type: 'order',
    message: 'New order placed by Priya Sharma',
    time: '2 mins ago',
    icon: ShoppingCart,
  },
  {
    id: 2,
    type: 'customer',
    message: 'New customer registered: Rahul Kumar',
    time: '15 mins ago',
    icon: Users,
  },
  {
    id: 3,
    type: 'message',
    message: '5 new messages from Instagram',
    time: '30 mins ago',
    icon: MessageSquare,
  },
  {
    id: 4,
    type: 'product',
    message: 'Low stock alert: Red Kurti',
    time: '1 hour ago',
    icon: Package,
  },
]

// Top Products
const topProducts = [
  { name: 'Red Kurti', sales: 45, revenue: '₹1,12,455' },
  { name: 'Blue Saree', sales: 38, revenue: '₹1,51,962' },
  { name: 'Lehenga Set', sales: 32, revenue: '₹2,87,968' },
  { name: 'Ethnic Jewelry', sales: 28, revenue: '₹41,972' },
]

export default function DashboardPage() {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400',
      processing: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400',
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-50 text-gray-700'
  }

  return (
    <ProfileCompletionCheck>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Orders - Takes 2 columns */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest orders from your customers</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {order.customer}
                            </p>
                            <p className="text-sm text-muted-foreground">{order.product}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {order.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">{order.time}</p>
                        </div>
                        <Badge variant="outline" className={getStatusBadge(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - Takes 1 column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest updates and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <activity.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>Best selling products this month</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 font-semibold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {product.revenue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProfileCompletionCheck>
  )
}
