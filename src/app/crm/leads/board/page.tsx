'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PipelineBoard } from '@/components/crm/pipeline-board'
import { PipelineSettingsDialog } from '@/components/crm/pipeline-settings-dialog'
import {
  usePipelines, usePipelineBoard, useEnsureDefaultPipeline, useMoveLeadStage,
} from '@/hooks/use-pipelines'
import { List, LayoutGrid, Loader2, Settings } from 'lucide-react'

export default function LeadBoardPage() {
  const router = useRouter()
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const pipelinesQ = usePipelines()
  const ensureDefault = useEnsureDefaultPipeline()
  const moveStage = useMoveLeadStage()

  // Pick default pipeline once loaded; if none, seed one.
  useEffect(() => {
    if (!pipelinesQ.data) return
    if (pipelinesQ.data.length === 0 && !ensureDefault.isPending) {
      ensureDefault.mutate()
      return
    }
    if (!selectedPipelineId && pipelinesQ.data.length > 0) {
      const def = pipelinesQ.data.find((p) => p.is_default) ?? pipelinesQ.data[0]
      setSelectedPipelineId(def.pipeline_id)
    }
  }, [pipelinesQ.data, selectedPipelineId, ensureDefault])

  const boardQ = usePipelineBoard(selectedPipelineId, 20)

  const onMove = (leadId: string, _from: string, toStageId: string) => {
    if (!selectedPipelineId) return
    moveStage.mutate({ leadId, stageId: toStageId, pipelineId: selectedPipelineId })
  }

  const isInitialLoading = pipelinesQ.isLoading || ensureDefault.isPending || (selectedPipelineId && boardQ.isLoading)

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4 max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Lead Pipeline</h1>
            <p className="text-sm text-gray-500">Drag cards between stages to update lead status.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPipelineId ?? ''} onValueChange={(v) => setSelectedPipelineId(v)}>
              <SelectTrigger className="w-[220px] h-9">
                <SelectValue placeholder="Select pipeline" />
              </SelectTrigger>
              <SelectContent>
                {(pipelinesQ.data ?? []).map((p) => (
                  <SelectItem key={p.pipeline_id} value={p.pipeline_id}>
                    {p.name}{p.is_default ? ' (Default)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => router.push('/crm/leads')}>
              <List className="w-4 h-4 mr-1" /> List
            </Button>
            <Button variant="default" size="sm">
              <LayoutGrid className="w-4 h-4 mr-1" /> Board
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-1" /> Settings
            </Button>
          </div>
        </div>

        <PipelineSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          initialPipelineId={selectedPipelineId}
        />

        {isInitialLoading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </Card>
        ) : boardQ.data ? (
          <PipelineBoard board={boardQ.data} onMove={onMove} />
        ) : (
          <Card className="p-12 text-center text-gray-500">No pipeline available.</Card>
        )}
      </div>
    </DashboardLayout>
  )
}
