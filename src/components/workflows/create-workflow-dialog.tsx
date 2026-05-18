'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useInitiateWorkflow } from '@/hooks/use-workflows'

interface CreateWorkflowDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Minimal "new automation" dialog. Asks for a name (or accepts a blank one) and
 * routes to the step-by-step wizard at /automations/builder/{id}. The wizard
 * handles trigger, steps, branches, and activation — this dialog used to do all
 * of that itself, which has been retired.
 */
export function CreateWorkflowDialog({ open, onClose }: CreateWorkflowDialogProps) {
  const [name, setName] = useState('')
  const router = useRouter()
  const { user } = useAuthStore()
  const { mutateAsync: initiateWorkflow, isPending } = useInitiateWorkflow()

  const handleClose = () => {
    setName('')
    onClose()
  }

  const handleCreate = async () => {
    const result = await initiateWorkflow({
      workflow_name: name.trim() || 'New automation',
      business_id: user?.business_id ?? '',
    })
    if (result?.workflow_id) {
      router.push(`/automations/builder/${result.workflow_id}`)
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New automation</DialogTitle>
          <DialogDescription>
            We&rsquo;ll take you through a quick setup. You can pick a template inside.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="new-wf-name" className="text-sm font-medium">
              Automation name
            </Label>
            <Input
              id="new-wf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome new customers"
              className="mt-1.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isPending) handleCreate()
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional — you can change this in the wizard.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-1.5 h-4 w-4" />
              )}
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
