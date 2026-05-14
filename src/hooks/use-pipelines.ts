import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ── Types ───────────────────────────────────────────────────────────────────

export interface PipelineStage {
  stage_id: string
  pipeline_id: string
  business_id: string
  name: string
  slug: string
  position: number
  color: string | null
  is_won: boolean
  is_lost: boolean
}

export interface Pipeline {
  pipeline_id: string
  business_id: string
  name: string
  industry: string | null
  is_default: boolean
  is_archived: boolean
  stages: PipelineStage[]
}

export interface BoardColumn {
  stage_id: string
  name: string
  slug: string
  position: number
  color: string | null
  is_won: boolean
  is_lost: boolean
  count: number
  leads: Array<{
    lead_id: string
    name: string | null
    phone: string | null
    email: string | null
    status: string
    quoted_amount: number | null
    assigned_to: string | null
    followup_at: string | null
    updated_at: string
    tags: string[]
    intent_type: string | null
  }>
}

export interface Board {
  pipeline_id: string
  name: string
  is_default: boolean
  columns: BoardColumn[]
}

// ── Queries ─────────────────────────────────────────────────────────────────

const unwrap = <T,>(d: any): T => d?.data ?? d

export function usePipelines() {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: async (): Promise<Pipeline[]> => {
      const res = await apiClient.get('/pipelines')
      return unwrap<Pipeline[]>(res.data) ?? []
    },
  })
}

export function usePipeline(pipelineId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline', pipelineId],
    queryFn: async (): Promise<Pipeline> => {
      const res = await apiClient.get(`/pipelines/${pipelineId}`)
      return unwrap<Pipeline>(res.data)
    },
    enabled: !!pipelineId,
  })
}

export function usePipelineBoard(pipelineId: string | undefined, perStage = 20) {
  return useQuery({
    queryKey: ['pipeline-board', pipelineId, perStage],
    queryFn: async (): Promise<Board> => {
      const res = await apiClient.get(`/pipelines/${pipelineId}/board`, { params: { perStage } })
      return unwrap<Board>(res.data)
    },
    enabled: !!pipelineId,
  })
}

// ── Mutations: pipelines ────────────────────────────────────────────────────

export function useEnsureDefaultPipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<Pipeline> => {
      const res = await apiClient.post('/pipelines/ensure-default')
      return unwrap<Pipeline>(res.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  })
}

export function useCreatePipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; fromTemplate?: 'hospitality' | 'commerce' | 'generic' | 'real_estate' | 'service' }) => {
      const res = await apiClient.post('/pipelines', data)
      return unwrap<Pipeline>(res.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      toast.success('Pipeline created')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create pipeline'),
  })
}

export function useRenamePipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pipelineId, name }: { pipelineId: string; name: string }) => {
      const res = await apiClient.patch(`/pipelines/${pipelineId}`, { name })
      return unwrap<Pipeline>(res.data)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      qc.invalidateQueries({ queryKey: ['pipeline', vars.pipelineId] })
    },
  })
}

export function useArchivePipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pipelineId: string) => apiClient.delete(`/pipelines/${pipelineId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  })
}

export function useSetDefaultPipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pipelineId: string) => apiClient.patch(`/pipelines/${pipelineId}/set-default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  })
}

// ── Mutations: stages ───────────────────────────────────────────────────────

export function useAddStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pipelineId, ...body }: { pipelineId: string; name: string; slug: string; position?: number; color?: string; isWon?: boolean; isLost?: boolean }) => {
      const res = await apiClient.post(`/pipelines/${pipelineId}/stages`, body)
      return unwrap<PipelineStage>(res.data)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      qc.invalidateQueries({ queryKey: ['pipeline', vars.pipelineId] })
      qc.invalidateQueries({ queryKey: ['pipeline-board', vars.pipelineId] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add stage'),
  })
}

export function useUpdateStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ stageId, ...patch }: { stageId: string; name?: string; color?: string; isWon?: boolean; isLost?: boolean }) => {
      const res = await apiClient.patch(`/pipelines/stages/${stageId}`, patch)
      return unwrap<PipelineStage>(res.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['pipeline-board'] })
    },
  })
}

export function useReorderStages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pipelineId, stageOrder }: { pipelineId: string; stageOrder: string[] }) =>
      apiClient.patch(`/pipelines/${pipelineId}/stages/reorder`, { stageOrder }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pipeline', vars.pipelineId] })
      qc.invalidateQueries({ queryKey: ['pipeline-board', vars.pipelineId] })
    },
  })
}

export function useDeleteStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stageId: string) => apiClient.delete(`/pipelines/stages/${stageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['pipeline-board'] })
    },
    onError: (e: any) => {
      const status = e?.response?.status
      const msg = e?.response?.data?.message
      if (status === 404) {
        // Stage already gone (likely stale cache). Refresh and move on quietly.
        qc.invalidateQueries({ queryKey: ['pipeline'] })
        qc.invalidateQueries({ queryKey: ['pipelines'] })
        toast.error(msg ?? 'Stage no longer exists — refreshed')
      } else {
        toast.error(msg ?? 'Failed to delete stage')
      }
    },
  })
}

// ── Move lead to stage (with optimistic update) ─────────────────────────────

export function useMoveLeadStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, stageId }: { leadId: string; stageId: string; pipelineId?: string }) => {
      const res = await apiClient.patch(`/leads/${leadId}/stage`, { stage_id: stageId })
      return unwrap(res.data)
    },
    onMutate: async ({ leadId, stageId, pipelineId }) => {
      if (!pipelineId) return
      const key = ['pipeline-board', pipelineId, 20]
      await qc.cancelQueries({ queryKey: ['pipeline-board', pipelineId] })
      const previous = qc.getQueryData<Board>(key)
      if (previous) {
        const next: Board = JSON.parse(JSON.stringify(previous))
        let movedLead: BoardColumn['leads'][number] | undefined
        for (const col of next.columns) {
          const idx = col.leads.findIndex((l) => l.lead_id === leadId)
          if (idx >= 0) {
            movedLead = col.leads.splice(idx, 1)[0]
            col.count = Math.max(0, col.count - 1)
            break
          }
        }
        if (movedLead) {
          const target = next.columns.find((c) => c.stage_id === stageId)
          if (target) {
            target.leads.unshift(movedLead)
            target.count += 1
          }
        }
        qc.setQueryData(key, next)
      }
      return { previous, key }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous && ctx.key) qc.setQueryData(ctx.key, ctx.previous)
      toast.error('Failed to move lead')
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', vars.leadId] })
      if (vars.pipelineId) qc.invalidateQueries({ queryKey: ['pipeline-board', vars.pipelineId] })
    },
  })
}
