'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { OverviewCards } from '@/components/dashboard/overview-cards'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { RecentLeads } from '@/components/dashboard/recent-leads'
import { ProfileCompletionCheck } from '@/components/dashboard/ProfileCompletionCheck'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { DashboardStats, ActivityItem, SalesChartData, FunnelStage, Order, Lead, OrderStatus, LeadStatus, PaymentStatus } from '@/types'
import { useDashboardStats, useRecentLeads, useRecentOrders, useSalesCharts } from '@/hooks/use-dashboard'

// Mock data - replace with actual API calls
const mockStats: DashboardStats = {
  totalLeads: 156,
  newLeadsThisWeek: 23,
  newLeadsThisMonth: 67,
  leadsChange: 12.5,
  totalOrders: 234,
  pendingOrders: 18,
  completedOrders: 216,
  ordersChange: 8.3,
  totalRevenue: 45231.89,
  revenueChange: 15.2,
  lowStockCount: 12,
  inventoryValue: 125430.50,
  inventoryChange: -3.2,
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-1234',
    customerId: 'c1',
    customer: {
      id: 'c1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    items: [
      { id: 'i1', productId: 'p1', quantity: 2, unitPrice: 1172.84, discount: 0, total: 2345.68 },
    ],
    subtotal: 2345.68,
    tax: 0,
    discount: 0,
    shippingCost: 0,
    total: 2345.68,
    status: 'PENDING' as OrderStatus,
    paymentStatus: 'PENDING' as PaymentStatus,
    shippingAddress: '123 Main St',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    orderNumber: 'ORD-1233',
    customerId: 'c2',
    customer: {
      id: 'c2',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    items: [
      { id: 'i2', productId: 'p2', quantity: 1, unitPrice: 1234.50, discount: 0, total: 1234.50 },
    ],
    subtotal: 1234.50,
    tax: 0,
    discount: 0,
    shippingCost: 0,
    total: 1234.50,
    status: 'DELIVERED' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    shippingAddress: '456 Oak Ave',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    orderNumber: 'ORD-1232',
    customerId: 'c3',
    customer: {
      id: 'c3',
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    items: [
      { id: 'i3', productId: 'p3', quantity: 3, unitPrice: 456.78, discount: 0, total: 1370.34 },
    ],
    subtotal: 1370.34,
    tax: 0,
    discount: 0,
    shippingCost: 0,
    total: 1370.34,
    status: 'SHIPPED' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    shippingAddress: '789 Pine Rd',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    orderNumber: 'ORD-1231',
    customerId: 'c4',
    customer: {
      id: 'c4',
      firstName: 'Charlie',
      lastName: 'Davis',
      email: 'charlie@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    items: [
      { id: 'i4', productId: 'p4', quantity: 1, unitPrice: 899.99, discount: 0, total: 899.99 },
    ],
    subtotal: 899.99,
    tax: 0,
    discount: 0,
    shippingCost: 0,
    total: 899.99,
    status: 'PROCESSING' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    shippingAddress: '321 Elm St',
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    orderNumber: 'ORD-1230',
    customerId: 'c5',
    customer: {
      id: 'c5',
      firstName: 'Diana',
      lastName: 'Evans',
      email: 'diana@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    items: [
      { id: 'i5', productId: 'p5', quantity: 2, unitPrice: 750.00, discount: 0, total: 1500.00 },
    ],
    subtotal: 1500.00,
    tax: 0,
    discount: 0,
    shippingCost: 0,
    total: 1500.00,
    status: 'CONFIRMED' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    shippingAddress: '654 Maple Dr',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockLeads: Lead[] = [
  {
    id: '1',
    contactId: 'c1',
    contact: {
      id: 'c1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Tech Corp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    title: 'Premium Package Inquiry',
    description: 'Interested in enterprise solution',
    status: 'QUALIFIED' as LeadStatus,
    value: 15000,
    probability: 75,
    source: 'Instagram',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    contactId: 'c2',
    contact: {
      id: 'c2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@example.com',
      company: 'StartUp Inc',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    title: 'Business Plan Interest',
    description: 'Looking for business plan options',
    status: 'CONTACTED' as LeadStatus,
    value: 8500,
    probability: 50,
    source: 'WhatsApp',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    contactId: 'c3',
    contact: {
      id: 'c3',
      firstName: 'Mike',
      lastName: 'Brown',
      email: 'mike@example.com',
      company: 'Global Industries',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    title: 'Starter Package Request',
    description: 'Small business starter package',
    status: 'NEW' as LeadStatus,
    value: 5000,
    probability: 30,
    source: 'Website',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    contactId: 'c4',
    contact: {
      id: 'c4',
      firstName: 'Emily',
      lastName: 'White',
      email: 'emily@example.com',
      company: 'Solutions Ltd',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    title: 'Custom Solution',
    description: 'Custom enterprise solution needed',
    status: 'PROPOSAL' as LeadStatus,
    value: 25000,
    probability: 65,
    source: 'Instagram',
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    contactId: 'c5',
    contact: {
      id: 'c5',
      firstName: 'David',
      lastName: 'Green',
      email: 'david@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    title: 'Product Demo Request',
    description: 'Wants to see product demo',
    status: 'CONTACTED' as LeadStatus,
    value: 12000,
    probability: 40,
    source: 'WhatsApp',
    createdAt: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New lead captured',
    description: 'John Doe - Interested in Premium Package',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    metadata: {
      source: 'Instagram',
      customer: 'John Doe',
    },
  },
  {
    id: '2',
    type: 'order',
    title: 'Order placed',
    description: 'Order #ORD-1234 received',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    metadata: {
      status: 'Pending',
      amount: 2345.67,
      customer: 'Jane Smith',
    },
  },
  {
    id: '3',
    type: 'inventory',
    title: 'Low stock alert',
    description: 'Product SKU-789 running low',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    metadata: {
      status: 'Low Stock',
    },
  },
  {
    id: '4',
    type: 'lead',
    title: 'New lead captured',
    description: 'Sarah Johnson - Inquiry about Business Plan',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    metadata: {
      source: 'WhatsApp',
      customer: 'Sarah Johnson',
    },
  },
  {
    id: '5',
    type: 'order',
    title: 'Order delivered',
    description: 'Order #ORD-1200 delivered successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    metadata: {
      status: 'Delivered',
      amount: 1234.50,
      customer: 'Bob Wilson',
    },
  },
  {
    id: '6',
    type: 'lead',
    title: 'New lead captured',
    description: 'Mike Brown - Looking for starter package',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    metadata: {
      source: 'Website',
      customer: 'Mike Brown',
    },
  },
]

const mockWeeklySales: SalesChartData[] = [
  { date: 'Mon', sales: 4200, orders: 12 },
  { date: 'Tue', sales: 5800, orders: 18 },
  { date: 'Wed', sales: 4100, orders: 14 },
  { date: 'Thu', sales: 7200, orders: 22 },
  { date: 'Fri', sales: 6800, orders: 20 },
  { date: 'Sat', sales: 8900, orders: 28 },
  { date: 'Sun', sales: 7200, orders: 24 },
]

const mockMonthlySales: SalesChartData[] = [
  { date: 'Week 1', sales: 22100, orders: 64 },
  { date: 'Week 2', sales: 24500, orders: 72 },
  { date: 'Week 3', sales: 19800, orders: 58 },
  { date: 'Week 4', sales: 28400, orders: 84 },
]

const mockFunnelStages: FunnelStage[] = [
  { stage: 'Leads Captured', count: 156, percentage: 100, color: '#3b82f6' },
  { stage: 'Contacted', count: 124, percentage: 79.5, color: '#8b5cf6' },
  { stage: 'Qualified', count: 89, percentage: 57.1, color: '#ec4899' },
  { stage: 'Proposal Sent', count: 56, percentage: 35.9, color: '#f59e0b' },
  { stage: 'Orders Placed', count: 34, percentage: 21.8, color: '#10b981' },
]

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly')

  // Fetch data from API
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useRecentLeads(5)
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useRecentOrders(5)
  const { data: salesData, isLoading: salesLoading, error: salesError } = useSalesCharts(timeframe === 'weekly' ? 'week' : 'month')

  // Fallback to mock data if API fails
  const stats = statsError ? mockStats : (statsData || mockStats)
  const leads = leadsError ? mockLeads : (Array.isArray(leadsData) ? leadsData : mockLeads)
  const orders = ordersError ? mockOrders : (Array.isArray(ordersData) ? ordersData : mockOrders)
  const chartData = salesError ? (timeframe === 'weekly' ? mockWeeklySales : mockMonthlySales) : (salesData || mockWeeklySales)

  // Loading state
  if (statsLoading && leadsLoading && ordersLoading && salesLoading) {
    return (
      <ProfileCompletionCheck>
        <DashboardLayout>
          <div className="flex h-[600px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProfileCompletionCheck>
    )
  }

  const hasErrors = statsError || leadsError || ordersError || salesError

  return (
    <ProfileCompletionCheck>
      <DashboardLayout>
        <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>

        {/* Error Alert */}
        {hasErrors && (
          <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to connect to backend API. Showing sample data for demo purposes.
              Please ensure backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <OverviewCards stats={stats} />

        {/* Recent Orders and Leads */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentOrders orders={orders} maxItems={5} />
          <RecentLeads leads={leads} maxItems={5} />
        </div>

        {/* Sales Chart */}
        <SalesChart
          data={chartData}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />

        {/* Activity Feed and Conversion Funnel */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity Feed */}
          <ActivityFeed activities={mockActivities} maxItems={8} />

          {/* Conversion Funnel */}
          <ConversionFunnel stages={mockFunnelStages} />
        </div>
      </div>
    </DashboardLayout>
    </ProfileCompletionCheck>
  )
}
