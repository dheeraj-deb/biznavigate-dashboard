'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        {/* Main area shifts based on whether sidebar is collapsed (w-16) or expanded (w-64) */}
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          )}
        >
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
