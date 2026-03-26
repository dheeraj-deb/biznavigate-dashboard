'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useNavigation } from '@/hooks/use-navigation'
import { resolveIcon } from '@/lib/icon-resolver'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  LayoutDashboard,
  Package,
  Lock,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { NavGroup } from '@/config/navigation.types'

// Tooltip for collapsed mode
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, sidebarCollapsed, toggleSidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const { quickLinks, groups, businessType } = useNavigation()
  const homeHref = businessType === 'hospitality' ? '/dashboard' : '/'
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  // Auto-collapse sidebar when navigating to any page
  useEffect(() => {
    setSidebarCollapsed(true)
  }, [pathname, setSidebarCollapsed])

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    )
  }

  const isCollapsed = sidebarCollapsed

  // Render a single nav group
  const renderGroup = (item: NavGroup) => {
    const GroupIcon = resolveIcon(item.icon)
    const isExpanded = expandedSections.includes(item.name)
    const isActive = item.href === pathname
    const hasActiveChild = item.children?.some(child => child.href === pathname)

    if (isCollapsed) {
      return (
        <Tooltip key={item.name} label={item.name}>
          {item.href && !item.comingSoon ? (
            <Link
              href={item.href}
              className={cn(
                'flex items-center justify-center rounded-lg p-2.5 transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                  : hasActiveChild
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <GroupIcon className="h-5 w-5 flex-shrink-0" />
            </Link>
          ) : (
            <button
              onMouseEnter={() => {
                setSidebarCollapsed(false)
              }}
              onClick={() => {
                toggleSidebarCollapsed()
                if (!expandedSections.includes(item.name)) {
                  setExpandedSections(prev => [...prev, item.name])
                }
              }}
              className={cn(
                'flex w-full items-center justify-center rounded-lg p-2.5 transition-all duration-200',
                hasActiveChild
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <GroupIcon className="h-5 w-5 flex-shrink-0" />
            </button>
          )}
        </Tooltip>
      )
    }

    return (
      <div key={item.name}>
        {item.href && !item.comingSoon ? (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group',
              isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <GroupIcon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
            {item.comingSoon && (
              <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Soon</span>
            )}
          </Link>
        ) : (
          <>
            <button
              onClick={() => !item.comingSoon && toggleSection(item.name)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group',
                item.comingSoon
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : hasActiveChild
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <GroupIcon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
                {item.comingSoon && (
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Soon</span>
                )}
              </div>
              {!item.comingSoon && (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200" />
                )
              )}
            </button>
            {item.children && isExpanded && !item.comingSoon && (
              <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-800 pl-3">
                {item.children.map((child) => {
                  if (child.comingSoon) {
                    return (
                      <div
                        key={child.href}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      >
                        <span>{child.name}</span>
                        <Lock className="h-3 w-3 ml-auto" />
                      </div>
                    )
                  }
                  return (
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
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
        style={{ boxShadow: '1px 0 2px rgba(0, 0, 0, 0.02)' }}
      >
        {/* Floating Toggle Button for Desktop */}
        <button
          onClick={toggleSidebarCollapsed}
          className="hidden lg:flex absolute -right-3 top-6 z-50 h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100 shadow-sm transition-all focus:outline-none"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        {/* Logo Header */}
        <div className={cn(
          'flex h-16 items-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}>
          {!isCollapsed && (
            <Link href={homeHref} className="flex items-center space-x-3 overflow-hidden">
              <div className="rounded-lg bg-blue-600 p-1.5 flex-shrink-0">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                BizNavigate
              </span>
            </Link>
          )}

          {isCollapsed && (
            <div className="rounded-lg bg-blue-600 p-1.5">
              <Package className="h-5 w-5 text-white" />
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden py-4',
          isCollapsed ? 'px-2 space-y-1' : 'px-3 py-6 space-y-1'
        )}>
          {/* Home Link */}
          {isCollapsed ? (
            <Tooltip label="Home">
              <Link
                href={homeHref}
                className={cn(
                  'flex items-center justify-center rounded-lg p-2.5 transition-all duration-200',
                  pathname === homeHref
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Home className="h-5 w-5 flex-shrink-0" />
              </Link>
            </Tooltip>
          ) : (
            <Link
              href={homeHref}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                pathname === homeHref
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              <span>Home</span>
            </Link>
          )}

          {/* Dashboard Link — hidden for hospitality since Home already goes to /dashboard */}
          {businessType !== 'hospitality' && (
            isCollapsed ? (
              <Tooltip label="Dashboard">
                <Link
                  href="/dashboard"
                  className={cn(
                    'flex items-center justify-center rounded-lg p-2.5 transition-all duration-200',
                    pathname === '/dashboard'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                </Link>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  pathname === '/dashboard'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                <span>Dashboard</span>
              </Link>
            )
          )}

          {/* Separator */}
          <div className="my-3 border-t border-gray-200 dark:border-gray-800" />

          {/* Quick Links Section */}
          {!isCollapsed && (
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Quick Links
            </h3>
          )}

          {quickLinks.map(({ href, label, icon: iconName }) => {
            const Icon = resolveIcon(iconName)
            return isCollapsed ? (
              <Tooltip key={href} label={label}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center justify-center rounded-lg p-2.5 transition-all duration-200',
                    pathname === href
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                </Link>
              </Tooltip>
            ) : (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}

          {/* Separator */}
          <div className="my-3 border-t border-gray-200 dark:border-gray-800" />

          {/* Main Navigation — config-driven */}
          {groups.map(renderGroup)}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex-shrink-0">
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Need Help?</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Check our documentation</p>
              <button className="mt-3 w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                Get Support
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  )
}
