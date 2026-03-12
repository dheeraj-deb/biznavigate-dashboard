'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { FlowForm } from '../_components/flow-form'

export default function NewFlowPage() {
  const router = useRouter()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings/whatsapp-flows')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Flow</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Design a WhatsApp Flow — submit to Meta, then publish to make it live
            </p>
          </div>
        </div>
        <FlowForm mode="create" />
      </div>
    </DashboardLayout>
  )
}
