'use client'

import { useMemo, useState } from 'react'
import { Braces, Search } from 'lucide-react'
import { useWorkflowVariables } from '@/hooks/use-workflow-nodes'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface VariablePopoverProps {
  /** Node types preceding the current node — restricts node output variables shown */
  precedingNodeTypes: string[]
  /** User-defined trigger constants — surfaced as ${trigger.var.NAME} */
  triggerVars?: Array<{ name?: string; value?: string }>
  onInsert: (path: string) => void
}

/**
 * "Insert variable" button — drops a `${path}` token into the active input
 * via the onInsert callback. Variables are pulled from GET /workflows/variables
 * (system + preceding node outputs) and merged with any user-defined trigger
 * constants.
 */
export function VariablePopover({ precedingNodeTypes, triggerVars, onInsert }: VariablePopoverProps) {
  const { data } = useWorkflowVariables(precedingNodeTypes)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const variables = useMemo(() => {
    const triggerVarItems = (triggerVars ?? [])
      .filter((v) => v?.name)
      .map((v) => ({
        path: `trigger.var.${v.name}`,
        label: `Trigger constant: ${v.name}`,
        example: v.value ?? '',
      }))
    const all = [...triggerVarItems, ...(data?.system ?? []), ...(data?.node_outputs ?? [])]
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (v) => v.path.toLowerCase().includes(q) || v.label.toLowerCase().includes(q),
    )
  }, [data, query, triggerVars])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-medium text-muted-foreground hover:bg-muted"
          title="Insert variable"
        >
          <Braces className="h-3 w-3" />
          Variable
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2" align="end">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search variables…"
            className="h-8 pl-7 text-xs"
            autoFocus
          />
        </div>
        <div className="mt-2 max-h-60 overflow-y-auto">
          {variables.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No variables match.
            </p>
          ) : (
            variables.slice(0, 60).map((v) => (
              <button
                key={v.path}
                type="button"
                onClick={() => {
                  onInsert(v.path)
                  setOpen(false)
                  setQuery('')
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
              >
                <code className="font-mono text-primary">${'{'}{v.path}{'}'}</code>
                <div className="mt-0.5 text-muted-foreground">{v.label}</div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
