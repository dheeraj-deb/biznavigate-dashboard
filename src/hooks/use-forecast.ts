import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ForecastResult, ForecastRequest, CampaignOptimization } from '@/types/forecast'

// Get revenue forecast
export function useForecast(params: ForecastRequest) {
  return useQuery({
    queryKey: ['forecast', params.forecast_type, params.days],
    queryFn: async () => {
      const { data } = await apiClient.post<ForecastResult>('/ai/forecasts/generate', params)
      return data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!params.forecast_type && !!params.days,
  })
}

// Get all forecasts history
export function useForecasts(forecast_type?: string) {
  return useQuery({
    queryKey: ['forecasts', forecast_type],
    queryFn: async () => {
      const { data } = await apiClient.get<ForecastResult[]>('/ai/forecasts', {
        params: { forecast_type },
      })
      return data
    },
  })
}

// Generate new forecast
export function useGenerateForecast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ForecastRequest) => {
      const { data } = await apiClient.post<ForecastResult>('/ai/forecasts/generate', payload)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forecast', variables.forecast_type] })
      queryClient.invalidateQueries({ queryKey: ['forecasts'] })
    },
  })
}

// Get campaign optimization suggestions
export function useCampaignOptimization(campaign_id?: string) {
  return useQuery({
    queryKey: ['campaign-optimization', campaign_id],
    queryFn: async () => {
      const { data } = await apiClient.get<CampaignOptimization>(
        `/ai/campaigns/${campaign_id}/optimize`
      )
      return data
    },
    enabled: !!campaign_id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })
}

// Get optimization recommendations for all campaigns
export function useCampaignOptimizations() {
  return useQuery({
    queryKey: ['campaign-optimizations'],
    queryFn: async () => {
      const { data } = await apiClient.get<CampaignOptimization[]>('/ai/campaigns/optimize')
      return data
    },
  })
}

// Apply optimization recommendation
export function useApplyOptimization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      campaign_id: string
      optimization_id: string
      apply_all?: boolean
    }) => {
      const { data } = await apiClient.post('/ai/campaigns/optimize/apply', payload)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-optimization', variables.campaign_id] })
      queryClient.invalidateQueries({ queryKey: ['campaign-optimizations'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// Get AI insights for specific metric
export function useAIInsights(metric_type: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['ai-insights', metric_type, filters],
    queryFn: async () => {
      const { data } = await apiClient.post('/ai/insights', {
        metric_type,
        filters,
      })
      return data
    },
    enabled: !!metric_type,
  })
}
