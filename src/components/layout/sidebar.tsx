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
  Lock,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { NavGroup } from '@/config/navigation.types'

// Tooltip for collapsed mode
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#1a1a2e] text-white text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg tracking-wide">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1a1a2e]" />
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, sidebarCollapsed, toggleSidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const { groups, businessType } = useNavigation()
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
  const [logoError, setLogoError] = useState(false)

  // Render a single nav group
  const renderGroup = (item: NavGroup) => {
    const GroupIcon = resolveIcon(item.icon)
    const isExpanded = expandedSections.includes(item.name)
    const isActive = item.href === pathname
    const hasActiveChild = item.children?.some(child => child.href === pathname)
    const groupLabel = item.displayName?.[businessType] ?? item.name

    if (isCollapsed) {
      return (
        <Tooltip key={item.name} label={groupLabel}>
          {item.href && !item.comingSoon ? (
            <Link
              href={item.href}
              className={cn(
                'flex items-center justify-center rounded-xl p-2.5 transition-all duration-200',
                isActive || hasActiveChild
                  ? 'bg-[#0066FF]/12 text-[#0066FF]'
                  : 'text-[#4B4B4B] hover:bg-[#0066FF]/8'
              )}
            >
              <GroupIcon className="h-5 w-5 flex-shrink-0" />
            </Link>
          ) : (
            <button
              onMouseEnter={() => setSidebarCollapsed(false)}
              onClick={() => {
                toggleSidebarCollapsed()
                if (!expandedSections.includes(item.name)) {
                  setExpandedSections(prev => [...prev, item.name])
                }
              }}
              className={cn(
                'flex w-full items-center justify-center rounded-xl p-2.5 transition-all duration-200',
                hasActiveChild
                  ? 'bg-[#0066FF]/12 text-[#0066FF]'
                  : 'text-[#4B4B4B] hover:bg-[#0066FF]/8'
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
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors group',
              isActive
                ? 'bg-[#0066FF]/12 text-[#0066FF]'
                : 'text-[#4B4B4B] hover:bg-[#0066FF]/8 hover:text-[#0066FF]'
            )}
          >
            <GroupIcon className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{groupLabel}</span>
            {item.comingSoon && (
              <span className="ml-auto text-[10px] font-bold text-[#989898] bg-[#F5F5F5] px-1.5 py-0.5 rounded-full">Soon</span>
            )}
          </Link>
        ) : (
          <>
            <button
              onClick={() => !item.comingSoon && toggleSection(item.name)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors group',
                item.comingSoon
                  ? 'text-[#989898] cursor-not-allowed'
                  : hasActiveChild
                    ? 'text-[#0066FF]'
                    : 'text-[#4B4B4B] hover:bg-[#0066FF]/8 hover:text-[#0066FF]'
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <GroupIcon className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{groupLabel}</span>
                {item.comingSoon && (
                  <span className="text-[10px] font-bold text-[#989898] bg-[#F5F5F5] px-1.5 py-0.5 rounded-full">Soon</span>
                )}
              </div>
              {!item.comingSoon && (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 text-[#989898]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 text-[#989898]" />
                )
              )}
            </button>
            {item.children && isExpanded && !item.comingSoon && (
              <div className="ml-7 mt-0.5 space-y-0.5 border-l-2 border-[#E5E5E5] pl-3">
                {item.children.map((child) => {
                  const childLabel = child.displayName?.[businessType] ?? child.name
                  if (child.comingSoon) {
                    return (
                      <div
                        key={child.href}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[#989898] cursor-not-allowed"
                      >
                        <span>{childLabel}</span>
                        <Lock className="h-3 w-3 ml-auto opacity-50" />
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'block rounded-lg px-3 py-2 text-[12px] font-medium transition-colors',
                        pathname === child.href
                          ? 'bg-[#0066FF]/10 text-[#0066FF] font-semibold'
                          : 'text-[#6E6E6E] hover:bg-[#0066FF]/6 hover:text-[#4B4B4B]'
                      )}
                    >
                      {childLabel}
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
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E8EEFF] transition-all duration-300 ease-in-out',
          'bg-gradient-to-b from-[#EEF3FF] via-[#F5F8FF] to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 dark:border-gray-800',
          isCollapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
        style={{ boxShadow: '2px 0 16px rgba(0, 102, 255, 0.06)' }}
      >
        {/* Floating Toggle Button for Desktop */}
        <button
          onClick={toggleSidebarCollapsed}
          className="hidden lg:flex absolute -right-3 top-6 z-50 h-5 w-5 items-center justify-center rounded-full border border-[#E5E5E5] bg-white dark:border-gray-800 dark:bg-gray-950 text-[#989898] hover:text-[#0066FF] shadow-sm transition-all focus:outline-none"
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
          'flex h-16 items-center border-b border-[#E8EEFF] dark:border-gray-800 flex-shrink-0',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}>
          {!isCollapsed && (
            <Link href={homeHref} className="flex items-center space-x-2.5 overflow-hidden">
              {logoError ? (
                <div className="rounded-xl bg-[#0066FF] h-8 w-8 flex-shrink-0 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
              ) : (
                <img
                  src="/logo.png"
                  alt="BizNavigo"
                  width={32}
                  height={32}
                  className="rounded-xl flex-shrink-0 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                  onError={() => setLogoError(true)}
                />
              )}
              <span className="text-[17px] font-bold tracking-tight bg-gradient-to-r from-[#0066FF] to-indigo-500 bg-clip-text text-transparent whitespace-nowrap">
                BizNavigo
              </span>
            </Link>
          )}

          {isCollapsed && (
            logoError ? (
              <div className="rounded-xl bg-[#0066FF] h-8 w-8 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">B</span>
              </div>
            ) : (
              <img
                src="/logo.png"
                alt="BizNavigo"
                width={32}
                height={32}
                className="rounded-xl object-contain"
                style={{ mixBlendMode: 'multiply' }}
                onError={() => setLogoError(true)}
              />
            )
          )}

          {/* Mobile close button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden rounded-lg p-1.5 hover:bg-[#0066FF]/8 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-[#6E6E6E]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden py-4',
          isCollapsed ? 'px-2 space-y-1' : 'px-3 py-5 space-y-0.5'
        )}>
          {/* Home Link */}
          {isCollapsed ? (
            <Tooltip label="Home">
              <Link
                href={homeHref}
                className={cn(
                  'flex items-center justify-center rounded-xl p-2.5 transition-all duration-200',
                  pathname === homeHref
                    ? 'bg-[#0066FF]/12 text-[#0066FF]'
                    : 'text-[#4B4B4B] hover:bg-[#0066FF]/8'
                )}
              >
                <Home className="h-5 w-5 flex-shrink-0" />
              </Link>
            </Tooltip>
          ) : (
            <Link
              href={homeHref}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
                pathname === homeHref
                  ? 'bg-[#0066FF]/12 text-[#0066FF]'
                  : 'text-[#4B4B4B] hover:bg-[#0066FF]/8 hover:text-[#0066FF]'
              )}
            >
              <Home className="h-4.5 w-4.5 flex-shrink-0" />
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
                    'flex items-center justify-center rounded-xl p-2.5 transition-all duration-200',
                    pathname === '/dashboard'
                      ? 'bg-[#0066FF]/12 text-[#0066FF]'
                      : 'text-[#4B4B4B] hover:bg-[#0066FF]/8'
                  )}
                >
                  <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                </Link>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
                  pathname === '/dashboard'
                    ? 'bg-[#0066FF]/12 text-[#0066FF]'
                    : 'text-[#4B4B4B] hover:bg-[#0066FF]/8 hover:text-[#0066FF]'
                )}
              >
                <LayoutDashboard className="h-4.5 w-4.5 flex-shrink-0" />
                <span>Dashboard</span>
              </Link>
            )
          )}

          {/* Separator */}
          <div className="my-3 border-t border-[#E8EEFF] dark:border-gray-800" />

          {/* Main Navigation — config-driven */}
          {groups.map(renderGroup)}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-[#E8EEFF] dark:border-gray-800 p-4 flex-shrink-0">
            <div className="rounded-2xl bg-gradient-to-br from-[#0066FF]/10 to-indigo-500/10 border border-[#0066FF]/15 p-4">
              <p className="text-[13px] font-bold text-[#4B4B4B] dark:text-gray-100">Need Help?</p>
              <p className="mt-0.5 text-[12px] text-[#6E6E6E] dark:text-gray-400">Check our documentation</p>
              <button className="mt-3 w-full rounded-full bg-[#0066FF] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#0052CC] transition-colors">
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
