'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export type StarterTemplateKind = 'pipeline' | 'notification_template' | 'workflow'
export type StarterTemplatePhase = 'onboarding' | 'whatsapp_connected'

export interface StarterTemplate {
  template_id: string
  key: string
  name: string
  business_type: string | null
  kind: StarterTemplateKind
  version: string
  description: string | null
  payload: Record<string, any>
  is_active: boolean
  install_phase?: StarterTemplatePhase
}

export interface StarterTemplateInstallResult {
  template_key: string
  kind: StarterTemplateKind
  status: 'installed' | 'skipped'
  reason?: string
  pipeline_id?: string
  stages_created?: number
  notification_template_id?: string
  workflow_id?: string | null
}

export interface RecommendedStarterTemplateResult {
  business_id: string
  business_type: string
  phase?: StarterTemplatePhase | 'all'
  installed: StarterTemplateInstallResult[]
}

const unwrap = <T,>(value: any): T => value?.data ?? value

export function useStarterTemplates(filters?: { business_type?: string; kind?: StarterTemplateKind; phase?: StarterTemplatePhase }) {
  return useQuery({
    queryKey: ['starter-templates', filters?.business_type ?? null, filters?.kind ?? null, filters?.phase ?? null],
    queryFn: async (): Promise<StarterTemplate[]> => {
      const response = await apiClient.get('/starter-templates', { params: filters })
      return unwrap<StarterTemplate[]>(response) ?? []
    },
  })
}

export function useApplyStarterTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ template_key, force }: { template_key: string; force?: boolean }) => {
      const response = await apiClient.post('/starter-templates/apply', { template_key, force })
      return unwrap<StarterTemplateInstallResult>(response)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['starter-templates'] })
      toast.success(result?.status === 'skipped' ? 'Template already installed' : 'Template applied')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to apply template')
    },
  })
}

export function useApplyRecommendedStarterTemplates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: { phase?: StarterTemplatePhase }) => {
      const response = await apiClient.post('/starter-templates/apply-recommended', data ?? {})
      return unwrap<RecommendedStarterTemplateResult>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['starter-templates'] })
      toast.success('Recommended templates applied')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to apply recommended templates')
    },
  })
}
