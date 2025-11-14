import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Dashboard statistics interface
interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  conversionRate: number
  revenueChange: number
  ordersChange: number
  customersChange: number
  conversionChange: number
}

// Sales chart data interface
interface SalesChartData {
  date: string
  revenue: number
  orders: number
}

// Activity interface
interface Activity {
  id: string
  type: string
  message: string
  timestamp: string
  user?: string
}

// Get dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/dashboard')
      return response.data?.data as DashboardStats
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get recent leads (reuse from use-leads)
export function useRecentLeads(limit = 5) {
  return useQuery({
    queryKey: ['recent-leads', limit],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/leads', {
        params: { limit, sort: '-created_at' }
      })
      return response.data?.data?.data || []
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get recent orders
export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ['recent-orders', limit],
    queryFn: async () => {
      const response = await apiClient.get('/orders', {
        params: { limit, sort: '-created_at' }
      })
      return response.data?.data || []
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get sales chart data
export function useSalesCharts(period: 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: ['sales-charts', period],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/sales/revenue-by-period', {
        params: { period }
      })
      return response.data?.data as SalesChartData[]
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get recent activities (if backend supports it)
export function useRecentActivities(limit = 10) {
  return useQuery({
    queryKey: ['recent-activities', limit],
    queryFn: async () => {
      // If your backend has an activities endpoint:
      const response = await apiClient.get('/activities', {
        params: { limit }
      })
      return response.data?.data as Activity[]
    },
    retry: 1,
    retryDelay: 1000,
    enabled: false, // Disable until backend endpoint is ready
  })
}

// Get conversion funnel data
export function useFunnelData() {
  return useQuery({
    queryKey: ['funnel-data'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/funnel')
      return response.data?.data
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get business KPIs
export function useBusinessKPIs() {
  return useQuery({
    queryKey: ['business-kpis'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/kpis')
      return response.data?.data
    },
    retry: 1,
    retryDelay: 1000,
  })
}
