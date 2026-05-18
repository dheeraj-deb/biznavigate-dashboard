'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CanvasBuilder } from '@/components/workflows/canvas-builder'
import { WizardShell } from '@/components/workflows/wizard/wizard-shell'

export default function WorkflowBuilderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const workflowId = params?.id as string
  const view = searchParams.get('view')

  // Legacy canvas remains accessible via ?view=diagram. Wizard is the default for
  // all new flows; existing users editing pre-wizard workflows still see canvas
  // if their bookmarks contain ?view=diagram.
  if (view === 'diagram') {
    return <CanvasBuilder workflowId={workflowId} />
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6">
        <WizardShell workflowId={workflowId} />
      </div>
    </DashboardLayout>
  )
}
