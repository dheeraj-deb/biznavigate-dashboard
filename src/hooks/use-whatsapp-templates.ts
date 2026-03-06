import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED'
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
export type HeaderType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'

export interface TemplateHeader {
  type: HeaderType
  text?: string      // required when type = TEXT, max 60 chars
  mediaUrl?: string  // required when type = IMAGE | VIDEO | DOCUMENT
  example?: string   // sample value for {{1}} in TEXT header, or sample URL for media headers
}

export interface TemplateButtonQuickReply {
  type: 'QUICK_REPLY'
  text: string
  payload?: string
}

export interface TemplateButtonCTA {
  type: 'CALL_TO_ACTION'
  text: string
  actionType: 'PHONE_NUMBER' | 'URL'
  phoneNumber?: string
  url?: string
  urlExample?: string  // resolved URL with {{1}} replaced — required when URL has a variable
}

export type TemplateButton = TemplateButtonQuickReply | TemplateButtonCTA

export interface TemplateComponents {
  header?: TemplateHeader
  body: string
  bodyExamples?: string[]  // one sample value per {{1}}, {{2}}, … in body — required when body has variables
  footer?: string
  buttons?: TemplateButton[]
}

export interface WhatsAppTemplate {
  _id: string
  name: string
  category: TemplateCategory
  language: string
  status: TemplateStatus
  rejectionReason?: string
  components: TemplateComponents
  metaTemplateId?: string
  analytics?: {
    sent: number
    delivered: number
    read: number
    clicked: number
    failed: number
  }
  createdAt: string
  updatedAt: string
}

export interface TemplateFilters {
  status?: TemplateStatus | 'all'
  category?: TemplateCategory | 'all'
  search?: string
  language?: string
  page?: number
  limit?: number
}

export interface TemplatesResponse {
  data: WhatsAppTemplate[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface TemplateStat {
  _id: TemplateStatus
  count: number
  totalSent: number
  totalDelivered: number
}

export interface CreateTemplatePayload {
  name: string
  category: TemplateCategory
  language: string
  components: TemplateComponents
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useWhatsAppTemplates(filters?: TemplateFilters) {
  const { user } = useAuthStore()
  const params = {
    ...filters,
    status: filters?.status === 'all' ? undefined : filters?.status,
    category: filters?.category === 'all' ? undefined : filters?.category,
  }

  return useQuery({
    queryKey: ['whatsapp-templates', params],
    queryFn: async () => {
      const response = await apiClient.get<WhatsAppTemplate[]>('/whatsapp/templates', { params })
      return {
        data: (response.data ?? []) as WhatsAppTemplate[],
        pagination: (response.meta as any)?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 },
      } as TemplatesResponse
    },
    enabled: !!user?.business_id,
  })
}

export function useTemplateStats() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['whatsapp-template-stats'],
    queryFn: async () => {
      const response = await apiClient.get<{ data?: TemplateStat[] } | TemplateStat[]>('/whatsapp/templates/stats')
      return ((response.data as any)?.data || response.data) as TemplateStat[]
    },
    enabled: !!user?.business_id,
  })
}

/** POST /whatsapp/templates — creates a DRAFT */
export function useCreateTemplateDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTemplatePayload) => {
      const response = await apiClient.post('/whatsapp/templates', data)
      return (response.data?.data || response.data) as WhatsAppTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-stats'] })
      toast.success('Template saved as draft')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template')
    },
  })
}

export function useGetTemplate(id: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['whatsapp-template', id],
    queryFn: async () => {
      const response = await apiClient.get<WhatsAppTemplate>(`/whatsapp/templates/${id}`)
      return response.data as WhatsAppTemplate
    },
    enabled: !!user?.business_id && !!id,
  })
}

/** PATCH /whatsapp/templates/:id — update DRAFT or REJECTED template */
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTemplatePayload> }) => {
      const response = await apiClient.patch(`/whatsapp/templates/${id}`, data)
      return (response.data?.data || response.data) as WhatsAppTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template')
    },
  })
}

/** POST /whatsapp/templates/:id/submit — send to Meta for review */
export function useSubmitTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/whatsapp/templates/${id}/submit`)
      return response.data as { message: string; metaTemplateId: string; status: TemplateStatus }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-stats'] })
      toast.success('Template submitted to Meta for review')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit template')
    },
  })
}

/** POST /whatsapp/templates/:id/sync — pull latest status from Meta */
export function useSyncTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/whatsapp/templates/${id}/sync`)
      return response.data as { status: TemplateStatus; rejectionReason?: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-stats'] })
      toast.success(`Status synced: ${data.status}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync status')
    },
  })
}

/** POST /whatsapp/templates/:id/duplicate */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/whatsapp/templates/${id}/duplicate`)
      return (response.data?.data || response.data) as WhatsAppTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-stats'] })
      toast.success('Template duplicated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate template')
    },
  })
}

/** DELETE /whatsapp/templates/:id */
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/whatsapp/templates/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-stats'] })
      toast.success('Template deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template')
    },
  })
}
