# Quick Installation Guide

## Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm

## Installation Steps

### Step 1: Install Dependencies

```bash
npm install
```

**Note:** If you encounter any errors, try:
```bash
npm install --legacy-peer-deps
```

### Step 2: Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and update with your API endpoints:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### Step 3: Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Step 4: Login

Default credentials (if using mock data):
- Email: `admin@biznavigate.com`
- Password: `admin123`

## What's Included

✅ **Complete Application Structure**
- Authentication system
- Dashboard with analytics
- Inventory management
- CRM with Kanban board
- Order management
- Settings and configuration

✅ **Production Ready**
- TypeScript for type safety
- ESLint & Prettier configured
- Jest testing setup
- Responsive design
- Dark mode support

✅ **Developer Experience**
- Hot reload
- Auto-formatting
- IntelliSense support
- Component library
- Reusable hooks

## Next Steps

1. **Connect to Backend API**
   - Update `NEXT_PUBLIC_API_URL` in `.env.local`
   - API client is configured in `src/lib/api-client.ts`

2. **Customize Branding**
   - Update colors in `tailwind.config.ts`
   - Modify logo and favicon in `public/`

3. **Add Features**
   - Use existing components from `src/components/ui/`
   - Follow patterns in existing pages
   - Add new routes in `src/app/`

## Build for Production

```bash
npm run build
npm run start
```

## Common Issues

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

**Build errors?**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**TypeScript errors?**
Check `tsconfig.json` and ensure all types are properly imported.

## Documentation

- Full documentation: See [README.md](README.md)
- Setup guide: See [SETUP.md](SETUP.md)
- Component examples: Check files in `src/app/`

## Support

For questions or issues, please check the documentation or create an issue in the repository.

---

**Enjoy building with BizNavigate! 🚀**
