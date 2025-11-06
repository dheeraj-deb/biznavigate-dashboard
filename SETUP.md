# BizNavigate Setup Guide

Complete setup instructions for the BizNavigate Inventory & CRM Dashboard.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- React Query
- Zustand
- React Hook Form
- Zod
- Axios
- Recharts
- And more...

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Update the values in `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Authentication
NEXT_PUBLIC_AUTH_TOKEN_KEY=biznavigate_auth_token

# Feature Flags
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure Overview

```
biznavigate-dashboard/
├── src/
│   ├── app/                    # Next.js 14 App Router pages
│   │   ├── auth/              # Login, Register pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── inventory/         # Products, Categories, Suppliers, Stock
│   │   ├── crm/              # Contacts, Leads, Campaigns
│   │   ├── orders/           # Order management
│   │   ├── analytics/        # Reports and analytics
│   │   ├── chatbot/          # Chatbot configuration
│   │   └── settings/         # User settings
│   │
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── layout/           # Sidebar, Header, DashboardLayout
│   │   └── auth/             # ProtectedRoute component
│   │
│   ├── lib/
│   │   ├── api-client.ts     # Axios API client with interceptors
│   │   └── utils.ts          # Utility functions
│   │
│   ├── store/
│   │   ├── auth-store.ts     # Authentication state (Zustand)
│   │   └── ui-store.ts       # UI state (Zustand)
│   │
│   ├── hooks/
│   │   ├── use-products.ts   # Product CRUD hooks
│   │   ├── use-leads.ts      # Lead CRUD hooks
│   │   └── use-websocket.ts  # WebSocket connection hook
│   │
│   └── types/
│       └── index.ts          # TypeScript type definitions
│
├── public/                    # Static assets
└── Configuration files...
```

## Available Pages

### Authentication
- `/auth/login` - User login
- `/auth/register` - User registration

### Main Application
- `/dashboard` - Main dashboard with overview
- `/inventory/products` - Product list and management
- `/inventory/categories` - Category hierarchy
- `/inventory/suppliers` - Supplier management
- `/inventory/stock-movements` - Stock tracking
- `/crm/contacts` - Contact management
- `/crm/leads` - Lead pipeline (Kanban board)
- `/crm/campaigns` - Campaign management
- `/crm/follow-ups` - Task management
- `/orders` - Order list and management
- `/analytics/sales` - Sales analytics
- `/analytics/conversions` - Lead conversion reports
- `/analytics/inventory` - Inventory reports
- `/chatbot` - Chatbot configuration
- `/settings` - User settings

## Features Implemented

### ✅ Core Features
- [x] User authentication (login/register)
- [x] Role-based access control
- [x] Protected routes
- [x] Responsive sidebar navigation
- [x] Dark mode support
- [x] Toast notifications

### ✅ Dashboard
- [x] Sales statistics
- [x] Recent orders
- [x] Active leads
- [x] Inventory status

### ✅ Inventory Management
- [x] Product CRUD operations
- [x] Search and filter
- [x] Stock level indicators
- [x] Category hierarchy
- [x] Bulk import/export UI

### ✅ CRM
- [x] Contact management
- [x] Lead Kanban board
- [x] Lead status tracking
- [x] Contact cards with actions

### ✅ Orders
- [x] Order list
- [x] Status badges
- [x] Payment tracking
- [x] Search functionality

### ✅ Analytics
- [x] Sales charts (Line, Bar, Pie)
- [x] Revenue trends
- [x] Top products
- [x] Export functionality

### ✅ Settings
- [x] Profile management
- [x] Notification preferences
- [x] Security settings
- [x] Theme customization

### ✅ Chatbot
- [x] API configuration
- [x] Message templates
- [x] Advanced settings

## Development Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

## Key Technologies

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety

### Styling
- **TailwindCSS** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### State Management
- **Zustand** - Global state (auth, UI)
- **React Query** - Server state & caching

### Forms & Validation
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Data Visualization
- **Recharts** - Charts and graphs

### API & Real-time
- **Axios** - HTTP client
- **WebSocket** - Real-time updates

## Backend Integration

The frontend expects a REST API with the following endpoints:

### Authentication
```
POST /api/auth/login
POST /api/auth/register
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Leads
```
GET    /api/leads
GET    /api/leads/:id
POST   /api/leads
PUT    /api/leads/:id
DELETE /api/leads/:id
```

### Orders
```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id
```

### WebSocket
```
WS /ws?token={auth_token}
```

Expected WebSocket message format:
```json
{
  "type": "order_update" | "lead_update" | "stock_update",
  "data": { ... }
}
```

## Customization

### Adding New Pages

1. Create page in `src/app/your-page/page.tsx`:
```tsx
'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function YourPage() {
  return (
    <DashboardLayout>
      {/* Your content */}
    </DashboardLayout>
  )
}
```

2. Add route to sidebar in `src/components/layout/sidebar.tsx`

### Adding New API Hooks

Create in `src/hooks/use-your-resource.ts`:
```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useYourResource() {
  return useQuery({
    queryKey: ['your-resource'],
    queryFn: async () => {
      const response = await apiClient.get('/your-endpoint')
      return response.data
    },
  })
}
```

### Styling Customization

Update `tailwind.config.ts` for theme colors:
```ts
colors: {
  primary: 'hsl(your-color)',
  // ...
}
```

Update `src/app/globals.css` for CSS variables.

## Testing

### Unit Tests

Test files are located next to components with `.test.tsx` extension.

Run tests:
```bash
npm test
```

Example test structure:
```tsx
import { render, screen } from '@testing-library/react'
import YourComponent from './your-component'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('...')).toBeInTheDocument()
  })
})
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t biznavigate .
docker run -p 3000:3000 biznavigate
```

## Troubleshooting

### Module Not Found Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
npm run build
# Check error messages and fix TypeScript/ESLint issues
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

## Support & Contributing

For issues and feature requests, please create an issue in the repository.

## License

MIT License - see LICENSE file for details.
