# Install Required Dependencies for Workflow Automation

Run these commands to install the required packages:

```bash
cd biznavigate-dashboard

# Install React Flow for the visual workflow builder
npm install reactflow

# Install layout libraries for auto-arranging nodes
npm install dagre

# Install date utilities (if not already installed)
npm install date-fns

# Optional: Install React Flow types
npm install -D @types/dagre
```

## What These Packages Do:

- **reactflow**: Visual node-based workflow builder (industry standard)
- **dagre**: Graph layout algorithm for auto-arranging workflow nodes
- **date-fns**: Date formatting utilities

After installation, you can run the development server:

```bash
npm run dev
```

Then navigate to `http://localhost:3000/automations` to see the workflow automation pages.
