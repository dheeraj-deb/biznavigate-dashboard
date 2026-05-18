'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSaveWorkflowDraft, useWorkflow } from '@/hooks/use-workflows'
import type { WizardConnections, WizardNode } from './types'

interface UseWorkflowDraftParams {
  workflowId: string
}

interface DraftState {
  workflow_name: string
  description: string
  nodes: WizardNode[]
  connections: WizardConnections
}

const EMPTY_DRAFT: DraftState = {
  workflow_name: '',
  description: '',
  nodes: [],
  connections: {},
}

/**
 * Owns the wizard's draft state and pushes a debounced autosave to the backend
 * every time the user mutates something. Returns a stable mutator interface so
 * step components don't need to think about saves at all.
 *
 * Save semantics:
 *   - First mutation after a load → save fires after 800ms of inactivity.
 *   - While a save is in flight, further mutations queue up and trigger another
 *     save once the current one resolves.
 *   - Status is exposed as 'idle' | 'dirty' | 'saving' | 'saved' for UI badges.
 */
export function useWorkflowDraft({ workflowId }: UseWorkflowDraftParams) {
  const { data: remote, isLoading } = useWorkflow(workflowId)
  const saveMutation = useSaveWorkflowDraft()

  const [draft, setDraftState] = useState<DraftState>(EMPTY_DRAFT)
  const [hydrated, setHydrated] = useState(false)
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle')

  // Hydrate from server response exactly once per workflowId
  useEffect(() => {
    if (!remote || hydrated) return
    setDraftState({
      workflow_name: remote.workflow_name ?? '',
      description: remote.description ?? '',
      nodes: (remote.workflow_definition?.nodes as WizardNode[]) ?? [],
      connections: (remote.workflow_definition?.connections as WizardConnections) ?? {},
    })
    setHydrated(true)
  }, [remote, hydrated])

  // Debounced autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef(false)
  const latest = useRef(draft)
  latest.current = draft

  const flush = useCallback(async () => {
    if (!workflowId || workflowId === 'new') return
    if (saveMutation.isPending) {
      pending.current = true
      return
    }
    setStatus('saving')
    try {
      await saveMutation.mutateAsync({
        workflow_id: workflowId,
        workflow_name: latest.current.workflow_name || 'Untitled workflow',
        description: latest.current.description,
        nodes: latest.current.nodes,
        connections: latest.current.connections,
      })
      setStatus('saved')
    } catch {
      setStatus('dirty')
    } finally {
      if (pending.current) {
        pending.current = false
        // re-schedule a short follow-up to flush queued mutations
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => flush(), 300)
      }
    }
  }, [saveMutation, workflowId])

  const scheduleSave = useCallback(() => {
    setStatus('dirty')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flush(), 800)
  }, [flush])

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const setDraft = useCallback((updater: (prev: DraftState) => DraftState) => {
    setDraftState((prev) => updater(prev))
    scheduleSave()
  }, [scheduleSave])

  // ─── Mutators ────────────────────────────────────────────────────────────

  const setMeta = useCallback(
    (patch: Partial<Pick<DraftState, 'workflow_name' | 'description'>>) => {
      setDraft((prev) => ({ ...prev, ...patch }))
    },
    [setDraft],
  )

  const setTrigger = useCallback(
    (triggerType: string, params: Record<string, any> = {}) => {
      setDraft((prev) => {
        const otherNodes = prev.nodes.filter((n) => !n.type.startsWith('trigger.'))
        const triggerId = prev.nodes.find((n) => n.type.startsWith('trigger.'))?.id ?? 'trigger_1'
        const next: WizardNode = {
          id: triggerId,
          type: triggerType,
          name: 'Trigger',
          position: { x: 0, y: 0 },
          params,
        }
        return { ...prev, nodes: [next, ...otherNodes] }
      })
    },
    [setDraft],
  )

  const addStep = useCallback(
    (step: WizardNode, afterNodeId?: string) => {
      setDraft((prev) => {
        const hasTrigger = prev.nodes.some((n) => n.type?.startsWith('trigger.'))
        if (!hasTrigger) {
          // Defensive: the wizard shell disables the steps step until a trigger
          // is chosen, but guard programmatic callers so we never persist a
          // disconnected step that the reachability validator will then reject.
          return prev
        }
        const nodes = [...prev.nodes, step]
        const connections = { ...prev.connections }
        const sourceId = afterNodeId ?? findLastNodeId(prev)
        if (sourceId) {
          const existing = connections[sourceId]?.main ?? []
          // Preserve existing branches; append a new linear connection only if none yet
          if (existing.length === 0) {
            connections[sourceId] = { main: [{ node: step.id }] }
          } else if (existing.length === 1 && !existing[0].condition) {
            // Insert between sourceId → existing[0]: source → step → existing[0]
            connections[sourceId] = { main: [{ node: step.id }] }
            connections[step.id] = { main: [{ node: existing[0].node }] }
          } else {
            // Branching node — append the new step as an unconditional fallthrough.
            connections[sourceId] = { main: [...existing, { node: step.id }] }
          }
        }
        return { ...prev, nodes, connections }
      })
    },
    [setDraft],
  )

  const updateStep = useCallback(
    (nodeId: string, patch: Partial<WizardNode>) => {
      setDraft((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch, params: { ...n.params, ...(patch.params ?? {}) } } : n)),
      }))
    },
    [setDraft],
  )

  const removeStep = useCallback(
    (nodeId: string) => {
      setDraft((prev) => {
        const nodes = prev.nodes.filter((n) => n.id !== nodeId)
        const connections = { ...prev.connections }
        // Find predecessor → nodeId → successors and rewire predecessor → successors
        const successors = connections[nodeId]?.main ?? []
        delete connections[nodeId]
        for (const [src, conn] of Object.entries(connections)) {
          const filtered = conn.main.filter((e) => e.node !== nodeId)
          if (filtered.length !== conn.main.length) {
            // Predecessor edge to nodeId — replace with successors
            connections[src] = { main: [...filtered, ...successors.map((s) => ({ node: s.node }))] }
          }
        }
        return { ...prev, nodes, connections }
      })
    },
    [setDraft],
  )

  const reorderSteps = useCallback(
    (orderedIds: string[]) => {
      setDraft((prev) => {
        const byId = new Map(prev.nodes.map((n) => [n.id, n]))
        const trigger = prev.nodes.find((n) => n.type.startsWith('trigger.'))
        const ordered: WizardNode[] = []
        if (trigger) ordered.push(trigger)
        for (const id of orderedIds) {
          const node = byId.get(id)
          if (node && !node.type.startsWith('trigger.')) ordered.push(node)
        }
        // Rebuild linear connections trigger → step1 → step2 → ...
        const connections: WizardConnections = {}
        for (let i = 0; i < ordered.length - 1; i++) {
          connections[ordered[i].id] = { main: [{ node: ordered[i + 1].id }] }
        }
        // Preserve any branch connections that are not strictly linear (rare in
        // reorder context; the inline branch editor manages those explicitly).
        for (const [src, conn] of Object.entries(prev.connections)) {
          if (conn.main.length > 1) connections[src] = conn
        }
        return { ...prev, nodes: ordered, connections }
      })
    },
    [setDraft],
  )

  const setBranches = useCallback(
    (sourceId: string, branches: Array<{ node: string; condition?: any }>) => {
      setDraft((prev) => ({
        ...prev,
        connections: { ...prev.connections, [sourceId]: { main: branches } },
      }))
    },
    [setDraft],
  )

  const triggerNode = useMemo(
    () => draft.nodes.find((n) => n.type.startsWith('trigger.')) ?? null,
    [draft.nodes],
  )
  const stepNodes = useMemo(
    () => draft.nodes.filter((n) => !n.type.startsWith('trigger.')),
    [draft.nodes],
  )

  return {
    isLoading: isLoading && !hydrated,
    status,
    draft,
    triggerNode,
    stepNodes,
    setMeta,
    setTrigger,
    addStep,
    updateStep,
    removeStep,
    reorderSteps,
    setBranches,
    flushNow: flush,
  }
}

function findLastNodeId(draft: DraftState): string | null {
  // Walk connections from the trigger and return the last reachable node.
  const trigger = draft.nodes.find((n) => n.type.startsWith('trigger.'))
  if (!trigger) return null
  let current = trigger.id
  const visited = new Set<string>([current])
  while (true) {
    const next = draft.connections[current]?.main?.[0]?.node
    if (!next || visited.has(next)) return current
    visited.add(next)
    current = next
  }
}
