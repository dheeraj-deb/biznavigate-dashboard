import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface AiManagerSuggestion {
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  reason: string
  safety?: string
  status: 'needs_approval' | 'needs_action' | 'blocked' | 'recommended' | 'ok'
  action_label: string
  action_href: string
  count: number
  data?: unknown[]
}

export interface AiEmployeeMetric {
  label: string
  value: string | number
  tone?: 'good' | 'warning' | 'danger' | 'neutral'
  format?: 'money'
}

export interface AiEmployeeWorkItem {
  title: string
  detail: string
  href?: string
}

export interface AiEmployee {
  key: 'sales' | 'orders' | 'inventory' | 'marketing' | 'growth' | string
  name: string
  role: string
  status: 'working' | 'watching' | 'needs_attention' | string
  summary: string
  safety?: string
  metrics: AiEmployeeMetric[]
  completed_work: AiEmployeeWorkItem[]
  next_actions: AiManagerSuggestion[]
}

export interface AiManagerToday {
  title: string
  subtitle: string
  checked_at: string
  suggestions: AiManagerSuggestion[]
  employees?: AiEmployee[]
  work_feed?: Array<AiManagerSuggestion & { employee_key?: string; employee_name?: string }>
  counts: {
    total: number
    high: number
    needs_approval: number
    blocked: number
    [key: string]: number
  }
}

export function useAiManagerToday() {
  return useQuery({
    queryKey: ['ai-manager-today'],
    queryFn: async () => {
      const response = await apiClient.get('/ai-manager/today')
      const raw = response.data?.data ?? response.data
      return (raw?.data ?? raw) as AiManagerToday
    },
    staleTime: 30000,
    retry: 1,
  })
}

export function useAiEmployeesDashboard() {
  return useQuery({
    queryKey: ['ai-manager-employees'],
    queryFn: async () => {
      const response = await apiClient.get('/ai-manager/employees')
      const raw = response.data?.data ?? response.data
      return (raw?.data ?? raw) as AiManagerToday
    },
    staleTime: 30000,
    retry: 1,
  })
}
