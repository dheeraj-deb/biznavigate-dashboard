'use client'

import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { FlowForm } from '../../_components/flow-form'
import { useGetFlow } from '@/hooks/use-whatsapp-flows'

export default function EditFlowPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: flow, isLoading } = useGetFlow(id)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/settings/whatsapp-flows/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Flow</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only draft flows can be edited
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : flow ? (
          <FlowForm mode="edit" flow={flow} />
        ) : (
          <p className="text-gray-500">Flow not found.</p>
        )}
      </div>
    </DashboardLayout>
  )
}
