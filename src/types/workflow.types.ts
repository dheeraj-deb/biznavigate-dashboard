// ============================================================================
// WORKFLOW AUTOMATION TYPES
// ============================================================================

import { Node, Edge } from 'reactflow';

// ----------------------------------------------------------------------------
// ENUMS
// ----------------------------------------------------------------------------

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum WorkflowInstanceStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
}

export enum WorkflowNodeStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum WorkflowTriggerType {
  // Lead triggers
  LEAD_CREATED = 'lead_created',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  LEAD_TAGGED = 'lead_tagged',
  LEAD_REPLIED = 'lead_replied',

  // Order triggers
  ORDER_PLACED = 'order_placed',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',

  // Customer triggers
  CUSTOMER_CREATED = 'customer_created',
  CUSTOMER_INACTIVE = 'customer_inactive',

  // Campaign triggers
  CAMPAIGN_COMPLETED = 'campaign_completed',
  CAMPAIGN_MESSAGE_SENT = 'campaign_message_sent',
  CAMPAIGN_MESSAGE_FAILED = 'campaign_message_failed',

  // Social media triggers
  INSTAGRAM_COMMENT = 'instagram_comment',
  INSTAGRAM_DM = 'instagram_dm',
  WHATSAPP_MESSAGE_RECEIVED = 'whatsapp_message_received',

  // Time-based triggers
  SCHEDULED_TIME = 'scheduled_time',
  SCHEDULED_DATE = 'scheduled_date',

  // Integration triggers
  WEBHOOK_RECEIVED = 'webhook_received',
  API_CALL = 'api_call',

  // Manual triggers
  MANUAL = 'manual',
}

// ----------------------------------------------------------------------------
// NODE TYPES
// ----------------------------------------------------------------------------

export enum WorkflowNodeType {
  // Trigger nodes
  TRIGGER = 'trigger',

  // Action nodes
  SEND_WHATSAPP = 'send_whatsapp',
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  CREATE_LEAD = 'create_lead',
  UPDATE_LEAD_STATUS = 'update_lead_status',
  ADD_LEAD_TAG = 'add_lead_tag',
  REMOVE_LEAD_TAG = 'remove_lead_tag',
  ASSIGN_LEAD = 'assign_lead',
  CREATE_FOLLOWUP = 'create_followup',
  ADD_LEAD_NOTE = 'add_lead_note',
  CREATE_NOTIFICATION = 'create_notification',
  UPDATE_CUSTOMER_SEGMENT = 'update_customer_segment',
  TRIGGER_CAMPAIGN = 'trigger_campaign',
  CALL_WEBHOOK = 'call_webhook',

  // Logic nodes
  CONDITION = 'condition',
  WAIT = 'wait',
  SPLIT = 'split',
  LOOP = 'loop',
  FILTER = 'filter',
  TRANSFORM = 'transform',

  // Special nodes
  END = 'end',
  ERROR_HANDLER = 'error_handler',
}

// ----------------------------------------------------------------------------
// NODE DATA INTERFACES
// ----------------------------------------------------------------------------

export interface BaseNodeData {
  nodeId: string,
  label: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface TriggerNodeData extends BaseNodeData {
  type: WorkflowTriggerType;
  filters?: Record<string, any>;
  schedule?: {
    cron?: string;
    timezone?: string;
    date?: string;
  };
}

export interface SendWhatsAppNodeData extends BaseNodeData {
  template_id?: string;
  message?: string;
  to?: string; // Phone number or variable like {{lead.phone_number}}
  variables?: Record<string, string>;
  media_url?: string;
}

export interface SendEmailNodeData extends BaseNodeData {
  to?: string;
  subject?: string;
  body?: string;
  template_id?: string;
  variables?: Record<string, string>;
}

export interface CreateLeadNodeData extends BaseNodeData {
  name?: string;
  phone_number?: string;
  email?: string;
  source?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

export interface UpdateLeadStatusNodeData extends BaseNodeData {
  status: 'new' | 'contacted' | 'converted' | 'lost';
  lead_id?: string; // Variable like {{trigger.lead_id}}
}

export interface AddLeadTagNodeData extends BaseNodeData {
  tags: string[];
  lead_id?: string;
}

export interface AssignLeadNodeData extends BaseNodeData {
  user_id?: string;
  team_id?: string;
  assignment_type: 'user' | 'team' | 'round_robin';
  lead_id?: string;
}

export interface CreateFollowupNodeData extends BaseNodeData {
  lead_id?: string;
  scheduled_at?: string; // ISO date or relative like "tomorrow", "+2 days"
  note?: string;
  assigned_to?: string;
}

export interface ConditionNodeData extends BaseNodeData {
  conditions: Array<{
    field: string; // e.g., "lead.status", "order.total_amount"
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_null' | 'is_not_null';
    value: any;
  }>;
  logic: 'AND' | 'OR';
}

export interface WaitNodeData extends BaseNodeData {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

export interface SplitNodeData extends BaseNodeData {
  split_type: 'ab_test' | 'random';
  branches: Array<{
    id: string;
    label: string;
    percentage: number;
  }>;
}

export interface LoopNodeData extends BaseNodeData {
  array_field: string; // Field to loop over, e.g., "leads"
  item_variable: string; // Variable name for current item, e.g., "current_lead"
}

export interface TransformNodeData extends BaseNodeData {
  transformations: Array<{
    source_field: string;
    target_field: string;
    operation: 'copy' | 'concat' | 'split' | 'uppercase' | 'lowercase' | 'custom';
    custom_code?: string; // JavaScript code for custom transformation
  }>;
}

export interface CallWebhookNodeData extends BaseNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, any>;
  response_variable?: string; // Variable name to store response
}

// Union type for all node data
export type WorkflowNodeData =
  | TriggerNodeData
  | SendWhatsAppNodeData
  | SendEmailNodeData
  | CreateLeadNodeData
  | UpdateLeadStatusNodeData
  | AddLeadTagNodeData
  | AssignLeadNodeData
  | CreateFollowupNodeData
  | ConditionNodeData
  | WaitNodeData
  | SplitNodeData
  | LoopNodeData
  | TransformNodeData
  | CallWebhookNodeData
  | BaseNodeData;

// ----------------------------------------------------------------------------
// WORKFLOW TYPES
// ----------------------------------------------------------------------------

export interface WorkflowStats {
  total_runs: number;
  successful: number;
  failed: number;
  avg_duration_ms: number;
}

export interface Workflow {
  workflow_id: string;
  business_id: string;
  tenant_id: string;

  name: string;
  description?: string;
  user_prompt?: string;

  status: WorkflowStatus;
  trigger_type: WorkflowTriggerType;
  trigger_config?: Record<string, any>;

  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];

  stats?: WorkflowStats;

  created_at: string;
  updated_at: string;
  activated_at?: string;
  last_run_at?: string;
  created_by: string;
}

export interface WorkflowInstance {
  instance_id: string;
  workflow_id: string;
  business_id: string;
  tenant_id: string;

  status: WorkflowInstanceStatus;

  trigger_data: Record<string, any>;
  context: Record<string, any>;

  current_node_id?: string;
  error_message?: string;
  error_node_id?: string;

  started_at: string;
  completed_at?: string;
  duration_ms?: number;

  resume_at?: string;
  resume_node_id?: string;

  // Populated relations
  workflow?: Workflow;
  logs?: WorkflowInstanceLog[];
}

export interface WorkflowInstanceLog {
  log_id: string;
  instance_id: string;
  business_id: string;
  tenant_id: string;

  node_id: string;
  node_type: string;
  node_name: string;

  status: WorkflowNodeStatus;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error?: string;

  executed_at: string;
  duration_ms?: number;
}

// ----------------------------------------------------------------------------
// API REQUEST/RESPONSE TYPES
// ----------------------------------------------------------------------------

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  user_prompt?: string;
  trigger_type: WorkflowTriggerType;
  trigger_config?: Record<string, any>;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  trigger_config?: Record<string, any>;
  nodes?: Node<WorkflowNodeData>[];
  edges?: Edge[];
}

export interface GenerateWorkflowRequest {
  prompt: string;
}

export interface GenerateWorkflowResponse {
  workflow: {
    name: string;
    description: string;
    trigger_type: WorkflowTriggerType;
    trigger_config?: Record<string, any>;
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
  };
}

export interface ListWorkflowsQuery {
  status?: WorkflowStatus;
  trigger_type?: WorkflowTriggerType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListWorkflowsResponse {
  workflows: Workflow[];
  total: number;
  page: number;
  limit: number;
}

export interface ListWorkflowInstancesQuery {
  workflow_id?: string;
  status?: WorkflowInstanceStatus;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface ListWorkflowInstancesResponse {
  instances: WorkflowInstance[];
  total: number;
  page: number;
  limit: number;
}

export interface ExecuteWorkflowRequest {
  trigger_data?: Record<string, any>;
}

export interface ExecuteWorkflowResponse {
  instance_id: string;
  status: WorkflowInstanceStatus;
  message: string;
}

// ----------------------------------------------------------------------------
// UI TYPES
// ----------------------------------------------------------------------------

export interface WorkflowBuilderState {
  workflow?: Workflow;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNode?: Node<WorkflowNodeData>;
  selectedEdge?: Edge;
  isDirty: boolean;
  isLoading: boolean;
  error?: string;
}

export interface NodePaletteCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  nodes: Array<{
    type: WorkflowNodeType;
    label: string;
    description: string;
    icon: string;
    defaultData: Partial<WorkflowNodeData>;
  }>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  trigger_type: WorkflowTriggerType;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  use_cases: string[];
}

// ----------------------------------------------------------------------------
// HELPER TYPES
// ----------------------------------------------------------------------------

export interface WorkflowValidationError {
  node_id?: string;
  edge_id?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface WorkflowExecutionContext {
  trigger: Record<string, any>;
  variables: Record<string, any>;
  lead?: any;
  customer?: any;
  order?: any;
  campaign?: any;
}
