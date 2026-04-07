import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Plan {
  id: string          // 'trial' | 'starter' | 'pro' | 'business'
  name: string
  price_monthly: number
  currency: string
  features: string[]
  limits: {
    whatsapp_numbers: number
    leads: number | null   // null = unlimited
    ai_features: boolean
    multi_location: boolean
    priority_support: boolean
  }
}

export interface Subscription {
  id: string
  plan_id: string
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  trial_end: string | null
  razorpay_subscription_id: string | null
}

export interface Invoice {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  created_at: string
  invoice_pdf: string | null
  period_start: string
  period_end: string
}

export interface CreateSubscriptionResponse {
  subscription_id: string   // Razorpay subscription ID
  key_id: string            // Razorpay publishable key
}

// ── Current subscription status ───────────────────────────────────────────────

export function useSubscription() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const { data } = await apiClient.get<Subscription>('/billing/subscription')
      return data
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
  })
}

// ── Available plans ───────────────────────────────────────────────────────────

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const { data } = await apiClient.get<Plan[]>('/billing/plans')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ── Create Razorpay subscription (returns subscription_id + key_id) ───────────

export function useCreateSubscription() {
  return useMutation({
    mutationFn: async (plan_id: string) => {
      const { data } = await apiClient.post<CreateSubscriptionResponse>('/billing/subscription/create', { plan_id })
      return data
    },
  })
}

// ── Verify payment after Razorpay checkout ────────────────────────────────────

export function useVerifySubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      razorpay_payment_id: string
      razorpay_subscription_id: string
      razorpay_signature: string
    }) => {
      const { data } = await apiClient.post('/billing/subscription/verify', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] })
    },
  })
}

// ── Cancel at period end ──────────────────────────────────────────────────────

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/billing/subscription/cancel')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] })
    },
  })
}

// ── Invoice history ───────────────────────────────────────────────────────────

export function useInvoices() {
  return useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: async () => {
      const { data } = await apiClient.get<Invoice[]>('/billing/invoices')
      return data
    },
  })
}
