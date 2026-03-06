'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sparkles,
  PenLine,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useInitiateWorkflow } from '@/hooks/use-workflows'

interface CreateWorkflowDialogProps {
  open: boolean
  onClose: () => void
}

type Step = 'details' | 'method' | 'ai-prompt'

export function CreateWorkflowDialog({ open, onClose }: CreateWorkflowDialogProps) {
  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const router = useRouter()

  const { user } = useAuthStore()
  const { mutateAsync: initiateWorkflow, isPending } = useInitiateWorkflow()

  const handleClose = () => {
    setStep('details')
    setName('')
    setDescription('')
    setPrompt('')
    onClose()
  }

  const handleManualCreate = async () => {
    const result = await initiateWorkflow({
      workflow_name: name,
      business_id: user?.business_id ?? '',
      description: description || undefined,
    })
    router.push(`/automations/builder/${result.workflow_id}`)
    handleClose()
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    const result = await initiateWorkflow({
      workflow_name: name,
      business_id: user?.business_id ?? '',
      description: description || undefined,
    })
    const query = new URLSearchParams({ prompt })
    router.push(`/automations/builder/${result.workflow_id}?${query.toString()}`)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {step === 'details' && 'Create New Automation'}
            {step === 'method' && 'How do you want to build?'}
            {step === 'ai-prompt' && 'Describe your automation'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Name & Description */}
        {step === 'details' && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="workflow-name">Workflow Name <span className="text-red-500">*</span></Label>
              <Input
                id="workflow-name"
                placeholder="e.g. Lead Follow-up, Order Confirmation..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep('method')}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workflow-description">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="workflow-description"
                placeholder="Briefly describe what this workflow does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep('method')} disabled={!name.trim()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Choose method */}
        {step === 'method' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose how you want to create{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{name}</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Manual */}
              <button
                onClick={handleManualCreate}
                disabled={isPending}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                  {isPending ? (
                    <Loader2 className="h-6 w-6 text-gray-600 dark:text-gray-400 animate-spin" />
                  ) : (
                    <PenLine className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Build Manually</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Drag and drop nodes to design your workflow</p>
                </div>
              </button>

              {/* AI */}
              <button
                onClick={() => setStep('ai-prompt')}
                disabled={isPending}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900 transition-colors">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Generate with AI</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Describe in plain English and let AI build it</p>
                </div>
              </button>
            </div>

            <div className="flex justify-start pt-1">
              <Button variant="ghost" size="sm" onClick={() => setStep('details')} disabled={isPending}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: AI Prompt */}
        {step === 'ai-prompt' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Describe what{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{name}</span>{' '}
              should do
            </p>
            <div className="space-y-1.5">
              <Textarea
                placeholder="e.g. When a new lead comes in from WhatsApp, send them a greeting message, wait 1 hour, then if they haven't replied assign to the sales team..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="resize-none"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Be specific about triggers, actions, conditions, and timing
              </p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={() => setStep('method')} disabled={isPending}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Workflow
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
