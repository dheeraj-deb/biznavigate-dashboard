# BizNavigate Workflow Automation - Design Document

## Executive Summary

This document outlines the design for an AI-powered workflow automation system for BizNavigate that simplifies automation creation through natural language. Unlike traditional platforms (Zapier, Make.com, n8n) that require manual node configuration, BizNavigate will allow users to **describe their automation in plain English**, after which **AI generates the complete workflow**, shows a **visual preview**, and allows **editing**.

---

## 1. Core Innovation: AI-First Workflow Creation

### Traditional Approach (What We're NOT Doing)
- User manually drags triggers and actions
- User configures each node individually
- Requires understanding of automation concepts
- Time-consuming for complex workflows

### BizNavigate Approach (Our Unique Value)
```
User Input: "When a new lead comes from Instagram, send them a WhatsApp message with our product catalog, wait 2 hours, then if they don't reply, assign to sales team and create a follow-up task for tomorrow"

AI Generates:
┌─────────────────┐
│ Trigger:        │
│ New Lead from   │
│ Instagram       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Action:         │
│ Send WhatsApp   │
│ Template        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Wait:           │
│ 2 hours         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Condition:      │
│ No reply?       │
└─────┬─────┬─────┘
      │     │
   Yes│     │No
      │     │
      ▼     ▼
  ┌─────┐ ┌──────┐
  │Assign│ │End   │
  │to    │ └──────┘
  │Sales │
  └──┬──┘
     │
     ▼
  ┌─────┐
  │Create│
  │Follow│
  │-up  │
  └─────┘
```

User can then:
- ✅ Preview the visual flow
- ✅ Edit nodes (change timing, messages, conditions)
- ✅ Add/remove steps
- ✅ Activate the workflow

---

## 2. System Architecture

### 2.1 Technology Stack

**Frontend:**
- **React Flow** - Node-based visual workflow editor
- **Shadcn UI** - Consistent UI components
- **Next.js** - App Router for pages
- **Zustand** - State management for workflow builder

**Backend:**
- **NestJS** - Workflow API endpoints
- **Prisma** - Database ORM
- **BullMQ** - Workflow execution engine (existing)
- **OpenAI/Anthropic API** - AI workflow generation

**Database:**
- **PostgreSQL** - Workflow storage (using existing Prisma setup)

### 2.2 Data Models

```prisma
// New tables to add to schema.prisma

model Workflow {
  id                String              @id @default(uuid())
  business_id       String
  business          Business            @relation(fields: [business_id], references: [business_id], onDelete: Cascade)

  name              String
  description       String?
  user_prompt       String              // Original user description

  status            WorkflowStatus      @default(draft) // draft, active, paused, archived
  trigger_type      WorkflowTriggerType // lead_created, order_placed, tag_added, etc.
  trigger_config    Json                // Trigger-specific configuration

  nodes             Json                // React Flow nodes array
  edges             Json                // React Flow edges array

  stats             Json?               // Execution stats {total_runs, successful, failed}

  created_at        DateTime            @default(now())
  updated_at        DateTime            @updatedAt
  created_by        String
  creator           User                @relation("WorkflowCreator", fields: [created_by], references: [user_id])

  instances         WorkflowInstance[]

  @@index([business_id, status])
  @@index([trigger_type])
}

model WorkflowInstance {
  id                String                   @id @default(uuid())
  workflow_id       String
  workflow          Workflow                 @relation(fields: [workflow_id], references: [id], onDelete: Cascade)

  status            WorkflowInstanceStatus   @default(running) // running, completed, failed, cancelled

  trigger_data      Json                     // Data that triggered the workflow
  context           Json                     // Current execution context

  current_node_id   String?                  // Currently executing node
  error_message     String?

  started_at        DateTime                 @default(now())
  completed_at      DateTime?

  logs              WorkflowInstanceLog[]

  @@index([workflow_id, status])
  @@index([started_at])
}

model WorkflowInstanceLog {
  id                String            @id @default(uuid())
  instance_id       String
  instance          WorkflowInstance  @relation(fields: [instance_id], references: [id], onDelete: Cascade)

  node_id           String
  node_type         String
  node_name         String

  status            String            // started, completed, failed, skipped
  input_data        Json?
  output_data       Json?
  error             String?

  executed_at       DateTime          @default(now())
  duration_ms       Int?

  @@index([instance_id, executed_at])
}

enum WorkflowStatus {
  draft
  active
  paused
  archived
}

enum WorkflowInstanceStatus {
  running
  completed
  failed
  cancelled
}

enum WorkflowTriggerType {
  lead_created
  lead_status_changed
  lead_tagged
  order_placed
  order_status_changed
  customer_inactive
  campaign_completed
  instagram_comment
  whatsapp_message_received
  scheduled_time
  webhook_received
  manual
}
```

### 2.3 Node Types

```typescript
// Trigger Nodes
- Lead Created
- Lead Status Changed
- Lead Tagged
- Order Placed
- Order Status Changed
- Customer Inactive (X days)
- Scheduled Time (daily/weekly/monthly)
- WhatsApp Message Received
- Instagram Comment/DM
- Webhook Received
- Manual Trigger

// Action Nodes
- Send WhatsApp Message
- Send Email
- Send SMS
- Create Lead
- Update Lead Status
- Add Lead Tag
- Assign Lead to User
- Create Follow-up Task
- Add Lead Note
- Send to CRM
- Create Notification
- Update Customer Segment
- Trigger Campaign
- Call Webhook (external integration)

// Logic Nodes
- Condition (If/Else)
- Wait/Delay (X minutes/hours/days)
- Split (A/B testing)
- Loop (for each item)
- Filter (array filtering)
- Transform Data (map/reduce)

// Special Nodes
- End Workflow
- Error Handler (catch errors)
- Webhook Response (for webhook triggers)
```

---

## 3. User Journey

### Step 1: Create New Automation

**UI: Workflow List Page** (`/automations`)

```
┌────────────────────────────────────────────────────┐
│ 🤖 Automations                          [+ New]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Active Workflows (3)                             │
│  ┌──────────────────────────────────────┐         │
│  │ 🟢 Instagram Lead Nurture             │         │
│  │ Triggered 127 times • 95% success     │         │
│  └──────────────────────────────────────┘         │
│                                                    │
│  ┌──────────────────────────────────────┐         │
│  │ 🟢 Order Follow-up Sequence           │         │
│  │ Triggered 45 times • 100% success     │         │
│  └──────────────────────────────────────┘         │
│                                                    │
│  Draft Workflows (1)                              │
│  ┌──────────────────────────────────────┐         │
│  │ ⚪ Abandoned Cart Recovery            │         │
│  │ Not activated yet                     │         │
│  └──────────────────────────────────────┘         │
└────────────────────────────────────────────────────┘
```

### Step 2: Describe Your Automation

**UI: AI Workflow Creation Dialog**

User clicks `[+ New]` button, opens dialog:

```
┌──────────────────────────────────────────────────────────┐
│ Create New Automation                              [✕]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Describe what you want to automate                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │ When a new lead comes from Instagram, send them a │ │
│  │ WhatsApp message with our product catalog, wait   │ │
│  │ 2 hours, then if they don't reply, assign to      │ │
│  │ sales team and create a follow-up task for        │ │
│  │ tomorrow                                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  💡 Examples:                                            │
│  • "Send welcome email when someone subscribes"         │
│  • "Tag customers who haven't ordered in 30 days"       │
│  • "Create follow-up task 1 day after lead is created"  │
│                                                          │
│                            [Cancel]  [Generate Workflow] │
└──────────────────────────────────────────────────────────┘
```

### Step 3: AI Generates Workflow

**Backend Process:**

```typescript
// Pseudo-code for AI generation

POST /api/workflows/generate

Request:
{
  "prompt": "When a new lead comes from Instagram...",
  "business_id": "123"
}

AI Processing:
1. Parse user intent
2. Identify trigger: "new lead from Instagram" → lead_created + filter
3. Identify actions: "send WhatsApp" → send_whatsapp_message
4. Identify wait: "wait 2 hours" → delay_node
5. Identify condition: "if they don't reply" → condition_node
6. Identify final actions: "assign to sales" + "create follow-up"
7. Generate React Flow node/edge structure
8. Return workflow JSON

Response:
{
  "workflow": {
    "name": "Instagram Lead Follow-up",
    "description": "Automated follow-up for Instagram leads",
    "trigger_type": "lead_created",
    "trigger_config": {
      "filters": {
        "source": "instagram"
      }
    },
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "data": {
          "type": "lead_created",
          "label": "New Lead from Instagram",
          "filters": { "source": "instagram" }
        },
        "position": { "x": 250, "y": 0 }
      },
      {
        "id": "action-1",
        "type": "action",
        "data": {
          "type": "send_whatsapp",
          "label": "Send Product Catalog",
          "template_id": "product_catalog",
          "message": "Hi {{name}}! Thanks for your interest..."
        },
        "position": { "x": 250, "y": 100 }
      },
      {
        "id": "wait-1",
        "type": "wait",
        "data": {
          "label": "Wait 2 Hours",
          "duration": 7200,
          "unit": "seconds"
        },
        "position": { "x": 250, "y": 200 }
      },
      {
        "id": "condition-1",
        "type": "condition",
        "data": {
          "label": "Did they reply?",
          "field": "last_activity_at",
          "operator": "is_null",
          "value": null
        },
        "position": { "x": 250, "y": 300 }
      },
      {
        "id": "action-2",
        "type": "action",
        "data": {
          "type": "assign_lead",
          "label": "Assign to Sales Team",
          "team_id": "sales"
        },
        "position": { "x": 100, "y": 450 }
      },
      {
        "id": "action-3",
        "type": "action",
        "data": {
          "type": "create_followup",
          "label": "Create Follow-up Task",
          "due_date": "tomorrow",
          "note": "Follow up on Instagram lead"
        },
        "position": { "x": 100, "y": 550 }
      },
      {
        "id": "end-1",
        "type": "end",
        "data": { "label": "End" },
        "position": { "x": 400, "y": 450 }
      }
    ],
    "edges": [
      { "id": "e1", "source": "trigger-1", "target": "action-1" },
      { "id": "e2", "source": "action-1", "target": "wait-1" },
      { "id": "e3", "source": "wait-1", "target": "condition-1" },
      { "id": "e4", "source": "condition-1", "target": "action-2", "sourceHandle": "yes" },
      { "id": "e5", "source": "action-2", "target": "action-3" },
      { "id": "e6", "source": "condition-1", "target": "end-1", "sourceHandle": "no" }
    ]
  }
}
```

### Step 4: Preview & Edit Workflow

**UI: Workflow Builder Canvas** (`/automations/builder/:id`)

```
┌────────────────────────────────────────────────────────────────┐
│ Instagram Lead Follow-up                    [Save] [Activate]  │
├────────────────────────────────────────────────────────────────┤
│  Sidebar         │          Canvas                             │
│                  │                                              │
│  🎯 Triggers     │        ┌─────────────────┐                  │
│  - Lead Created  │        │ 🎯 Trigger      │                  │
│  - Order Placed  │        │ New Lead from   │                  │
│  - Tag Added     │        │ Instagram       │                  │
│                  │        └────────┬────────┘                  │
│  ⚡ Actions      │                 │                            │
│  - Send WhatsApp │                 ▼                            │
│  - Send Email    │        ┌─────────────────┐                  │
│  - Assign Lead   │        │ 📱 Action       │                  │
│  - Create Task   │        │ Send WhatsApp   │                  │
│                  │        │ Product Catalog │                  │
│  🔀 Logic        │        └────────┬────────┘                  │
│  - Condition     │                 │                            │
│  - Wait/Delay    │                 ▼                            │
│  - Split         │        ┌─────────────────┐                  │
│                  │        │ ⏰ Wait         │                  │
│                  │        │ 2 hours         │                  │
│                  │        └────────┬────────┘                  │
│                  │                 │                            │
│                  │                 ▼                            │
│                  │        ┌─────────────────┐                  │
│                  │        │ ❓ Condition    │                  │
│                  │     ┌──│ Did they reply? │──┐               │
│                  │     │  └─────────────────┘  │               │
│                  │  Yes│                       │No             │
│                  │     ▼                       ▼               │
│                  │  ┌──────┐              ┌──────┐             │
│                  │  │Assign│              │ End  │             │
│                  │  │Sales │              └──────┘             │
│                  │  └──┬───┘                                   │
│                  │     │                                        │
│                  │     ▼                                        │
│                  │  ┌──────┐                                   │
│                  │  │Create│                                   │
│                  │  │Task  │                                   │
│                  │  └──────┘                                   │
└────────────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Drag & drop nodes from sidebar
- ✅ Click node to edit properties in right panel
- ✅ Delete/duplicate nodes
- ✅ Auto-layout algorithm (ELK.js or Dagre)
- ✅ Zoom/pan canvas
- ✅ Undo/redo
- ✅ Real-time validation (highlight errors)

### Step 5: Activate & Monitor

Once user clicks **Activate**, workflow becomes live.

**Monitoring UI:** (`/automations/:id/runs`)

```
┌────────────────────────────────────────────────────────────┐
│ Instagram Lead Follow-up - Activity Log                    │
├────────────────────────────────────────────────────────────┤
│  Status: 🟢 Active    Runs: 127    Success: 95%           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Recent Runs:                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✅ Run #127 - 2 hours ago                            │ │
│  │ Lead: John Doe (+91 98765 43210)                     │ │
│  │ ├─ ✅ Trigger: Lead created (Instagram)              │ │
│  │ ├─ ✅ Sent WhatsApp message                          │ │
│  │ ├─ ⏰ Waiting 2 hours...                             │ │
│  │ └─ ⏳ In progress                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✅ Run #126 - 5 hours ago                            │ │
│  │ Lead: Sarah Smith (+91 98765 11111)                  │ │
│  │ ├─ ✅ Trigger: Lead created (Instagram)              │ │
│  │ ├─ ✅ Sent WhatsApp message                          │ │
│  │ ├─ ✅ Waited 2 hours                                 │ │
│  │ ├─ ✅ No reply detected                              │ │
│  │ ├─ ✅ Assigned to sales team                         │ │
│  │ └─ ✅ Created follow-up task                         │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema (add Workflow, WorkflowInstance, WorkflowInstanceLog tables)
- [ ] Backend API structure
  - [ ] `POST /api/workflows/generate` - AI generation endpoint
  - [ ] `GET /api/workflows` - List workflows
  - [ ] `POST /api/workflows` - Create workflow
  - [ ] `PUT /api/workflows/:id` - Update workflow
  - [ ] `DELETE /api/workflows/:id` - Delete workflow
  - [ ] `POST /api/workflows/:id/activate` - Activate workflow
  - [ ] `POST /api/workflows/:id/deactivate` - Deactivate workflow
- [ ] Install React Flow and dependencies
- [ ] Create basic workflow list page

### Phase 2: AI Generation (Week 3)
- [ ] Integrate OpenAI/Claude API
- [ ] Create prompt engineering for workflow generation
- [ ] Build AI generation dialog UI
- [ ] Implement workflow generation endpoint
- [ ] Test AI generation with various prompts

### Phase 3: Visual Builder (Week 4-5)
- [ ] Create React Flow canvas component
- [ ] Build custom node components (Trigger, Action, Condition, Wait, End)
- [ ] Implement sidebar with draggable nodes
- [ ] Add node property editor panel
- [ ] Implement auto-layout
- [ ] Add zoom/pan controls
- [ ] Implement save functionality

### Phase 4: Execution Engine (Week 6-7)
- [ ] Create workflow executor service (BullMQ-based)
- [ ] Implement trigger listeners
  - [ ] Lead created trigger
  - [ ] Order placed trigger
  - [ ] Scheduled time trigger
  - [ ] WhatsApp message trigger
- [ ] Implement action executors
  - [ ] Send WhatsApp action
  - [ ] Assign lead action
  - [ ] Create follow-up action
  - [ ] Add tag action
- [ ] Implement logic nodes
  - [ ] Condition evaluator
  - [ ] Wait/delay executor
  - [ ] Loop executor
- [ ] Error handling and retry logic

### Phase 5: Monitoring & Analytics (Week 8)
- [ ] Create workflow runs/logs UI
- [ ] Real-time execution status
- [ ] Success/failure analytics
- [ ] Debug mode (step-by-step execution viewer)
- [ ] Performance metrics

### Phase 6: Advanced Features (Week 9-10)
- [ ] Workflow templates library
- [ ] Version control (workflow history)
- [ ] A/B testing (split node)
- [ ] Webhook triggers & responses
- [ ] External integrations (Google Sheets, Slack, etc.)
- [ ] Workflow sharing/export

---

## 5. Key Differentiators from Competitors

| Feature | Zapier | Make.com | n8n | BizNavigate |
|---------|--------|----------|-----|-------------|
| **AI-First Creation** | ❌ | ❌ | ✅ (Beta) | ✅ **Core Feature** |
| **Visual Preview** | Limited | ✅ | ✅ | ✅ |
| **Edit After Generation** | N/A | ✅ | ✅ | ✅ |
| **Built for SMEs** | Generic | Generic | Technical | ✅ **SME-focused** |
| **CRM Integration** | External | External | External | ✅ **Native** |
| **WhatsApp Native** | ❌ | Via API | Via API | ✅ **Built-in** |
| **Simple Language** | ❌ | ❌ | ❌ | ✅ **Plain English** |

### Our Unique Value Proposition:

> **"Just tell us what you want to automate in plain English. We'll build it, show you exactly what it does, and let you customize it. No technical knowledge required."**

---

## 6. Sample AI Prompts & Generated Workflows

### Example 1: Lead Nurturing

**User Prompt:**
"When someone messages us on WhatsApp for the first time, save them as a lead, send a welcome message, and create a follow-up task for tomorrow"

**Generated Workflow:**
```
Trigger: WhatsApp Message Received (first-time contact)
  ↓
Action: Create Lead (auto-fill from WhatsApp profile)
  ↓
Action: Send WhatsApp Message (welcome template)
  ↓
Action: Create Follow-up Task (scheduled for tomorrow)
  ↓
End
```

### Example 2: Order Follow-up

**User Prompt:**
"After an order is delivered, wait 3 days then send a review request WhatsApp message. If they reply with 5 stars, tag them as 'happy customer', otherwise create a support ticket"

**Generated Workflow:**
```
Trigger: Order Status Changed (to 'delivered')
  ↓
Wait: 3 days
  ↓
Action: Send WhatsApp Message ("How was your order?")
  ↓
Condition: Reply rating = 5 stars?
  ├─ Yes → Add Tag: 'happy customer' → End
  └─ No → Create Support Ticket → Assign to Support Team → End
```

### Example 3: Re-engagement Campaign

**User Prompt:**
"Find customers who haven't ordered in 60 days and send them a 20% discount code on WhatsApp"

**Generated Workflow:**
```
Trigger: Scheduled (Daily at 10 AM)
  ↓
Action: Find Customers (last_order_date > 60 days ago)
  ↓
Loop: For each customer
  ↓
  Action: Generate Discount Code (20% off)
  ↓
  Action: Send WhatsApp Message (with discount code)
  ↓
End Loop
  ↓
End
```

---

## 7. Technical Implementation Details

### 7.1 AI Workflow Generation Service

```typescript
// /src/features/workflows/services/ai-workflow-generator.service.ts

import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class AIWorkflowGeneratorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateWorkflow(prompt: string, businessId: string) {
    const systemPrompt = `
You are a workflow automation expert. Convert user descriptions into structured workflow JSON.

Available Triggers:
- lead_created, lead_status_changed, lead_tagged
- order_placed, order_status_changed
- customer_inactive, scheduled_time
- whatsapp_message_received, instagram_comment
- webhook_received, manual

Available Actions:
- send_whatsapp, send_email, send_sms
- create_lead, update_lead_status, add_lead_tag, assign_lead
- create_followup, add_lead_note, create_notification
- trigger_campaign, call_webhook

Available Logic Nodes:
- condition, wait, split, loop, filter, transform

Return valid JSON with nodes and edges in React Flow format.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const workflowData = JSON.parse(response.choices[0].message.content);

    return {
      name: workflowData.name,
      description: workflowData.description,
      trigger_type: workflowData.trigger_type,
      trigger_config: workflowData.trigger_config,
      nodes: workflowData.nodes,
      edges: workflowData.edges,
    };
  }
}
```

### 7.2 Workflow Execution Engine

```typescript
// /src/features/workflows/services/workflow-executor.service.ts

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class WorkflowExecutorService {
  constructor(
    @InjectQueue('workflows') private workflowQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async executeWorkflow(workflowId: string, triggerData: any) {
    // Create workflow instance
    const instance = await this.prisma.workflowInstance.create({
      data: {
        workflow_id: workflowId,
        status: 'running',
        trigger_data: triggerData,
        context: {},
      },
    });

    // Add to queue
    await this.workflowQueue.add('execute-workflow', {
      instanceId: instance.id,
      workflowId,
    });

    return instance;
  }

  async executeNode(instanceId: string, nodeId: string, nodeData: any, context: any) {
    // Log execution start
    await this.prisma.workflowInstanceLog.create({
      data: {
        instance_id: instanceId,
        node_id: nodeId,
        node_type: nodeData.type,
        node_name: nodeData.label,
        status: 'started',
        input_data: context,
      },
    });

    try {
      let result;

      switch (nodeData.type) {
        case 'send_whatsapp':
          result = await this.executeSendWhatsApp(nodeData, context);
          break;
        case 'create_followup':
          result = await this.executeCreateFollowup(nodeData, context);
          break;
        case 'condition':
          result = await this.executeCondition(nodeData, context);
          break;
        case 'wait':
          result = await this.executeWait(nodeData, context, instanceId);
          break;
        // ... more node types
      }

      // Log success
      await this.prisma.workflowInstanceLog.update({
        where: { id: logId },
        data: {
          status: 'completed',
          output_data: result,
        },
      });

      return result;
    } catch (error) {
      // Log failure
      await this.prisma.workflowInstanceLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          error: error.message,
        },
      });

      throw error;
    }
  }

  private async executeSendWhatsApp(nodeData: any, context: any) {
    // Use existing WhatsApp service
    const { to, template_id, variables } = nodeData;

    // Replace variables from context
    const resolvedVariables = this.resolveVariables(variables, context);

    return await this.whatsappService.sendTemplateMessage(
      to || context.lead?.phone_number,
      template_id,
      resolvedVariables,
    );
  }

  private async executeCondition(nodeData: any, context: any) {
    const { field, operator, value } = nodeData;

    // Evaluate condition
    const fieldValue = this.getNestedValue(context, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'is_null':
        return fieldValue === null || fieldValue === undefined;
      // ... more operators
    }
  }

  private async executeWait(nodeData: any, context: any, instanceId: string) {
    const { duration, unit } = nodeData;

    // Convert to milliseconds
    const delayMs = unit === 'hours' ? duration * 3600000 : duration * 1000;

    // Schedule continuation
    await this.workflowQueue.add(
      'resume-workflow',
      { instanceId },
      { delay: delayMs },
    );

    return { delayed: true, resumeAt: new Date(Date.now() + delayMs) };
  }
}
```

### 7.3 React Flow Custom Nodes

```typescript
// /src/components/workflows/nodes/TriggerNode.tsx

import { Handle, Position } from 'reactflow';

export function TriggerNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-900 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
          🎯
        </div>
        <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">
          Trigger
        </div>
      </div>
      <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
        {data.label}
      </div>
      {data.filters && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {Object.entries(data.filters).map(([key, value]) => (
            <div key={key}>
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Similar components for:
// - ActionNode
// - ConditionNode (with 2 handles: 'yes' and 'no')
// - WaitNode
// - EndNode
```

---

## 8. Success Metrics

### Product Metrics
- **Time to Create Workflow**: < 2 minutes (vs 10-15 minutes manual)
- **AI Accuracy**: > 80% workflows require no edits
- **User Satisfaction**: > 4.5/5 stars
- **Adoption Rate**: > 50% of active businesses create at least 1 workflow

### Business Metrics
- **Automation Coverage**: Average 5+ workflows per business
- **Messages Automated**: > 70% of routine messages sent via workflows
- **Time Saved**: Average 10 hours/week per business
- **Customer Retention**: +20% for businesses using workflows

---

## 9. Future Enhancements

### Q2 2025
- Multi-language workflow generation (Hindi, Spanish, etc.)
- Workflow marketplace (share templates)
- Advanced analytics (conversion tracking per workflow)
- Mobile app workflow monitoring

### Q3 2025
- Voice-based workflow creation ("Hey BizNavigate, create a workflow that...")
- AI-suggested optimizations ("Your workflow could be 30% faster if...")
- External integrations (Shopify, WooCommerce, Google Sheets)
- Custom JavaScript code nodes (for advanced users)

### Q4 2025
- Collaborative workflows (multi-user editing)
- Workflow A/B testing built-in
- Predictive analytics (AI predicts workflow performance)
- Cross-business workflow templates (industry-specific)

---

## Conclusion

This AI-powered workflow automation system will be a **game-changer** for BizNavigate users. By removing the complexity of traditional automation builders and letting users simply describe what they want in plain English, we make powerful automation accessible to every small business owner—no technical knowledge required.

**Next Steps:**
1. Review and approve this design
2. Begin Phase 1 implementation (database + APIs)
3. Build AI generation prototype
4. User testing with 5-10 pilot businesses
5. Iterate and launch

---

**Sources:**
- [n8n AI Workflow Builder](https://max-productive.ai/blog/n8n-ai-workflow-builder-launch-natural-language-automation/)
- [AI Workflow Automation Guide 2025](https://www.flowforma.com/blog/ai-workflow-automation-guide)
- [React Flow Official Docs](https://reactflow.dev)
- [React Flow Workflow Editor Template](https://reactflow.dev/ui/templates/workflow-editor)
- [n8n vs Make vs Zapier Comparison](https://www.digidop.com/blog/n8n-vs-make-vs-zapier)
