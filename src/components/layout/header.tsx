'use client'

import { Menu, Moon, Sun, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { NotificationDropdown } from './notification-dropdown'
import { DashboardAlert } from '@/types'

// Mock alerts data - you can move this to a global state or API call
const mockAlerts: DashboardAlert[] = [
  {
    id: '1',
    type: 'low_stock',
    severity: 'warning',
    title: 'Low Stock Alert',
    message: '12 products are running low on stock and need reordering',
    actionLabel: 'View Products',
    actionHref: '/inventory?filter=low-stock',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    type: 'unpaid_order',
    severity: 'error',
    title: 'Unpaid Orders',
    message: '5 orders are pending payment for more than 48 hours',
    actionLabel: 'View Orders',
    actionHref: '/orders?status=unpaid',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: '3',
    type: 'new_message',
    severity: 'info',
    title: 'New Messages',
    message: '8 customer inquiries are awaiting response',
    actionLabel: 'View Messages',
    actionHref: '/messages',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '4',
    type: 'high_value_lead',
    severity: 'success',
    title: 'High-Value Lead',
    message: 'New enterprise lead with estimated value of $15,000',
    actionLabel: 'View Lead',
    actionHref: '/leads?filter=high-value',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
]

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { toggleSidebar, theme, toggleTheme } = useUIStore()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center justify-between">
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <NotificationDropdown
            alerts={mockAlerts}
            onDismiss={(alertId) => console.log('Alert dismissed:', alertId)}
          />

          <div className="relative ml-3">
            <div className="group relative">
              <button className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {user ? getInitials(user.name) : 'U'}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || 'Role'}</p>
                </div>
              </button>

              <div className="absolute right-0 mt-2 hidden w-48 rounded-md border bg-popover py-1 shadow-lg group-hover:block">
                <button
                  onClick={() => router.push('/settings/profile')}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
