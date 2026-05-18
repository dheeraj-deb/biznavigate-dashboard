'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkflowNodes } from '@/hooks/use-workflow-nodes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StepEditDrawer } from './step-edit-drawer'
import { BranchEditor } from './branch-editor'
import type { NodeDefinition, WizardConnections, WizardNode } from './types'

interface StepStepsProps {
  triggerNode: WizardNode | null
  stepNodes: WizardNode[]
  connections: WizardConnections
  onAddStep: (node: WizardNode, afterNodeId?: string) => void
  onUpdateStep: (nodeId: string, patch: Partial<WizardNode>) => void
  onRemoveStep: (nodeId: string) => void
  onReorder: (orderedIds: string[]) => void
  onSetBranches: (sourceId: string, branches: Array<{ node: string; condition?: any }>) => void
}

export function StepSteps(props: StepStepsProps) {
  const {
    triggerNode,
    stepNodes,
    connections,
    onAddStep,
    onUpdateStep,
    onRemoveStep,
    onReorder,
    onSetBranches,
  } = props

  const { data: nodeDefsResult } = useWorkflowNodes()
  const allDefs: NodeDefinition[] = useMemo(
    () => (nodeDefsResult as any)?.data?.nodes ?? (nodeDefsResult as any)?.nodes ?? [],
    [nodeDefsResult],
  )
  const actionDefs = useMemo(() => allDefs.filter((d) => d.category === 'action'), [allDefs])
  const defByType = useMemo(() => new Map(allDefs.map((d) => [d.type, d])), [allDefs])

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [addingAfterId, setAddingAfterId] = useState<string | null | undefined>(undefined)

  const editingNode = stepNodes.find((n) => n.id === editingNodeId) ?? null
  const editingDef = editingNode ? defByType.get(editingNode.type) ?? null : null

  // Variables a node can reference = system + outputs of EARLIER nodes only.
  const precedingTypesFor = (nodeId: string): string[] => {
    const types: string[] = []
    if (triggerNode) types.push(triggerNode.type)
    for (const n of stepNodes) {
      if (n.id === nodeId) break
      types.push(n.type)
    }
    return types
  }

  const handleAdd = (def: NodeDefinition) => {
    const newNode: WizardNode = {
      id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: def.type,
      name: def.label,
      position: { x: 0, y: stepNodes.length + 1 },
      params: {},
    }
    onAddStep(newNode, addingAfterId ?? stepNodes.at(-1)?.id ?? triggerNode?.id)
    setAddingAfterId(undefined)
    setEditingNodeId(newNode.id)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = stepNodes.findIndex((n) => n.id === active.id)
    const newIdx = stepNodes.findIndex((n) => n.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = arrayMove(stepNodes, oldIdx, newIdx).map((n) => n.id)
    onReorder(reordered)
  }

  if (!triggerNode) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Pick a trigger first in the previous step.
      </div>
    )
  }

  const triggerDef = defByType.get(triggerNode.type)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">What should happen?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the steps your automation will take, in order. Drag to reorder, click to edit.
        </p>
      </div>

      {/* Trigger pill (non-editable) */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-white text-base shadow-sm">
          {triggerDef?.icon ?? '⚡'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              When
            </span>
            <span className="text-sm font-semibold">{triggerDef?.label ?? 'Trigger'}</span>
          </div>
          {triggerNode.params?.intent && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              intent = <code className="rounded bg-muted px-1 py-0.5 font-mono">{triggerNode.params.intent}</code>
            </p>
          )}
        </div>
      </div>

      {/* Steps list (sortable) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stepNodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {stepNodes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-8 text-center text-sm text-muted-foreground">
                No steps yet. Add the first one below.
              </div>
            ) : (
              stepNodes.map((node) => (
                <SortableStepCard
                  key={node.id}
                  node={node}
                  def={defByType.get(node.type) ?? null}
                  branches={connections[node.id]?.main ?? []}
                  allStepsById={new Map(stepNodes.map((n) => [n.id, n]))}
                  onEdit={() => setEditingNodeId(node.id)}
                  onDelete={() => onRemoveStep(node.id)}
                  onAddAfter={() => setAddingAfterId(node.id)}
                  onSetBranches={(branches) => onSetBranches(node.id, branches)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add step trigger */}
      <AddStepPicker
        actionDefs={actionDefs}
        onPick={handleAdd}
        afterNodeId={addingAfterId}
        onCancelInsert={() => setAddingAfterId(undefined)}
      />

      {/* Edit drawer */}
      <StepEditDrawer
        open={!!editingNodeId}
        onClose={() => setEditingNodeId(null)}
        node={editingNode}
        nodeDef={editingDef}
        precedingNodeTypes={editingNode ? precedingTypesFor(editingNode.id) : []}
        triggerVars={Array.isArray(triggerNode?.params?.vars) ? triggerNode!.params.vars : []}
        onChange={(params) => editingNode && onUpdateStep(editingNode.id, { params })}
        onRename={(name) => editingNode && onUpdateStep(editingNode.id, { name })}
        onDelete={() => editingNode && onRemoveStep(editingNode.id)}
      />
    </div>
  )
}

// ─── Sortable step card ──────────────────────────────────────────────────────

function SortableStepCard({
  node,
  def,
  branches,
  allStepsById,
  onEdit,
  onDelete,
  onAddAfter,
  onSetBranches,
}: {
  node: WizardNode
  def: NodeDefinition | null
  branches: Array<{ node: string; condition?: any }>
  allStepsById: Map<string, WizardNode>
  onEdit: () => void
  onDelete: () => void
  onAddAfter: () => void
  onSetBranches: (branches: Array<{ node: string; condition?: any }>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const summary = useMemo(() => paramSummary(node, def), [node, def])
  const isWaiting = def?.waitForInput ?? false
  const [branchesOpen, setBranchesOpen] = useState(false)

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group flex items-start gap-2 rounded-lg border border-border bg-card p-3 transition hover:border-primary/30 hover:shadow-sm">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="grid h-8 w-6 cursor-grab place-items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-muted text-base">
          {def?.icon ?? '⚙️'}
        </div>

        {/* Body */}
        <button onClick={onEdit} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold">{node.name || def?.label || node.type}</h4>
            {isWaiting && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Waits for reply
              </span>
            )}
          </div>
          {summary && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{summary}</p>
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-8 px-2">
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 px-2">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onAddAfter}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Insert step after
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                Delete step
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inline branch editor — only visible for waiting actions */}
      {isWaiting && (
        <div className="ml-9 mt-1">
          <button
            onClick={() => setBranchesOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${branchesOpen ? '' : '-rotate-90'}`}
            />
            What happens next? {branches.length > 1 ? `(${branches.length} paths)` : ''}
          </button>
          {branchesOpen && (
            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
              <BranchEditor
                node={node}
                def={def}
                branches={branches}
                allStepsById={allStepsById}
                onChange={onSetBranches}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add-step picker ─────────────────────────────────────────────────────────

function AddStepPicker({
  actionDefs,
  onPick,
  afterNodeId,
  onCancelInsert,
}: {
  actionDefs: NodeDefinition[]
  onPick: (def: NodeDefinition) => void
  afterNodeId: string | null | undefined
  onCancelInsert: () => void
}) {
  const [open, setOpen] = useState(false)

  const showInsertHint = afterNodeId !== undefined
  const grouped = useMemo(() => groupActions(actionDefs), [actionDefs])

  return (
    <div>
      {showInsertHint && (
        <div className="mb-2 flex items-center justify-between rounded-md bg-primary/5 px-3 py-2 text-xs text-primary">
          Inserting after the selected step
          <button onClick={onCancelInsert} className="rounded px-1.5 py-0.5 font-medium hover:bg-primary/10">
            Cancel
          </button>
        </div>
      )}

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground">
            <Plus className="h-4 w-4" />
            Add step
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-96 p-2" align="center" side="top">
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(grouped).map(([groupLabel, items]) => (
              <div key={groupLabel} className="mb-2 last:mb-0">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {groupLabel}
                </div>
                {items.map((def) => (
                  <button
                    key={def.type}
                    onClick={() => {
                      onPick(def)
                      setOpen(false)
                    }}
                    className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-muted"
                  >
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-muted text-base">
                      {def.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{def.label}</span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {def.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function groupActions(actionDefs: NodeDefinition[]): Record<string, NodeDefinition[]> {
  const groups: Record<string, NodeDefinition[]> = {
    Messaging: [],
    'Interactive replies': [],
    Catalog: [],
    Payments: [],
    'AI / RAG': [],
    Other: [],
  }
  for (const def of actionDefs) {
    if (def.type === 'action.send_message' || def.type === 'action.send_template' || def.type === 'action.wait_for_text') {
      groups.Messaging.push(def)
    } else if (
      def.type === 'action.send_message_withmenu' ||
      def.type === 'action.send_message_with_btns' ||
      def.type === 'action.send_flow' ||
      def.type === 'action.collect_filter'
    ) {
      groups['Interactive replies'].push(def)
    } else if (def.type === 'action.send_catalog') {
      groups.Catalog.push(def)
    } else if (def.type === 'action.send_payment_request') {
      groups.Payments.push(def)
    } else if (def.type === 'action.rag_search' || def.type === 'action.rag_chat') {
      groups['AI / RAG'].push(def)
    } else {
      groups.Other.push(def)
    }
  }
  return Object.fromEntries(Object.entries(groups).filter(([, items]) => items.length > 0))
}

function paramSummary(node: WizardNode, def: NodeDefinition | null): string | null {
  if (!def) return null
  const params = node.params ?? {}
  if (params.message) return String(params.message).slice(0, 120)
  if (params.body || params.body_text) return String(params.body ?? params.body_text).slice(0, 120)
  if (params.prompt) return `Asks: "${String(params.prompt).slice(0, 100)}"`
  if (params.template_name) return `Template: ${params.template_name}`
  if (params.query) return `Search: ${params.query}`
  if (params.flow_id) return `Flow ID: ${params.flow_id}`
  return def.description
}
