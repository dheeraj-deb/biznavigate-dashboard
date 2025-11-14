'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
