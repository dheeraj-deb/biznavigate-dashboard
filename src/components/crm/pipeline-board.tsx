'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { Card } from '@/components/ui/card'
import type { Board, BoardColumn } from '@/hooks/use-pipelines'
import { makeStatusMetaFromPipeline } from '@/lib/lead-status'
import { Phone, Mail, Clock } from 'lucide-react'

interface Props {
  board: Board
  onMove: (leadId: string, fromStageId: string, toStageId: string) => void
}

export function PipelineBoard({ board, onMove }: Props) {
  const router = useRouter()
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const stageMeta = useMemo(
    () => makeStatusMetaFromPipeline(board.columns.map((c) => ({
      stage_id: c.stage_id, name: c.name, slug: c.slug, color: c.color, is_won: c.is_won, is_lost: c.is_lost,
    }))),
    [board.columns],
  )

  const activeLead = useMemo(() => {
    if (!activeId) return null
    for (const col of board.columns) {
      const found = col.leads.find((l) => l.lead_id === activeId)
      if (found) return { lead: found, fromStageId: col.stage_id }
    }
    return null
  }, [activeId, board.columns])

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const leadId = String(e.active.id)
    const toStageId = e.over ? String(e.over.id) : null
    if (!toStageId) return
    const from = board.columns.find((c) => c.leads.some((l) => l.lead_id === leadId))
    if (!from || from.stage_id === toStageId) return
    onMove(leadId, from.stage_id, toStageId)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {board.columns.map((col) => (
          <BoardColumnView key={col.stage_id} column={col} onCardClick={(id) => router.push(`/crm/leads/${id}`)} />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <LeadCard
            lead={activeLead.lead}
            accentColor={stageMeta(activeLead.lead.status).color}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ── Column ─────────────────────────────────────────────────────────────────

function BoardColumnView({ column, onCardClick }: { column: BoardColumn; onCardClick: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage_id })
  const accent = column.color || '#94a3b8'

  return (
    <div className="flex-shrink-0 w-72">
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-md border-b-2"
        style={{ borderColor: accent }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
          <span className="font-semibold text-sm">{column.name}</span>
        </div>
        <span className="text-xs text-gray-500">{column.count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`p-2 bg-gray-50 rounded-b-md min-h-[400px] space-y-2 transition-colors ${isOver ? 'bg-blue-50' : ''}`}
      >
        {column.leads.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-6">No leads</div>
        ) : (
          column.leads.map((lead) => (
            <DraggableCard
              key={lead.lead_id}
              lead={lead}
              accentColor={accent}
              onClick={() => onCardClick(lead.lead_id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────

function DraggableCard({ lead, accentColor, onClick }: { lead: BoardColumn['leads'][number]; accentColor: string; onClick: () => void }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: lead.lead_id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      style={{ opacity: isDragging ? 0 : 1 }}
    >
      <LeadCard lead={lead} accentColor={accentColor} />
    </div>
  )
}

function LeadCard({ lead, accentColor, dragging }: { lead: BoardColumn['leads'][number]; accentColor: string; dragging?: boolean }) {
  return (
    <Card
      className={`p-3 cursor-pointer transition-all border-l-4 hover:shadow-md ${dragging ? 'shadow-lg rotate-1' : ''}`}
      style={{ borderLeftColor: accentColor }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-medium text-sm truncate">{lead.name || lead.phone || 'Unknown'}</div>
        {lead.quoted_amount ? (
          <div className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
            ₹{Number(lead.quoted_amount).toLocaleString('en-IN')}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 text-xs text-gray-500">
        {lead.phone ? (
          <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</div>
        ) : null}
        {lead.email ? (
          <div className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {lead.email}</div>
        ) : null}
        {lead.followup_at ? (
          <div className="flex items-center gap-1 text-amber-600">
            <Clock className="w-3 h-3" /> {new Date(lead.followup_at).toLocaleDateString()}
          </div>
        ) : null}
      </div>
      {lead.tags?.length ? (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.slice(0, 3).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">{t}</span>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
