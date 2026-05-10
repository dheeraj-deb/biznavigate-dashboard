'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react'
import { useInvoices, formatPaise, type Invoice } from '@/hooks/use-billing'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLE: Record<string, string> = {
  paid:           'bg-green-100 text-green-700 border-green-200',
  open:           'bg-amber-100 text-amber-700 border-amber-200',
  void:           'bg-gray-100 text-gray-500 border-gray-200',
  uncollectible:  'bg-red-100 text-red-600 border-red-200',
}

// ── Invoice Row ───────────────────────────────────────────────────────────────

function InvoiceRow({ inv }: { inv: Invoice }) {
  const tax = inv.tax_amount ?? 0
  const subtotal = inv.subtotal ?? (inv.total_amount - tax)

  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(inv.created_at)}</td>
      <td className="px-4 py-3 text-sm font-mono text-gray-400 text-xs">{inv.invoice_id}</td>
      <td className="px-4 py-3 text-right">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatPaise(inv.total_amount)}</div>
        {tax > 0 && (
          <div className="text-[10px] text-gray-400 mt-0.5">
            {formatPaise(subtotal)} + {formatPaise(tax)} GST
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[inv.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 text-right">{formatDate(inv.paid_at)}</td>
    </tr>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useInvoices(page, 20)

  const invoices = data?.data ?? []
  const meta = data?.meta as { total?: number; totalPages?: number } ?? {}
  const totalPages = meta.totalPages ?? 1

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-10">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/billing">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-sm text-gray-400">Subscription payment history with GST breakdown</p>
          </div>
        </div>

        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No invoices yet</p>
              <p className="text-xs text-gray-400 mt-1">Your billing history will appear here after your first payment.</p>
              <Link href="/billing" className="mt-3">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />View Plans
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Invoice ID</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Paid On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => <InvoiceRow key={inv.invoice_id} inv={inv} />)}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* GST note */}
        <p className="text-xs text-gray-400 text-center">
          All amounts include GST. BizNavigate · GSTIN: 29XXXXX1234X1ZX
        </p>
      </div>
    </DashboardLayout>
  )
}
