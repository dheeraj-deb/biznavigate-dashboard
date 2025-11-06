# BizNavigate - Inventory & CRM Dashboard

A modern, responsive web application for inventory management and CRM built with Next.js 14, TypeScript, and TailwindCSS.

## Features

### Authentication & Authorization
- ✅ User authentication (login/register)
- ✅ Role-based access control (Admin, Sales, Inventory Manager)
- ✅ Protected routes with authentication guards

### Dashboard
- ✅ Sales summaries with trend indicators
- ✅ Inventory status overview
- ✅ Lead activity tracking
- ✅ Real-time statistics and KPIs

### Inventory Management
- ✅ Products (CRUD operations, search, filter)
- ✅ Categories with hierarchy support
- ✅ Supplier management
- ✅ Stock movement tracking
- ✅ Bulk import/export capabilities

### CRM Module
- ✅ Contact management
- ✅ Lead tracking with Kanban board
- ✅ Campaign management
- ✅ Interaction history
- ✅ Follow-up task management

### Orders
- ✅ Order list with advanced filtering
- ✅ Order status tracking
- ✅ Payment status management
- ✅ Shipping and tracking integration

### Analytics & Reporting
- ✅ Sales reports
- ✅ Lead conversion analytics
- ✅ Inventory reports

### Configuration
- ✅ User settings
- ✅ Notification preferences
- ✅ Theme customization (light/dark mode)
- ✅ Chatbot configuration

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** Radix UI primitives
- **State Management:** Zustand
- **Data Fetching:** React Query (@tanstack/react-query)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Charts:** Recharts
- **Notifications:** React Hot Toast

### Development Tools
- **Linting:** ESLint
- **Formatting:** Prettier
- **Testing:** Jest + React Testing Library

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd biznavigate-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Update environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
biznavigate-dashboard/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── inventory/         # Inventory management pages
│   │   ├── crm/              # CRM pages
│   │   ├── orders/           # Order management pages
│   │   ├── analytics/        # Analytics pages
│   │   ├── settings/         # Settings pages
│   │   └── chatbot/          # Chatbot configuration
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── layout/           # Layout components
│   │   └── auth/             # Auth-related components
│   ├── lib/                   # Utility functions
│   │   ├── api-client.ts     # API client setup
│   │   └── utils.ts          # Helper functions
│   ├── store/                 # Zustand stores
│   │   ├── auth-store.ts     # Authentication state
│   │   └── ui-store.ts       # UI state
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts          # Centralized types
│   └── hooks/                 # Custom React hooks
├── public/                    # Static assets
├── .env.local.example        # Environment variables template
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Features Breakdown

### Dashboard ([/dashboard](src/app/dashboard/page.tsx))
- Overview statistics cards
- Recent orders list
- Active leads summary
- Inventory status grid

### Inventory Management
- **Products** ([/inventory/products](src/app/inventory/products/page.tsx))
  - Product list with search and filters
  - Stock level indicators
  - Bulk import/export

- **Categories** - Hierarchical category management
- **Suppliers** - Supplier information and contacts
- **Stock Movements** - Track inventory changes

### CRM
- **Contacts** - Customer and prospect database
- **Leads** ([/crm/leads](src/app/crm/leads/page.tsx))
  - Kanban board view
  - Lead scoring and status tracking
  - Value and probability indicators

- **Campaigns** - Marketing campaign management
- **Follow-Ups** - Task and reminder management

### Orders ([/orders](src/app/orders/page.tsx))
- Order list with status tracking
- Payment status management
- Search and filter capabilities

### Settings ([/settings](src/app/settings/page.tsx))
- Profile management
- Notification preferences
- Security settings
- Theme customization

## API Integration

The application uses a centralized API client ([src/lib/api-client.ts](src/lib/api-client.ts)) with:

- Automatic token injection
- Request/response interceptors
- Error handling
- TypeScript type safety

### Example API Usage

```typescript
import { apiClient } from '@/lib/api-client'

// GET request
const response = await apiClient.get<Product[]>('/products')

// POST request
const newProduct = await apiClient.post<Product>('/products', productData)

// PUT request
const updated = await apiClient.put<Product>(`/products/${id}`, updates)

// DELETE request
await apiClient.delete(`/products/${id}`)
```

## State Management

### Global State (Zustand)

**Auth Store** ([src/store/auth-store.ts](src/store/auth-store.ts)):
```typescript
const { user, login, logout } = useAuthStore()
```

**UI Store** ([src/store/ui-store.ts](src/store/ui-store.ts)):
```typescript
const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore()
```

### Server State (React Query)

React Query is configured for efficient data fetching and caching. Example:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: () => apiClient.get<Product[]>('/products'),
})
```

## Form Handling

Forms use React Hook Form with Zod validation:

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
})
```

## Styling

- **TailwindCSS** for utility-first styling
- **CSS Variables** for theme customization
- **Dark Mode** support via `dark:` modifiers
- **Responsive Design** with mobile-first approach

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

Test files should be placed next to the components they test with `.test.tsx` extension.

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
vercel deploy
```

### Environment Variables

Make sure to set these environment variables in your deployment platform:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@biznavigate.com or open an issue in the repository.
