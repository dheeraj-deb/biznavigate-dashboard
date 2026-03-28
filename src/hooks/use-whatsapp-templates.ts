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
  bodyExamples?: string[]          // one sample value per {{1}}, {{2}}, … — required when body has variables
  variableDescriptions?: string[]  // human-readable description per variable, [0] = {{1}}, [1] = {{2}}, …
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
      return ((response as any).data?.data || (response as any).data) as WhatsAppTemplate
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
      return ((response as any).data?.data || (response as any).data) as WhatsAppTemplate
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
      return ((response as any).data?.data || (response as any).data) as WhatsAppTemplate
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

/** POST /whatsapp/templates/sync-from-meta — import all templates from Meta into local DB */
export function useSyncTemplatesFromMeta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/whatsapp/templates/sync-from-meta')
      return response.data as { message: string; created: number; updated: number; total: number }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-template-stats'] })
      toast.success(`Synced from Meta — ${data.created} created, ${data.updated} updated (${data.total} total)`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync templates from Meta')
    },
  })
}

// ── Approved templates (flat components array format) ─────────────────────────

// Actual API response shape: components is an object, not an array
export interface ApprovedTemplateComponents {
  body?: string
  bodyExamples?: string[]
  variableDescriptions?: string[]
  header?: { type: string; text?: string; format?: string; mediaUrl?: string }
  footer?: string
  buttons?: any[]
}

export interface ApprovedTemplate {
  _id: string
  businessId?: string
  name: string
  language: string
  category: string
  status: string
  metaTemplateId?: string
  components: ApprovedTemplateComponents
  createdAt: string
  updatedAt: string
}

/** GET /whatsapp/templates/approved — all APPROVED templates for the business */
export function useApprovedTemplates() {
  return useQuery({
    queryKey: ['whatsapp-templates-approved'],
    queryFn: async () => {
      const response = await apiClient.get('/whatsapp/templates/approved')
      const raw = (response as any).data
      // unwrap { success, data: [...] } envelope if present
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
      return list as ApprovedTemplate[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** GET /whatsapp/templates/by-name/:name — single template by exact Meta name */
export function useTemplateByName(name: string) {
  return useQuery({
    queryKey: ['whatsapp-template-by-name', name],
    queryFn: async () => {
      const response = await apiClient.get(`/whatsapp/templates/by-name/${encodeURIComponent(name)}`)
      const raw = (response as any).data
      // unwrap { success, data: {...}, message, meta } envelope
      return (raw?.data ?? raw) as ApprovedTemplate
    },
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
    retry: false,
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
