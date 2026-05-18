'use client'

import { useMemo } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { NodeDefinition, WizardNode } from './types'

interface BranchEditorProps {
  node: WizardNode
  def: NodeDefinition | null
  branches: Array<{ node: string; condition?: any }>
  allStepsById: Map<string, WizardNode>
  onChange: (branches: Array<{ node: string; condition?: any }>) => void
}

/**
 * For nodes that pause for a reply (menu, buttons, flow, wait_for_text), this
 * editor lets the user say "if the reply was X, go to step Y". Each row maps a
 * possible response to a downstream step.
 *
 * The shape we emit matches what the runtime expects on connections[id].main:
 *   [{ node: 'step_b', condition: { variable: 'menu_selection', operator: 'equals', value: 'book' } }]
 *
 * The wizard hides the operator vocabulary entirely — users just see "If reply
 * is X" and pick a destination step.
 */
export function BranchEditor({ node, def, branches, allStepsById, onChange }: BranchEditorProps) {
  const responseOptions = useMemo(() => deriveResponseOptions(node), [node])
  const variable = deriveOutputVariable(node, def)
  const downstreamSteps = useMemo(
    () => Array.from(allStepsById.values()).filter((s) => s.id !== node.id),
    [allStepsById, node.id],
  )

  if (!variable) {
    return (
      <p className="text-xs text-muted-foreground">
        This action doesn&rsquo;t produce a branching reply. Steps below will run unconditionally.
      </p>
    )
  }

  const updateBranch = (idx: number, patch: Partial<{ node: string; condition: any }>) => {
    onChange(branches.map((b, i) => (i === idx ? { ...b, ...patch } : b)))
  }

  const addBranch = () => {
    onChange([
      ...branches,
      {
        node: '',
        condition: { variable, operator: 'equals', value: responseOptions[0]?.value ?? '' },
      },
    ])
  }

  const removeBranch = (idx: number) => {
    onChange(branches.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      {branches.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No paths defined yet. Add one to route based on the customer&rsquo;s reply.
        </p>
      ) : (
        branches.map((branch, idx) => {
          const isFallthrough = !branch.condition
          return (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2 rounded-md bg-card p-2 ring-1 ring-border"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {isFallthrough ? 'Otherwise' : 'If reply is'}
              </span>
              {!isFallthrough && (
                <Select
                  value={String(branch.condition?.value ?? '')}
                  onValueChange={(v) =>
                    updateBranch(idx, {
                      condition: { variable, operator: 'equals', value: v },
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="Pick a reply…" />
                  </SelectTrigger>
                  <SelectContent>
                    {responseOptions.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Add menu/button items first
                      </div>
                    ) : (
                      responseOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="sr-only">Go to</Label>
              <Select
                value={branch.node || ''}
                onValueChange={(v) => updateBranch(idx, { node: v })}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="Go to step…" />
                </SelectTrigger>
                <SelectContent>
                  {downstreamSteps.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No downstream steps yet
                    </div>
                  ) : (
                    downstreamSteps.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name || s.type}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <button
                onClick={() => removeBranch(idx)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600"
                title="Remove path"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={addBranch} className="h-7 text-xs">
          + Add path
        </Button>
        {node.type === 'action.wait_for_text' && (
          <span className="text-[11px] text-muted-foreground">
            Free-text replies — leave branches empty to send all replies to the next step.
          </span>
        )}
      </div>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function deriveOutputVariable(node: WizardNode, def: NodeDefinition | null): string | null {
  if (!def?.waitForInput) return null
  return def.output_variable ?? null
}

function deriveResponseOptions(node: WizardNode): Array<{ value: string; label: string }> {
  // Pull possible reply values from the node's own params, e.g. menu[].id or buttons[].id
  if (node.type === 'action.send_message_withmenu') {
    const menu = Array.isArray(node.params?.menu) ? node.params.menu : []
    return menu
      .filter((m: any) => m?.id)
      .map((m: any) => ({ value: String(m.id), label: m.label ?? m.id }))
  }
  if (node.type === 'action.send_message_with_btns') {
    const buttons = Array.isArray(node.params?.buttons) ? node.params.buttons : []
    return buttons
      .filter((b: any) => b?.id)
      .map((b: any) => ({ value: String(b.id), label: b.title ?? b.id }))
  }
  if (node.type === 'action.collect_filter') {
    const opts = Array.isArray(node.params?.filterOptions) ? node.params.filterOptions : []
    return opts
      .filter((o: any) => o?.id)
      .map((o: any) => ({ value: String(o.id), label: o.label ?? o.id }))
  }
  return []
}
