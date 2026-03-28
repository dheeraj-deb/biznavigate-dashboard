'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const profileCompleted = useAuthStore((state) => state.user?.profile_completed)

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Redirect to onboarding if profile is not completed
    // (skip if already on the onboarding page)
    if (!profileCompleted && pathname !== '/onboarding') {
      router.push('/onboarding')
    }
  }, [isAuthenticated, hasHydrated, profileCompleted, pathname, router])

  // Show loading while waiting for hydration or authentication check
  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
