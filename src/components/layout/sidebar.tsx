'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  MessageSquare,
  FolderTree,
  Building2,
  TrendingUp,
  Mail,
  UserPlus,
  Calendar,
  ChevronLeft,
  Instagram,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Inventory',
    icon: Package,
    children: [
      { name: 'Products', href: '/inventory/products' },
      { name: 'Categories', href: '/inventory/categories' },
      { name: 'Suppliers', href: '/inventory/suppliers' },
      { name: 'Stock Movements', href: '/inventory/stock-movements' },
    ],
  },
  {
    name: 'CRM',
    icon: Users,
    children: [
      { name: 'Contacts', href: '/crm/contacts' },
      { name: 'Leads', href: '/crm/leads' },
      { name: 'Campaigns', href: '/crm/campaigns' },
      { name: 'Follow-Ups', href: '/crm/follow-ups' },
    ],
  },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  {
    name: 'Analytics',
    icon: BarChart3,
    children: [
      { name: 'Sales Reports', href: '/analytics/sales' },
      { name: 'Lead Conversions', href: '/analytics/conversions' },
      { name: 'Inventory Reports', href: '/analytics/inventory' },
      { name: 'Instagram Analytics', href: '/analytics/instagram', icon: Instagram },
    ],
  },
  { name: 'Chatbot Config', href: '/chatbot', icon: MessageSquare },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'General', href: '/settings' },
      { name: 'Instagram', href: '/settings/instagram', icon: Instagram },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BizNavigate</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden rounded-md p-1 hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  {item.name}
                </Link>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
                    {item.icon && <item.icon className="h-5 w-5" />}
                    {item.name}
                  </div>
                  {item.children && (
                    <div className="ml-6 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block rounded-md px-3 py-2 text-sm transition-colors',
                            pathname === child.href
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  )
}
