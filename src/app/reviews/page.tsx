'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Star, Clock } from 'lucide-react'

export default function ReviewsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Star className="h-8 w-8 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          Coming soon — being rebuilt with the new catalog system
        </div>
        <p className="text-sm text-gray-400 max-w-sm">
          Review management is currently under reconstruction. It will be available in the next release.
        </p>
      </div>
    </DashboardLayout>
  )
}
