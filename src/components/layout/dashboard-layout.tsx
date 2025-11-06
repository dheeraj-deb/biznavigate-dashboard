'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
