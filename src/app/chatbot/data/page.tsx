'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
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
  id?: string
  collection?: string
  text: string
  metadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

type KnowledgeDocumentsResponse = {
  documents: KnowledgeDocument[]
}

const ACCEPTED_FILE_TYPES = ['.txt', '.md', '.csv', '.json']

function newFaqRow(): FaqRow {
  return {
    id: crypto.randomUUID(),
    question: '',
    answer: '',
  }
}

function createFaqRow(question: string, answer: string): FaqRow | null {
  const cleanQuestion = question
    .replace(/^\s*(?:[-*]\s*)?(?:\d+[\).\-\s]*)?/, '')
    .replace(/^q(uestion)?\s*[:\-]\s*/i, '')
    .trim()
  const cleanAnswer = answer
    .replace(/^a(nswer)?\s*[:\-]\s*/i, '')
    .trim()

  if (!cleanQuestion || !cleanAnswer) return null

  return {
    id: crypto.randomUUID(),
    question: cleanQuestion,
    answer: cleanAnswer,
  }
}

function uniqueFaqRows(rows: Array<FaqRow | null>): FaqRow[] {
  const seen = new Set<string>()
  const result: FaqRow[] = []

  for (const row of rows) {
    if (!row) continue
    const key = row.question.toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(row)
  }

  return result
}

function parseDelimitedLine(line: string, delimiter: ',' | '\t'): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function parseJsonFaqs(value: string): FaqRow[] {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return uniqueFaqRows(parsed.map((item) => {
      if (!item || typeof item !== 'object') return null
      const question = String(item.question ?? item.q ?? item.prompt ?? '').trim()
      const answer = String(item.answer ?? item.a ?? item.response ?? '').trim()
      return createFaqRow(question, answer)
    }))
  } catch {
    return []
  }
}

function parseDelimitedFaqs(value: string): FaqRow[] {
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const header = parseDelimitedLine(lines[0], delimiter).map((item) => item.toLowerCase())
  const questionIndex = header.findIndex((item) => ['question', 'q', 'prompt'].includes(item))
  const answerIndex = header.findIndex((item) => ['answer', 'a', 'response'].includes(item))

  if (questionIndex < 0 || answerIndex < 0) return []

  return uniqueFaqRows(lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter)
    return createFaqRow(values[questionIndex] ?? '', values[answerIndex] ?? '')
  }))
}

function parseMarkedFaqs(value: string): FaqRow[] {
  const normalized = value.replace(/\r\n/g, '\n').trim()
  const pattern = /(?:^|\n)\s*(?:[-*]\s*)?(?:\d+[\).\-\s]*)?(?:q(?:uestion)?|faq)\s*[:\-]\s*([\s\S]*?)(?:\n\s*|[ \t]+)(?:a(?:nswer)?|ans)\s*[:\-]\s*([\s\S]*?)(?=\n\s*(?:[-*]\s*)?(?:\d+[\).\-\s]*)?(?:q(?:uestion)?|faq)\s*[:\-]|$)/gi
  const rows: FaqRow[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(normalized)) !== null) {
    const row = createFaqRow(match[1], match[2])
    if (row) rows.push(row)
  }

  return uniqueFaqRows(rows)
}

function parseBlockFaqs(value: string): FaqRow[] {
  return uniqueFaqRows(value
    .split(/\n\s*\n/g)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
      if (lines.length < 2) return null

      const answerIndex = lines.findIndex((line) => /^a(nswer)?\s*[:\-]/i.test(line))
      if (answerIndex > 0) {
        const question = lines.slice(0, answerIndex).join(' ')
        const answer = lines.slice(answerIndex).join('\n')
        return createFaqRow(question, answer)
      }

      return createFaqRow(lines[0], lines.slice(1).join('\n'))
    }))
}

function parseQuestionLineFaqs(value: string): FaqRow[] {
  return uniqueFaqRows(value
    .split('\n')
    .map((line) => {
      const match = line.trim().match(/^(.*?)\?\s*(?:-|--|:|–|—)\s*(.+)$/)
      if (!match) return null
      return createFaqRow(`${match[1]}?`, match[2])
    }))
}

function parseBulkFaqs(value: string): FaqRow[] {
  const normalized = value.trim()
  if (!normalized) return []

  return uniqueFaqRows([
    ...parseJsonFaqs(normalized),
    ...parseDelimitedFaqs(normalized),
    ...parseMarkedFaqs(normalized),
    ...parseBlockFaqs(normalized),
    ...parseQuestionLineFaqs(normalized),
  ])
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

function parseFaqDocument(doc: KnowledgeDocument): FaqRow | null {
  if (doc.metadata?.type !== 'faq') return null

  const question = typeof doc.metadata.question === 'string'
    ? doc.metadata.question
    : (doc.text.match(/^Question:\s*(.+)$/im)?.[1] ?? '').trim()

  const answer = doc.text
    .replace(/^Question:\s*.+$/im, '')
    .replace(/^Answer:\s*/im, '')
    .trim()

  if (!question || !answer) return null

  return {
    id: doc.id ?? crypto.randomUUID(),
    question,
    answer,
  }
}

export default function ChatbotKnowledgePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [faqs, setFaqs] = useState<FaqRow[]>([newFaqRow()])
  const [businessInfo, setBusinessInfo] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const validFaqs = useMemo(
    () => faqs.filter((row) => row.question.trim() && row.answer.trim()),
    [faqs],
  )

  const totalDocuments = validFaqs.length + documents.length + (businessInfo.trim() ? 1 : 0)

  const loadKnowledge = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<KnowledgeDocumentsResponse>('/rag/documents', {
        params: { collection: 'docs' },
      })
      const savedDocuments = response.data?.documents ?? []
      const savedFaqs = savedDocuments.map(parseFaqDocument).filter(Boolean) as FaqRow[]
      const savedBusinessInfo = savedDocuments
        .filter((doc) => doc.metadata?.type === 'business_profile')
        .map((doc) => doc.text.trim())
        .filter(Boolean)
        .join('\n\n')
      const savedFiles = savedDocuments.filter((doc) => !['faq', 'business_profile'].includes(String(doc.metadata?.type)))

      setFaqs(savedFaqs.length ? [...savedFaqs, newFaqRow()] : [newFaqRow()])
      setBusinessInfo(savedBusinessInfo)
      setDocuments(savedFiles)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load existing knowledge')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadKnowledge()
  }, [])

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
      ...(businessInfo.trim()
        ? [{
            text: businessInfo.trim(),
            metadata: {
              type: 'business_profile',
              source: 'manual',
              title: 'Business knowledge',
            },
          }]
        : []),
      ...validFaqs.map(formatFaqDocument),
      ...documents,
    ]

    if (!payloadDocuments.length) {
      toast.error('Add at least one FAQ or file before saving')
      return
    }

    setIsSaving(true)
    try {
      const response = await apiClient.put<{ replaced: number }>('/rag/documents', {
        collection: 'docs',
        documents: payloadDocuments,
      })
      const ingested = response.data?.replaced ?? payloadDocuments.length
      setFaqs((current) => [...current.filter((row) => row.question.trim() || row.answer.trim()), newFaqRow()])
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
      setBusinessInfo('')
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
            <Button variant="outline" onClick={loadKnowledge} disabled={isLoading || isSaving || isClearing}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button variant="outline" onClick={clearKnowledge} disabled={isClearing}>
              {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
            The agent uses this content for business knowledge answers. Add check-in/out times, cancellation policy, address, amenities, pricing notes, documents required, delivery rules, and common service questions.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                <CardTitle>Business Knowledge</CardTitle>
              </div>
              <CardDescription>Add general business data plus exact FAQ answers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {isLoading && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading saved FAQs
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="business-info">Business facts, policies, and details</Label>
                <Textarea
                  id="business-info"
                  value={businessInfo}
                  onChange={(event) => setBusinessInfo(event.target.value)}
                  placeholder="Add amenities, address, directions, check-in/out times, cancellation policy, payment rules, facilities, pricing notes, services, documents required, and anything the AI should know."
                  rows={8}
                />
              </div>

              <div className="border-t pt-5">
                <div className="mb-4">
                  <p className="font-medium">Manual FAQs</p>
                  <p className="text-sm text-muted-foreground">Use these for exact answers to common customer questions.</p>
                </div>
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
              </div>
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
                    <p className="text-2xl font-bold">{validFaqs.length + (businessInfo.trim() ? 1 : 0)}</p>
                    <p className="text-sm text-muted-foreground">Typed Items</p>
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
