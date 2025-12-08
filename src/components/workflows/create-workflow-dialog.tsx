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
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Lightbulb, ArrowRight, Loader2 } from 'lucide-react'

interface CreateWorkflowDialogProps {
  open: boolean
  onClose: () => void
}

const examples = [
  'When a new lead comes from Instagram, send them a WhatsApp message with our product catalog, wait 2 hours, then if they don\'t reply, assign to sales team and create a follow-up task for tomorrow',
  'Send a review request WhatsApp message 3 days after order delivery. If they reply with 5 stars, tag them as "happy customer", otherwise create a support ticket',
  'Every day at 10 AM, find customers who haven\'t ordered in 60 days and send them a 20% discount code on WhatsApp',
  'When a lead status changes to "converted", send a thank you WhatsApp message and add them to the "Premium Customers" segment',
  'When someone sends a WhatsApp message for the first time, create a new lead, send auto-reply, and schedule a follow-up for the next business day',
]

export function CreateWorkflowDialog({ open, onClose }: CreateWorkflowDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)

    // Simulate AI generation (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock: Navigate to builder with generated workflow
    const workflowId = `new-${Date.now()}`
    router.push(`/automations/builder/${workflowId}?prompt=${encodeURIComponent(prompt)}`)

    setIsGenerating(false)
    onClose()
  }

  const handleExampleClick = (example: string) => {
    setPrompt(example)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Create New Automation
          </DialogTitle>
          <DialogDescription className="text-base">
            Describe what you want to automate in plain English, and AI will build the workflow for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Area */}
          <div className="space-y-2">
            <label
              htmlFor="workflow-prompt"
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Describe your automation
            </label>
            <Textarea
              id="workflow-prompt"
              placeholder="Example: When a new lead comes from Instagram, send them a WhatsApp message with our product catalog..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Be specific about triggers, actions, conditions, and timing
            </p>
          </div>

          {/* Examples Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              Examples to get you started
            </div>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors group"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {example}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Tips for best results:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Start with the trigger (when something happens)</li>
              <li>• Describe the actions to take</li>
              <li>• Include conditions (if/then) if needed</li>
              <li>• Mention timing for delays or schedules</li>
              <li>• Be specific about WhatsApp messages, tags, assignments, etc.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Workflow...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Workflow
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
