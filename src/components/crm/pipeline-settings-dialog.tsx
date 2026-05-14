'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus, Trash2, GripVertical, Save, Loader2, Star, Archive, Pencil, X,
} from 'lucide-react'
import {
  DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import {
  usePipelines, usePipeline, useCreatePipeline, useRenamePipeline,
  useArchivePipeline, useSetDefaultPipeline, useAddStage, useUpdateStage,
  useReorderStages, useDeleteStage, type PipelineStage,
} from '@/hooks/use-pipelines'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPipelineId?: string
}

export function PipelineSettingsDialog({ open, onOpenChange, initialPipelineId }: Props) {
  const pipelinesQ = usePipelines()
  const [selectedId, setSelectedId] = useState<string | undefined>(initialPipelineId)

  useEffect(() => {
    if (initialPipelineId) setSelectedId(initialPipelineId)
  }, [initialPipelineId])

  useEffect(() => {
    if (!selectedId && pipelinesQ.data?.length) {
      setSelectedId((pipelinesQ.data.find((p) => p.is_default) ?? pipelinesQ.data[0]).pipeline_id)
    }
  }, [selectedId, pipelinesQ.data])

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTemplate, setNewTemplate] = useState<'hospitality' | 'commerce' | 'generic' | 'real_estate' | 'service'>('generic')

  const createPipeline = useCreatePipeline()
  const renamePipeline = useRenamePipeline()
  const archivePipeline = useArchivePipeline()
  const setDefault = useSetDefaultPipeline()

  const [renameMode, setRenameMode] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [confirmArchive, setConfirmArchive] = useState(false)

  const selected = pipelinesQ.data?.find((p) => p.pipeline_id === selectedId)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pipeline Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select value={selectedId ?? ''} onValueChange={(v) => { setSelectedId(v); setRenameMode(false) }}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {(pipelinesQ.data ?? []).map((p) => (
                    <SelectItem key={p.pipeline_id} value={p.pipeline_id}>
                      {p.name}{p.is_default ? ' • Default' : ''}{p.is_archived ? ' (archived)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => { setCreating(true); setNewName(''); setNewTemplate('generic') }}>
                <Plus className="w-4 h-4 mr-1" /> New
              </Button>
              {selected && !selected.is_default ? (
                <Button variant="outline" size="sm" onClick={() => setDefault.mutate(selected.pipeline_id)}>
                  <Star className="w-4 h-4 mr-1" /> Set default
                </Button>
              ) : null}
              {selected && !selected.is_default ? (
                <Button variant="outline" size="sm" onClick={() => setConfirmArchive(true)}>
                  <Archive className="w-4 h-4 mr-1" /> Archive
                </Button>
              ) : null}
            </div>

            {creating ? (
              <Card className="p-3 space-y-2 border-dashed">
                <div className="text-sm font-medium">Create pipeline</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="Pipeline name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="max-w-xs"
                  />
                  <Select value={newTemplate} onValueChange={(v: any) => setNewTemplate(v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospitality">Hospitality template</SelectItem>
                      <SelectItem value="commerce">Commerce template</SelectItem>
                      <SelectItem value="real_estate">Real Estate template</SelectItem>
                      <SelectItem value="service">Service / Agency template</SelectItem>
                      <SelectItem value="generic">Generic template</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!newName.trim() || createPipeline.isPending}
                    onClick={async () => {
                      const res = await createPipeline.mutateAsync({ name: newName.trim(), fromTemplate: newTemplate })
                      setCreating(false)
                      setSelectedId(res.pipeline_id)
                    }}
                  >
                    {createPipeline.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Create
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCreating(false)}><X className="w-4 h-4" /></Button>
                </div>
              </Card>
            ) : null}

            {selected ? (
              <>
                <div className="flex items-center gap-2">
                  {renameMode ? (
                    <>
                      <Input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        disabled={!draftName.trim() || renamePipeline.isPending}
                        onClick={async () => {
                          await renamePipeline.mutateAsync({ pipelineId: selected.pipeline_id, name: draftName.trim() })
                          setRenameMode(false)
                          toast.success('Pipeline renamed')
                        }}
                      >
                        {renamePipeline.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenameMode(false)}><X className="w-4 h-4" /></Button>
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-lg">{selected.name}</div>
                      <Button size="sm" variant="ghost" onClick={() => { setDraftName(selected.name); setRenameMode(true) }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>

                <StagesEditor pipelineId={selected.pipeline_id} />
              </>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive pipeline?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived pipelines are hidden from the board. Leads currently on this pipeline stay where they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selected) return
                await archivePipeline.mutateAsync(selected.pipeline_id)
                toast.success('Pipeline archived')
                setSelectedId(undefined)
                setConfirmArchive(false)
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Stages editor ───────────────────────────────────────────────────────────

function StagesEditor({ pipelineId }: { pipelineId: string }) {
  const pipelineQ = usePipeline(pipelineId)
  const addStage = useAddStage()
  const updateStage = useUpdateStage()
  const reorderStages = useReorderStages()
  const deleteStage = useDeleteStage()

  const [order, setOrder] = useState<string[]>([])
  useEffect(() => {
    if (pipelineQ.data) setOrder(pipelineQ.data.stages.map((s) => s.stage_id))
  }, [pipelineQ.data])

  const stagesById = useMemo(() => {
    const m = new Map<string, PipelineStage>()
    pipelineQ.data?.stages.forEach((s) => m.set(s.stage_id, s))
    return m
  }, [pipelineQ.data])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const oldIndex = order.indexOf(String(e.active.id))
    const newIndex = order.indexOf(String(e.over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(order, oldIndex, newIndex)
    setOrder(next)
    reorderStages.mutate({ pipelineId, stageOrder: next }, {
      onError: () => {
        // rollback to server order
        if (pipelineQ.data) setOrder(pipelineQ.data.stages.map((s) => s.stage_id))
      },
    })
  }

  const [adding, setAdding] = useState(false)
  const [newStage, setNewStage] = useState({ name: '', slug: 'new', isWon: false, isLost: false })

  if (pipelineQ.isLoading) {
    return <div className="text-sm text-gray-500 py-6 text-center"><Loader2 className="inline w-4 h-4 animate-spin mr-2" />Loading stages…</div>
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Stages</div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((stageId) => {
              const stage = stagesById.get(stageId)
              if (!stage) return null
              return (
                <SortableStageRow
                  key={stageId}
                  stage={stage}
                  onUpdate={(patch) => updateStage.mutate({ stageId: stage.stage_id, ...patch })}
                  onDelete={() => deleteStage.mutate(stage.stage_id)}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {adding ? (
        <Card className="p-3 border-dashed space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Stage name (e.g. Site Visit)"
              value={newStage.name}
              onChange={(e) => setNewStage((s) => ({ ...s, name: e.target.value }))}
              className="max-w-xs"
            />
            <Select value={newStage.slug} onValueChange={(v: any) => setNewStage((s) => ({ ...s, slug: v }))}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['new', 'contacted', 'active', 'qualified', 'quoted', 'booked', 'won', 'lost'].map((slug) => (
                  <SelectItem key={slug} value={slug}>slug: {slug}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={newStage.isWon} onChange={(e) => setNewStage((s) => ({ ...s, isWon: e.target.checked, isLost: e.target.checked ? false : s.isLost }))} />
              Won
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={newStage.isLost} onChange={(e) => setNewStage((s) => ({ ...s, isLost: e.target.checked, isWon: e.target.checked ? false : s.isWon }))} />
              Lost
            </label>
            <Button
              size="sm"
              disabled={!newStage.name.trim() || addStage.isPending}
              onClick={async () => {
                await addStage.mutateAsync({
                  pipelineId,
                  name: newStage.name.trim(),
                  slug: newStage.slug,
                  isWon: newStage.isWon,
                  isLost: newStage.isLost,
                })
                setAdding(false)
                setNewStage({ name: '', slug: 'new', isWon: false, isLost: false })
                toast.success('Stage added')
              }}
            >
              {addStage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="text-xs text-gray-500">
            Slug controls how lead.status mirrors this stage. Use existing slugs to keep reporting consistent; pick &quot;won&quot; or &quot;lost&quot; to mark terminal stages.
          </div>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add stage
        </Button>
      )}
    </div>
  )
}

function SortableStageRow({ stage, onUpdate, onDelete }: {
  stage: PipelineStage
  onUpdate: (patch: { name?: string; color?: string; isWon?: boolean; isLost?: boolean }) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.stage_id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stage.name)

  return (
    <Card ref={setNodeRef} style={style} className="p-2 flex items-center gap-2">
      <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color || '#94a3b8' }} />
      {editing ? (
        <>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-7 max-w-xs" autoFocus />
          <Button
            size="sm" variant="ghost"
            disabled={!draft.trim()}
            onClick={() => { onUpdate({ name: draft.trim() }); setEditing(false) }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setDraft(stage.name); setEditing(false) }}><X className="w-3.5 h-3.5" /></Button>
        </>
      ) : (
        <>
          <span className="font-medium text-sm flex-1 truncate">{stage.name}</span>
          <span className="text-[10px] text-gray-400 font-mono">{stage.slug}</span>
          {stage.is_won ? <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700">Won</span> : null}
          {stage.is_lost ? <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700">Lost</span> : null}
          <Button size="sm" variant="ghost" onClick={() => { setDraft(stage.name); setEditing(true) }}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
    </Card>
  )
}
