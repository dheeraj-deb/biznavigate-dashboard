'use client'

import { Menu, Moon, Sun, User, LogOut, Search, Bell, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { NotificationDropdown } from './notification-dropdown'
import { Input } from '@/components/ui/input'

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { toggleSidebar, theme, toggleTheme } = useUIStore()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 shadow-sm">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800">
        <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </Button>

      <div className="flex flex-1 items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="hidden md:block max-w-md flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search anything..."
              className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </Button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/settings')}
            className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>

          {/* User Menu */}
          <div className="relative ml-2">
            <div className="group relative">
              <button className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-md">
                  {user ? getInitials(user.name) : 'U'}
                </div>
                <div className="hidden text-left xl:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Role'}</p>
                </div>
              </button>

              <div className="absolute right-0 mt-2 hidden w-56 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg group-hover:block">
                <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'email@example.com'}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => router.push('/settings/profile')}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
