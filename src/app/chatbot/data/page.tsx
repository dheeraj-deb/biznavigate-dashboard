'use client'

import { ChangeEvent, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Database,
  FileUp,
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api-client'

type FaqRow = {
  id: string
  question: string
  answer: string
}

type KnowledgeDocument = {
  text: string
  metadata?: Record<string, unknown>
}

const ACCEPTED_FILE_TYPES = ['.txt', '.md', '.csv', '.json']

function newFaqRow(): FaqRow {
  return {
    id: crypto.randomUUID(),
    question: '',
    answer: '',
  }
}

function parseBulkFaqs(value: string): FaqRow[] {
  return value
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
      const questionLine = lines.find((line) => /^q(uestion)?:/i.test(line))
      const answerLine = lines.find((line) => /^a(nswer)?:/i.test(line))

      if (questionLine && answerLine) {
        return {
          id: crypto.randomUUID(),
          question: questionLine.replace(/^q(uestion)?:/i, '').trim(),
          answer: answerLine.replace(/^a(nswer)?:/i, '').trim(),
        }
      }

      return {
        id: crypto.randomUUID(),
        question: lines[0] ?? '',
        answer: lines.slice(1).join('\n'),
      }
    })
    .filter((item) => item.question && item.answer)
}

function formatFaqDocument(row: FaqRow): KnowledgeDocument {
  return {
    text: `Question: ${row.question.trim()}\nAnswer: ${row.answer.trim()}`,
    metadata: {
      type: 'faq',
      source: 'manual',
      question: row.question.trim(),
    },
  }
}

export default function ChatbotKnowledgePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [faqs, setFaqs] = useState<FaqRow[]>([newFaqRow()])
  const [bulkText, setBulkText] = useState('')
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const validFaqs = useMemo(
    () => faqs.filter((row) => row.question.trim() && row.answer.trim()),
    [faqs],
  )

  const totalDocuments = validFaqs.length + documents.length

  const updateFaq = (id: string, patch: Partial<FaqRow>) => {
    setFaqs((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeFaq = (id: string) => {
    setFaqs((current) => current.length === 1 ? [newFaqRow()] : current.filter((row) => row.id !== id))
  }

  const addBulkFaqs = () => {
    const parsed = parseBulkFaqs(bulkText)
    if (!parsed.length) {
      toast.error('Could not find any complete Q/A pairs')
      return
    }
    setFaqs((current) => [...current.filter((row) => row.question || row.answer), ...parsed, newFaqRow()])
    setBulkText('')
    toast.success(`Added ${parsed.length} FAQ${parsed.length === 1 ? '' : 's'}`)
  }

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const parsedDocuments: KnowledgeDocument[] = []

    for (const file of files) {
      const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
      if (!ACCEPTED_FILE_TYPES.includes(extension)) {
        toast.error(`${file.name} is not supported yet`)
        continue
      }

      const text = await file.text()
      if (!text.trim()) continue

      parsedDocuments.push({
        text: text.trim(),
        metadata: {
          type: 'uploaded_file',
          source: 'file_upload',
          file_name: file.name,
          file_type: extension.slice(1),
        },
      })
    }

    if (parsedDocuments.length) {
      setDocuments((current) => [...current, ...parsedDocuments])
      toast.success(`Added ${parsedDocuments.length} file${parsedDocuments.length === 1 ? '' : 's'}`)
    }

    event.target.value = ''
  }

  const saveKnowledge = async () => {
    const payloadDocuments = [
      ...validFaqs.map(formatFaqDocument),
      ...documents,
    ]

    if (!payloadDocuments.length) {
      toast.error('Add at least one FAQ or file before saving')
      return
    }

    setIsSaving(true)
    try {
      const response = await apiClient.post<{ ingested: number }>('/rag/ingest', {
        collection: 'docs',
        documents: payloadDocuments,
      })
      const ingested = response.data?.ingested ?? payloadDocuments.length
      toast.success(`Saved ${ingested} knowledge item${ingested === 1 ? '' : 's'}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save knowledge base')
    } finally {
      setIsSaving(false)
    }
  }

  const clearKnowledge = async () => {
    setIsClearing(true)
    try {
      await apiClient.delete('/rag/documents?collection=docs')
      setFaqs([newFaqRow()])
      setDocuments([])
      setBulkText('')
      toast.success('Knowledge base cleared')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear knowledge base')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bot Business Data</h1>
            <p className="text-muted-foreground">
              Add FAQs, policies, and business details the WhatsApp AI can answer from.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearKnowledge} disabled={isClearing}>
              {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Clear
            </Button>
            <Button onClick={saveKnowledge} disabled={isSaving || totalDocuments === 0}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Knowledge
            </Button>
          </div>
        </div>

        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            The agent uses this content for FAQ answers. Add check-in/out times, cancellation policy, address, amenities, pricing notes, documents required, delivery rules, and common service questions.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                <CardTitle>Manual FAQs</CardTitle>
              </div>
              <CardDescription>Type customer questions and exact answers the AI should know.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {faqs.map((row, index) => (
                <div key={row.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">FAQ {index + 1}</p>
                    <Button variant="ghost" size="sm" onClick={() => removeFaq(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${row.id}`}>Question</Label>
                      <Input
                        id={`question-${row.id}`}
                        value={row.question}
                        onChange={(event) => updateFaq(row.id, { question: event.target.value })}
                        placeholder="What is your check-in time?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`answer-${row.id}`}>Answer</Label>
                      <Textarea
                        id={`answer-${row.id}`}
                        value={row.answer}
                        onChange={(event) => updateFaq(row.id, { answer: event.target.value })}
                        placeholder="Check-in starts at 2 PM and check-out is at 11 AM."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => setFaqs((current) => [...current, newFaqRow()])}>
                <Plus className="mr-2 h-4 w-4" />
                Add FAQ
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5" />
                  <CardTitle>Upload Files</CardTitle>
                </div>
                <CardDescription>Import text knowledge from supported files.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES.join(',')}
                  className="hidden"
                  onChange={handleFiles}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 text-center transition-colors hover:bg-muted/50"
                >
                  <FileUp className="mb-3 h-8 w-8 text-muted-foreground" />
                  <span className="font-medium">Upload FAQ or policy files</span>
                  <span className="mt-1 text-sm text-muted-foreground">TXT, MD, CSV, JSON</span>
                </button>

                {documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Queued files</p>
                    {documents.map((doc, index) => (
                      <div key={`${doc.metadata?.file_name ?? 'doc'}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span className="truncate">{String(doc.metadata?.file_name ?? `Document ${index + 1}`)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  <CardTitle>Bulk Paste</CardTitle>
                </div>
                <CardDescription>Paste multiple Q/A pairs and add them at once.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  rows={8}
                  placeholder={`Q: What is your cancellation policy?\nA: Free cancellation is available up to 24 hours before check-in.\n\nQ: Do you have parking?\nA: Yes, free parking is available for guests.`}
                />
                <Button variant="outline" onClick={addBulkFaqs} disabled={!bulkText.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pasted FAQs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ready to Save</CardTitle>
                <CardDescription>Items queued for AI knowledge ingestion.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg border p-4">
                    <p className="text-2xl font-bold">{validFaqs.length}</p>
                    <p className="text-sm text-muted-foreground">FAQs</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-2xl font-bold">{documents.length}</p>
                    <p className="text-sm text-muted-foreground">Files</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
