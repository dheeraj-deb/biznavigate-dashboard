// Shared types for the workflow wizard. The shape mirrors the backend wire
// format (nodes[] + connections{}) so the wizard can ship them straight to
// POST /workflows without translation.

export type WorkflowStepId = 'name' | 'trigger' | 'steps' | 'review'

export interface WizardNode {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  params: Record<string, any>
  outputVariable?: string
}

export type WizardConnections = Record<
  string,
  { main: Array<{ node: string; condition?: any }> }
>

export interface NodeParamDefinition {
  key: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'select'
  items?: NodeParamDefinition[]
  constraints?: {
    min?: number
    max?: number
    pattern?: string
    enum?: string[]
  }
}

export interface NodeDefinition {
  type: string
  category: 'trigger' | 'action'
  label: string
  description: string
  icon: string
  waitForInput: boolean
  output_variable: string | null
  params: NodeParamDefinition[]
}

export interface VariableOption {
  path: string
  label: string
  example?: string
}

export interface WorkflowTemplateMeta {
  id: string
  name: string
  description: string
  icon: string
  category: 'engagement' | 'commerce' | 'support' | 'reactivation'
  business_types: string[]
}
