'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  useWallet,
  useWalletTransactions,
  useWalletTopup,
  formatPaise,
  type WalletTransaction,
} from '@/hooks/use-billing'
import toast from 'react-hot-toast'

// ── Razorpay global type ──────────────────────────────────────────────────────
declare global {
  interface Window { Razorpay: any } // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ── Razorpay script loader ────────────────────────────────────────────────────
function useRazorpayScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.Razorpay) { setReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => setReady(true)
    document.body.appendChild(s)
    return () => { try { document.body.removeChild(s) } catch { /* already removed */ } }
  }, [])
  return ready
}

// ── Topup Modal ───────────────────────────────────────────────────────────────

const PRESET_AMOUNTS = [500, 1000, 2000, 5000]

function TopupModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const razorpayReady = useRazorpayScript()
  const qc = useQueryClient()
  const topup = useWalletTopup()
  const [amount, setAmount] = useState(500)
  const [custom, setCustom] = useState('')
  const [paying, setPaying] = useState(false)

  const effectiveAmount = custom ? parseInt(custom) || 0 : amount

  const handleTopup = useCallback(async () => {
    if (effectiveAmount < 100) { toast.error('Minimum recharge is ₹100'); return }
    if (!razorpayReady) { toast.error('Payment gateway not loaded. Please refresh.'); return }

    setPaying(true)
    try {
      const order = await topup.mutateAsync(effectiveAmount)
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'BizNavigate',
        description: 'Wallet Recharge',
        theme: { color: '#0066FF' },
        handler: () => {
          toast.success('Wallet recharged! Balance will update in a moment.')
          qc.invalidateQueries({ queryKey: ['billing', 'wallet'] })
          onClose()
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      })
      rzp.open()
    } catch {
      // error toast handled in hook
    } finally {
      setPaying(false)
    }
  }, [effectiveAmount, razorpayReady, topup, qc, onClose])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recharge Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Preset buttons */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Quick amounts</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustom('') }}
                  className={`py-2 text-sm rounded-lg border font-medium transition-all ${
                    !custom && amount === a
                      ? 'border-[#0066FF] bg-[#0066FF]/5 text-[#0066FF]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ₹{a.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>
          {/* Custom amount */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Or enter custom amount (₹)</p>
            <Input
              type="number"
              min={100}
              placeholder="e.g. 3000"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">You will pay</span>
            <span className="font-bold text-gray-900 dark:text-white text-lg">₹{effectiveAmount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-gray-400 text-center">
            Powered by Razorpay. Amount credited instantly after successful payment.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={paying}>Cancel</Button>
          <Button
            onClick={handleTopup}
            disabled={paying || topup.isPending || effectiveAmount < 100}
            className="bg-[#0066FF] hover:bg-[#0052CC] text-white"
          >
            {paying || topup.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
              : <>Pay ₹{effectiveAmount.toLocaleString('en-IN')}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Transaction Row ───────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === 'credit'
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
      <td className="px-4 py-3">
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
          isCredit ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {isCredit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isCredit ? 'Credit' : 'Debit'}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{tx.description}</td>
      <td className={`px-4 py-3 text-sm font-semibold text-right ${isCredit ? 'text-green-600' : 'text-orange-600'}`}>
        {isCredit ? '+' : '−'}{formatPaise(tx.amount)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatPaise(tx.balance_after)}</td>
      <td className="px-4 py-3 text-xs text-gray-400 text-right">
        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </td>
    </tr>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const [topupOpen, setTopupOpen] = useState(false)
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: wallet, isLoading: walletLoading, refetch } = useWallet()
  const { data: txData, isLoading: txLoading } = useWalletTransactions(page, 30)

  const balance = wallet?.balance ?? 0
  const lowBalance = balance < 10000 // < ₹100
  const transactions = txData?.data ?? wallet?.transactions ?? []
  const meta = txData?.meta as { total?: number; totalPages?: number } ?? {}
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet</h1>
            <p className="text-sm text-gray-400">WhatsApp credit balance &amp; transaction history</p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ['billing', 'wallet', 'transactions'] }) }}>
            <RefreshCw className="h-4 w-4 text-gray-400" />
          </Button>
        </div>

        {/* Low balance alert */}
        {!walletLoading && lowBalance && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-800 dark:text-orange-300 flex-1">
              Your WhatsApp credits are low ({formatPaise(balance)}). Recharge to keep campaigns and flows running.
            </p>
            <Button size="sm" onClick={() => setTopupOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0">
              Recharge
            </Button>
          </div>
        )}

        {/* Balance card */}
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Available Balance</span>
              </div>
              {walletLoading ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="text-gray-400 text-sm">Loading...</span>
                </div>
              ) : (
                <div className="mt-1">
                  <span className={`text-4xl font-extrabold ${lowBalance ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                    {formatPaise(balance)}
                  </span>
                  <span className="ml-2 text-sm text-gray-400">{wallet?.currency ?? 'INR'}</span>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Used for WhatsApp conversations, campaigns, and flows</p>
            </div>
            <Button
              onClick={() => setTopupOpen(true)}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-6 flex-shrink-0"
            >
              Recharge Wallet
            </Button>
          </CardContent>
        </Card>

        {/* Transaction history */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Transaction History</h2>
          <Card>
            {txLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Wallet className="h-8 w-8 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No transactions yet</p>
                <p className="text-xs text-gray-400 mt-1">Recharge your wallet to get started.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Balance After</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
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
        </div>

        {/* Topup modal */}
        <TopupModal open={topupOpen} onClose={() => setTopupOpen(false)} />
      </div>
    </DashboardLayout>
  )
}
