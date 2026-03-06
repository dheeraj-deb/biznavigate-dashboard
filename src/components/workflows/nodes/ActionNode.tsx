import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { CheckCheck, ChevronRight } from 'lucide-react'
import { WorkflowNodeData } from '@/types/workflow.types'

// Keys that hold interactive items (menu rows, button options, etc.)
const INTERACTIVE_KEYS = ['menu', 'options', 'buttons', 'items']

// ── Standard (non-interactive) node ─────────────────────────────────────────

function StandardNode({ data, selected }: { data: any; selected: boolean }) {
  const params: Record<string, any> = (!Array.isArray(data.params) && data.params) ? data.params : {}

  return (
    <div
      className={`rounded-2xl shadow-md transition-all overflow-hidden ${selected ? 'ring-2 ring-[#25D366] ring-offset-1' : ''}`}
      style={{ minWidth: 220, maxWidth: 280 }}
    >
      {/* target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-[#25D366] border-2 border-white"
      />

      {/* Node type label */}
      <div className="bg-[#128C7E] px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
          {data.label}
        </span>
        <span className="text-[10px] text-white/70">Action</span>
      </div>

      {/* Message bubble */}
      <div className="bg-[#ECE5DD] px-2 py-2">
        <div className="bg-[#DCF8C6] rounded-lg rounded-tl-none px-3 py-2 shadow-sm relative">
          {/* sender triangle */}
          <span
            className="absolute -left-2 top-0 w-0 h-0"
            style={{
              borderRight: '8px solid #DCF8C6',
              borderBottom: '8px solid transparent',
            }}
          />
          <p className="text-xs text-[#1E1E1E] leading-relaxed whitespace-pre-wrap break-words">
            {params.message || <span className="italic text-gray-400">No message</span>}
          </p>
          <div className="flex justify-end mt-1 gap-1 items-center">
            <span className="text-[9px] text-[#8C9A88]">now</span>
            <CheckCheck className="h-3 w-3 text-[#34B7F1]" />
          </div>
        </div>
      </div>

      {/* source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 !bg-[#25D366] border-2 border-white"
      />
    </div>
  )
}

// ── Interactive (menu / list / buttons) node ─────────────────────────────────

function InteractiveNode({ data, selected, items, interactiveKey }: {
  data: any
  selected: boolean
  items: any[]
  interactiveKey: string
}) {
  const params: Record<string, any> = (!Array.isArray(data.params) && data.params) ? data.params : {}
  const isButtons = interactiveKey === 'buttons'

  return (
    <div
      className={`rounded-2xl shadow-md transition-all overflow-hidden ${selected ? 'ring-2 ring-[#25D366] ring-offset-1' : ''}`}
      style={{ minWidth: 240, maxWidth: 300 }}
    >
      {/* target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-[#25D366] border-2 border-white"
      />

      {/* Node type label */}
      <div className="bg-[#128C7E] px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
          {data.label}
        </span>
        <span className="text-[10px] text-white/70">Action</span>
      </div>

      {/* WhatsApp chat background */}
      <div className="bg-[#ECE5DD] px-2 pt-2 pb-0">
        {/* Message bubble */}
        <div className="bg-white rounded-lg rounded-tl-none shadow-sm relative">
          {/* sender triangle */}
          <span
            className="absolute -left-2 top-0 w-0 h-0"
            style={{
              borderRight: '8px solid #ffffff',
              borderBottom: '8px solid transparent',
            }}
          />

          {/* Header / title */}
          {params.header && (
            <div className="px-3 pt-2 pb-1">
              <p className="text-[11px] font-bold text-[#1E1E1E]">{params.header}</p>
            </div>
          )}

          {/* Message body */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs text-[#1E1E1E] leading-relaxed whitespace-pre-wrap break-words">
              {params.message || <span className="italic text-gray-400">No message</span>}
            </p>
          </div>

          {/* Footer */}
          {params.footer && (
            <div className="px-3 pb-1">
              <p className="text-[10px] text-gray-400 italic">{params.footer}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex justify-end px-3 pb-2 gap-1 items-center">
            <span className="text-[9px] text-[#8C9A88]">now</span>
            <CheckCheck className="h-3 w-3 text-[#34B7F1]" />
          </div>

          {/* Divider before items */}
          <div className="border-t border-gray-100" />

          {/* Buttons style */}
          {isButtons
            ? items.map((item: any, idx: number) => {
                const handleId = item.id ?? `item_${idx}`
                return (
                  <div
                    key={handleId}
                    className="relative border-b last:border-b-0 border-gray-100"
                  >
                    <div className="flex items-center justify-center px-3 py-2">
                      <span className="text-xs font-medium text-[#0084FF] truncate">
                        {item.label ?? item.title ?? item.text ?? handleId}
                      </span>
                    </div>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={handleId}
                      style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
                      className="w-3 h-3 !bg-[#25D366] border-2 border-white"
                    />
                  </div>
                )
              })
            : /* List / Menu style */
              items.map((item: any, idx: number) => {
                const handleId = item.id ?? `item_${idx}`
                return (
                  <div
                    key={handleId}
                    className="relative border-b last:border-b-0 border-gray-100"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 pr-8">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1E1E1E] truncate">
                          {item.label ?? item.title ?? item.text ?? handleId}
                        </p>
                        {item.description && (
                          <p className="text-[10px] text-gray-400 truncate">{item.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                    </div>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={handleId}
                      style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
                      className="w-3 h-3 !bg-[#25D366] border-2 border-white"
                    />
                  </div>
                )
              })}
        </div>

        {/* Spacer below bubble */}
        <div className="h-2" />
      </div>

      {/* Default fallback handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 !bg-[#25D366] border-2 border-white"
      />
    </div>
  )
}

// ── Exported node ─────────────────────────────────────────────────────────────

export const ActionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const d = data as any
  const params: Record<string, any> = (!Array.isArray(d.params) && d.params) ? d.params : {}

  const interactiveKey = INTERACTIVE_KEYS.find((k) => Array.isArray(params[k]) && params[k].length > 0)
  const interactiveItems: any[] = interactiveKey ? params[interactiveKey] : []

  if (interactiveItems.length > 0 && interactiveKey) {
    return (
      <InteractiveNode
        data={d}
        selected={!!selected}
        items={interactiveItems}
        interactiveKey={interactiveKey}
      />
    )
  }

  return <StandardNode data={d} selected={!!selected} />
})

ActionNode.displayName = 'ActionNode'
