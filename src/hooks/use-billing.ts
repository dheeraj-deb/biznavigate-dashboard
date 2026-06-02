import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Plan {
  plan_id: string
  name: string
  business_type: string
  tier: string
  amount: number                           // paise
  interval: 'monthly' | 'yearly'
  initial_credits: number                  // WhatsApp credits in paise
  features: Record<string, number | boolean | string>
}

export interface Subscription {
  subscription_id: string
  status: 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired' | 'trialing'
  plan: string                             // plan name or tier
  current_period_end: string
  cancel_at_period_end: boolean
}

export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number                           // paise
  description: string
  balance_after: number                    // paise
  created_at: string
}

export interface Wallet {
  balance: number                          // paise
  currency: string
  transactions: WalletTransaction[]
}

export interface CreditPricing {
  action_type: string
  cost: number                             // paise per unit
  description: string
}

export interface Invoice {
  invoice_id: string
  total_amount: number                     // paise
  subtotal: number                         // paise
  tax_amount: number                       // paise
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  paid_at: string | null
  created_at: string
}

export interface TopupResponse {
  order_id: string
  amount: number
  currency: string
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatPaise(paise: number) {
  return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
}

// ── Internal ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: any) {
  return (res as any).data?.data ?? (res as any).data
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useSubscription() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const res = await apiClient.get('/billing/subscription')
      return unwrap(res) as Subscription
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
  })
}

export function useBillingPlans(businessType?: string) {
  return useQuery({
    queryKey: ['billing', 'plans', businessType ?? 'all'],
    queryFn: async () => {
      const params = businessType ? { business_type: businessType } : undefined
      const res = await apiClient.get('/billing/plans', params ? { params } : undefined)
      const raw = unwrap(res)
      return (Array.isArray(raw) ? raw : raw?.plans ?? []) as Plan[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useWallet() {
  return useQuery({
    queryKey: ['billing', 'wallet'],
    queryFn: async () => {
      const res = await apiClient.get('/billing/wallet')
      return unwrap(res) as Wallet
    },
    staleTime: 30 * 1000,
  })
}

export function useWalletTransactions(page = 1, limit = 30) {
  return useQuery({
    queryKey: ['billing', 'wallet', 'transactions', page],
    queryFn: async () => {
      const res = await apiClient.get('/billing/wallet/transactions', { params: { page, limit } })
      const raw = unwrap(res)
      return {
        data: (Array.isArray(raw) ? raw : raw?.data ?? []) as WalletTransaction[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        meta: (raw as any)?.meta ?? {},
      }
    },
  })
}

export function useCreditPricing() {
  return useQuery({
    queryKey: ['billing', 'credit-pricing'],
    queryFn: async () => {
      const res = await apiClient.get('/billing/credit-pricing')
      const raw = unwrap(res)
      return (Array.isArray(raw) ? raw : raw?.pricing ?? []) as CreditPricing[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useInvoices(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['billing', 'invoices', page],
    queryFn: async () => {
      const res = await apiClient.get('/billing/invoices', { params: { page, limit } })
      const raw = unwrap(res)
      return {
        data: (Array.isArray(raw) ? raw : raw?.data ?? []) as Invoice[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        meta: (raw as any)?.meta ?? {},
      }
    },
  })
}

export function useSubscribe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (plan_id: string) => {
      const res = await apiClient.post('/billing/subscription', { plan_id })
      return unwrap(res) as { checkout_url: string }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'subscription'] })
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message || 'Failed to start checkout')
    },
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete('/billing/subscription')
      return unwrap(res)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'subscription'] })
      toast.success('Subscription cancelled')
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message || 'Failed to cancel subscription')
    },
  })
}

export function usePauseSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pause_start, pause_end }: { pause_start: string; pause_end: string }) => {
      const res = await apiClient.patch('/billing/subscription/pause', { pause_start, pause_end })
      return unwrap(res)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'subscription'] })
      toast.success('Subscription paused')
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message || 'Failed to pause subscription')
    },
  })
}

export function useResumeSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch('/billing/subscription/resume')
      return unwrap(res)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'subscription'] })
      toast.success('Subscription resumed')
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message || 'Failed to resume subscription')
    },
  })
}

export function useWalletTopup() {
  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiClient.post('/billing/wallet/topup', { amount })
      return unwrap(res) as TopupResponse
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message || 'Failed to initiate recharge')
    },
  })
}
