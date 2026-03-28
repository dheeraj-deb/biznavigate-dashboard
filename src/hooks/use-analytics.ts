import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Analytics filters
interface AnalyticsFilters {
  from_date?: string
  to_date?: string
  period?: 'day' | 'week' | 'month' | 'year'
  business_id?: string
}

// Get sales analytics
export function useSalesAnalytics(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['sales-analytics', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/sales', { params: filters })
      return response.data?.data
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get top products
export function useTopProducts(filters?: AnalyticsFilters & { limit?: number }) {
  return useQuery({
    queryKey: ['top-products', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/sales/top-products', { params: filters })
      return response.data?.data || []
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get revenue by period
export function useRevenueByPeriod(period: 'day' | 'week' | 'month' | 'year' = 'month', filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['revenue-by-period', period, filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/sales/revenue-by-period', {
        params: { ...filters, period }
      })
      return response.data?.data || []
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get business KPIs
export function useBusinessKPIs(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['business-kpis', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/kpis', { params: filters })
      return response.data?.data
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get customer analytics
export function useCustomerAnalytics(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['customer-analytics', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/customers', { params: filters })
      return response.data?.data
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get inventory analytics
export function useInventoryAnalytics(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['inventory-analytics', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/inventory', { params: filters })
      return response.data?.data
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get customer cohort analysis
export function useCohortAnalysis(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['cohort-analysis', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/customers/cohort-analysis', { params: filters })
      return response.data?.data
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get churn analysis
export function useChurnAnalysis(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['churn-analysis', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/customers/churn-analysis', { params: filters })
      return response.data?.data
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get inventory turnover
export function useInventoryTurnover(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['inventory-turnover', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/inventory/turnover-by-product', { params: filters })
      return response.data?.data || []
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Get low stock alerts
export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/inventory/low-stock-alerts')
      return response.data?.data || []
    },
    retry: 1,
    retryDelay: 1000,
  })
}
