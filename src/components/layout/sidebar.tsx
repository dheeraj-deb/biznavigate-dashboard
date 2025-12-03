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
  CreditCard,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Inbox,
  Star,
  Globe,
  Brain,
  Zap,
  Activity,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'CRM',
    icon: Users,
    children: [
      { name: 'Leads', href: '/crm/leads' },
      { name: 'Social Inbox', href: '/crm/inbox', icon: Inbox },
      { name: 'Follow-Ups', href: '/crm/follow-ups' },
      { name: 'Contacts', href: '/crm/contacts' },
    ],
  },
  { name: 'Campaigns', href: '/crm/campaigns', icon: TrendingUp },
  {
    name: 'Sales & Orders',
    icon: ShoppingCart,
    children: [
      { name: 'Customers', href: '/customers' },
      { name: 'Orders', href: '/orders' },
      { name: 'Payments', href: '/payments' },
      { name: 'Reviews', href: '/reviews', icon: Star },
    ],
  },
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
    name: 'Analytics',
    icon: BarChart3,
    children: [
      { name: 'Overview', href: '/analytics/overview' },
      { name: 'AI Forecasting', href: '/analytics/forecasting', icon: Brain },
      { name: 'Lead Conversions', href: '/analytics/conversions' },
      { name: 'Sales Reports', href: '/analytics/sales' },
      { name: 'Inventory Reports', href: '/analytics/inventory' },
      { name: 'Social Media', href: '/analytics/social-media', icon: Instagram },
    ],
  },
  {
    name: 'AI Optimization',
    icon: Zap,
    children: [
      { name: 'Campaign Optimizer', href: '/campaigns/optimizer', icon: Zap },
      { name: 'Live Monitor', href: '/campaigns/live', icon: Activity },
    ],
  },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'General', href: '/settings' },
      { name: 'Business Profile', href: '/settings/business' },
      { name: 'WhatsApp', href: '/settings/whatsapp', icon: MessageSquare },
      { name: 'Instagram', href: '/settings/instagram', icon: Instagram },
      { name: 'Mini Website', href: '/settings/website', icon: Globe },
      { name: 'Roles & Permissions', href: '/settings/roles' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [expandedSections, setExpandedSections] = useState<string[]>(['Lead Generation', 'CRM', 'Sales & Orders', 'Inventory', 'Analytics', 'AI Optimization', 'Settings'])

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    )
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white dark:bg-gray-950 transition-transform duration-300 ease-in-out shadow-sm',
          'lg:translate-x-0',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
      >
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-600 p-1.5">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BizNavigate</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {navigation.map((item) => {
            const isExpanded = expandedSections.includes(item.name)
            const isActive = item.href === pathname
            const hasActiveChild = item.children?.some(child => child.href === pathname)

            return (
              <div key={item.name}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                    <span>{item.name}</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        hasActiveChild
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                        <span>{item.name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>
                    {item.children && isExpanded && (
                      <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-800 pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block rounded-md px-3 py-2 text-sm transition-colors',
                              pathname === child.href
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
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
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Need Help?</p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Check our documentation</p>
            <button className="mt-3 w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
              Get Support
            </button>
          </div>
        </div>
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
