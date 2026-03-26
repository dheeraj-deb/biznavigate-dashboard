'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardRenderer } from '@/components/dashboard/DashboardRenderer'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardRenderer />
    </DashboardLayout>
  )
}
