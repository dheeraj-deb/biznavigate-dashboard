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

export interface AiManagerToday {
  title: string
  subtitle: string
  checked_at: string
  suggestions: AiManagerSuggestion[]
  counts: {
    total: number
    high: number
    needs_approval: number
    blocked: number
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
