'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Download,
  Loader2,
  XCircle,
  Star,
} from 'lucide-react'
import {
  useSubscription,
  useSubscriptionPlans,
  useCreateSubscription,
  useVerifySubscription,
  useCancelSubscription,
  useInvoices,
  type Plan,
} from '@/hooks/use-billing'
import { toast } from 'sonner'

// ── Razorpay types ─────────────────────────────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatAmount(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function daysRemaining(end: string) {
  const diff = new Date(end).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700 border-green-200',
  trialing: 'bg-blue-100 text-blue-700 border-blue-200',
  past_due: 'bg-red-100 text-red-700 border-red-200',
  cancelled:'bg-gray-100 text-gray-500 border-gray-200',
  paused:   'bg-amber-100 text-amber-700 border-amber-200',
}

const PLAN_COLORS: Record<string, string> = {
  starter:  'border-gray-200',
  pro:      'border-[#0066FF] ring-2 ring-[#0066FF]/20',
  business: 'border-purple-300',
  trial:    'border-gray-200',
}

// ── Static fallback plans (shown while API loads or if unavailable) ───────────
const FALLBACK_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: 999,
    currency: 'INR',
    features: ['1 WhatsApp Number', '500 Leads/month', 'CRM + Social Inbox', 'Basic Reports'],
    limits: { whatsapp_numbers: 1, leads: 500, ai_features: false, multi_location: false, priority_support: false },
  },
  {
    id: 'pro',
    name: 'Pro',
    price_monthly: 2999,
    currency: 'INR',
    features: ['1 WhatsApp Number', 'Unlimited Leads', 'Full AI Features', 'WhatsApp Flows', 'Campaign Optimizer', 'Revenue Forecasting'],
    limits: { whatsapp_numbers: 1, leads: null, ai_features: true, multi_location: false, priority_support: false },
  },
  {
    id: 'business',
    name: 'Business',
    price_monthly: 6999,
    currency: 'INR',
    features: ['3 WhatsApp Numbers', 'Multi-Location', 'Unlimited Leads', 'Priority Support', 'Custom Domain', 'Dedicated Account Manager'],
    limits: { whatsapp_numbers: 3, leads: null, ai_features: true, multi_location: true, priority_support: true },
  },
]

// ── Razorpay script loader ────────────────────────────────────────────────────
function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (window.Razorpay) { setLoaded(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => setLoaded(true)
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  return loaded
}

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  currentPlanId,
  onChoose,
  loading,
}: {
  plan: Plan
  currentPlanId: string | undefined
  onChoose: (planId: string) => void
  loading: boolean
}) {
  const isCurrent = plan.id === currentPlanId
  const isPro = plan.id === 'pro'

  return (
    <Card className={`relative flex flex-col h-full transition-all ${PLAN_COLORS[plan.id] ?? 'border-gray-200'}`}>
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#0066FF] text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3" /> Most Popular
          </span>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{plan.name}</CardTitle>
        <div className="mt-1">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {formatAmount(plan.price_monthly, plan.currency)}
          </span>
          <span className="text-sm text-gray-400">/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4">
        <ul className="space-y-2 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          className={`w-full ${isPro ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white' : ''}`}
          variant={isCurrent ? 'outline' : isPro ? 'default' : 'outline'}
          disabled={isCurrent || loading}
          onClick={() => onChoose(plan.id)}
        >
          {isCurrent ? 'Current Plan' : loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Choose ${plan.name}`}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const razorpayReady = useRazorpayScript()
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [showPlans, setShowPlans] = useState(false)

  const { data: subscription, isLoading: subLoading } = useSubscription()
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans()
  const { data: invoices, isLoading: invoicesLoading } = useInvoices()
  const createSubscription = useCreateSubscription()
  const verifySubscription = useVerifySubscription()
  const cancelSubscription = useCancelSubscription()

  const displayPlans = plans ?? FALLBACK_PLANS

  // Show plan cards if no active subscription or user clicked Upgrade
  const shouldShowPlans = showPlans || !subscription || subscription.status === 'cancelled'

  async function handleChoosePlan(planId: string) {
    if (!razorpayReady) {
      toast.error('Payment gateway not loaded. Please refresh and try again.')
      return
    }
    setCheckoutLoading(planId)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await createSubscription.mutateAsync(planId) as any
      const subscription_id: string = result.subscription_id
      const key_id: string = result.key_id

      const options = {
        key: key_id,
        subscription_id,
        name: 'BizNavigo',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — Monthly`,
        image: '/logo.png',
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            await verifySubscription.mutateAsync({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Subscription activated! Welcome to BizNavigo.')
            setShowPlans(false)
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        prefill: {},
        theme: { color: '#0066FF' },
        modal: {
          ondismiss: () => setCheckoutLoading(null),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      toast.error('Could not initiate payment. Please try again.')
      setCheckoutLoading(null)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel your subscription? You will retain access until the end of your current billing period.')) return
    try {
      await cancelSubscription.mutateAsync()
      toast.success('Subscription cancelled. Access continues until period end.')
    } catch {
      toast.error('Could not cancel subscription. Please try again.')
    }
  }

  if (subLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    )
  }

  const planName = subscription?.plan_id
    ? (subscription.plan_id.charAt(0).toUpperCase() + subscription.plan_id.slice(1))
    : null

  const currentPlan = displayPlans.find(p => p.id === subscription?.plan_id)
  const periodEnd = subscription?.current_period_end
  const isTrial = subscription?.status === 'trialing'
  const trialDays = isTrial && subscription?.trial_end ? daysRemaining(subscription.trial_end) : null

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Billing &amp; Plan</h1>
        <p className="text-muted-foreground mt-1">Manage your BizNavigo subscription and payment history.</p>
      </div>

      {/* ── Current Plan Banner ─────────────────────────────────────────── */}
      {subscription && subscription.status !== 'cancelled' ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{planName} Plan</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[subscription.status] ?? ''}`}>
                    {subscription.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {currentPlan && (
                  <p className="text-sm text-gray-500">
                    {formatAmount(currentPlan.price_monthly, currentPlan.currency)}/month
                    {periodEnd && !isTrial && <span> · Renews {formatDate(periodEnd)}</span>}
                    {isTrial && trialDays !== null && (
                      <span className="text-amber-600 font-medium"> · {trialDays} trial days remaining</span>
                    )}
                  </p>
                )}
                {subscription.cancel_at_period_end && periodEnd && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1">
                    <AlertCircle className="h-4 w-4" />
                    Cancels on {formatDate(periodEnd)} — access continues until then
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!subscription.cancel_at_period_end && (
                  <>
                    <Button variant="outline" onClick={() => setShowPlans(true)}>Upgrade</Button>
                    <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={handleCancel} disabled={cancelSubscription.isPending}>
                      {cancelSubscription.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Plan'}
                    </Button>
                  </>
                )}
                {subscription.cancel_at_period_end && (
                  <Button onClick={() => setShowPlans(true)}>Reactivate</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">No active subscription</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">Choose a plan below to activate your account.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Trial warning banner ─────────────────────────────────────────── */}
      {isTrial && trialDays !== null && trialDays <= 3 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Your trial ends in <strong>{trialDays} days</strong>. Choose a plan to continue without interruption.
            </p>
            <Button size="sm" className="ml-auto bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowPlans(true)}>
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Plan Cards ──────────────────────────────────────────────────── */}
      {shouldShowPlans && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {subscription && subscription.status !== 'cancelled' ? 'Change Plan' : 'Choose a Plan'}
            </h2>
            {subscription && !showPlans && (
              <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setShowPlans(false)}>
                ✕ Close
              </button>
            )}
          </div>

          {plansLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {displayPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  currentPlanId={subscription?.plan_id}
                  onChoose={handleChoosePlan}
                  loading={checkoutLoading === plan.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Invoice History ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Invoice History</h2>
        <Card>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No invoices yet</p>
              <p className="text-xs text-gray-400 mt-1">Your payment history will appear here after your first billing cycle.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(inv.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatAmount(inv.amount, inv.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200'
                          : inv.status === 'open' ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.invoice_pdf ? (
                          <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#0066FF] hover:underline">
                            <Download className="h-3 w-3" /> PDF
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
