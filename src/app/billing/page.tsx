'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  CreditCard,
  Wallet,
  FileText,
  Pause,
  Play,
  Star,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
} from 'lucide-react'
import {
  useSubscription,
  useBillingPlans,
  useWallet,
  useCreditPricing,
  useSubscribe,
  useCancelSubscription,
  usePauseSubscription,
  useResumeSubscription,
  formatPaise,
  type Plan,
} from '@/hooks/use-billing'
import toast from 'react-hot-toast'

// ── Razorpay global type ──────────────────────────────────────────────────────
declare global {
  interface Window { Razorpay: any } // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

// Map frontend business type keys to API billing keys
function toBillingType(t: string): string {
  if (t === 'events') return 'tours_activities'
  return t
}

const BIZ_TAB_LABELS: Record<string, string> = {
  hospitality: 'Hospitality',
  tours_activities: 'Tours & Activities',
  products: 'Products',
  services: 'Services',
}

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-100 text-green-700 border-green-200',
  trialing:  'bg-blue-100 text-blue-700 border-blue-200',
  past_due:  'bg-orange-100 text-orange-700 border-orange-200',
  paused:    'bg-gray-100 text-gray-500 border-gray-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
  expired:   'bg-red-100 text-red-600 border-red-200',
}

// Feature labels and keys per business type
const FEATURE_LABELS: Record<string, string> = {
  staff_users:          'Staff Users',
  campaigns:            'Campaigns / month',
  channel_manager:      'Channel Manager',
  dynamic_pricing:      'Dynamic Pricing',
  slot_inventory:       'Slot Inventory',
  group_booking:        'Group Booking',
  analytics:            'Advanced Analytics',
  catalog_size:         'Catalog Size',
  order_tracking:       'Order Tracking',
  appointment_booking:  'Appointment Booking',
  service_catalog:      'Service Catalog',
}

const BIZ_FEATURES: Record<string, string[]> = {
  hospitality:       ['staff_users', 'campaigns', 'channel_manager', 'dynamic_pricing'],
  tours_activities:  ['staff_users', 'campaigns', 'slot_inventory', 'group_booking', 'analytics'],
  products:          ['staff_users', 'campaigns', 'catalog_size', 'order_tracking', 'analytics'],
  services:          ['staff_users', 'campaigns', 'appointment_booking', 'service_catalog', 'analytics'],
}

function featureValue(val: number | boolean | string | undefined): string {
  if (val === undefined || val === null) return '—'
  if (typeof val === 'boolean') return val ? '✓' : '—'
  if (val === -1) return 'Unlimited'
  return String(val)
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  currentPlan,
  onSubscribe,
  loading,
}: {
  plan: Plan
  currentPlan: string | undefined
  onSubscribe: (planId: string) => void
  loading: boolean
}) {
  const isCurrent = plan.plan_id === currentPlan
  const isPopular = plan.tier === 'pro'
  const featureKeys = BIZ_FEATURES[plan.business_type] ?? []

  return (
    <Card className={`relative flex flex-col transition-all ${
      isPopular ? 'border-[#0066FF] ring-2 ring-[#0066FF]/20' : 'border-gray-200'
    } ${isCurrent ? 'bg-green-50/40 dark:bg-green-950/10' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#0066FF] text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3" />Most Popular
          </span>
        </div>
      )}
      <CardContent className="pt-6 pb-5 flex flex-col gap-4 h-full">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{plan.tier}</p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{plan.name}</h3>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatPaise(plan.amount)}
            </span>
            <span className="text-sm text-gray-400 mb-1">/{plan.interval === 'yearly' ? 'yr' : 'mo'}</span>
          </div>
          {plan.initial_credits > 0 && (
            <p className="text-xs text-[#0066FF] mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3" />Includes {formatPaise(plan.initial_credits)} WhatsApp credits/month
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-1.5 flex-1">
          {featureKeys.map((key) => {
            const val = plan.features[key]
            const display = featureValue(val as number | boolean | string | undefined)
            if (display === '—') return null
            return (
              <li key={key} className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  {FEATURE_LABELS[key] ?? key}
                </span>
                {display !== '✓' && <span className="text-xs font-semibold text-gray-500">{display}</span>}
              </li>
            )
          })}
        </ul>

        <Button
          className={`w-full mt-auto ${isPopular && !isCurrent ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white' : ''}`}
          variant={isCurrent ? 'outline' : isPopular ? 'default' : 'outline'}
          disabled={isCurrent || loading}
          onClick={() => onSubscribe(plan.plan_id)}
        >
          {isCurrent
            ? <><CheckCircle2 className="h-4 w-4 mr-1.5" />Current Plan</>
            : loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : `Subscribe to ${plan.name}`}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Pause Dialog ──────────────────────────────────────────────────────────────

function PauseDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (start: string, end: string) => void
  loading: boolean
}) {
  const today = new Date().toISOString().split('T')[0]
  const defaultEnd = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(defaultEnd)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pause Subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Your subscription will be paused between these dates. No charges during the pause period.</p>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Pause from</label>
            <Input type="date" value={start} min={today} onChange={(e) => setStart(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Resume on</label>
            <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={() => onConfirm(start, end)} disabled={loading || !start || !end || end <= start}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            Pause Subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Credit Pricing Table ──────────────────────────────────────────────────────

function CreditPricingSection() {
  const [open, setOpen] = useState(false)
  const { data: pricing, isLoading } = useCreditPricing()

  return (
    <Card>
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">WhatsApp Credit Pricing</p>
          <p className="text-xs text-gray-400 mt-0.5">View cost per action type</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />Loading pricing...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 text-xs text-gray-400 font-semibold uppercase">Action</th>
                  <th className="text-right py-2 text-xs text-gray-400 font-semibold uppercase">Cost / unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {(pricing ?? []).map((p) => (
                  <tr key={p.action_type} className="text-gray-700 dark:text-gray-300">
                    <td className="py-2 capitalize">{p.description || p.action_type.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-right font-semibold">₹{(p.cost / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user } = useAuthStore()
  const userBizType = toBillingType(user?.business_type ?? 'products')
  const allBizTypes = ['hospitality', 'tours_activities', 'products', 'services']

  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [pauseOpen, setPauseOpen] = useState(false)
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null)

  const { data: sub, isLoading: subLoading } = useSubscription()
  const { data: wallet } = useWallet()
  const { data: plans = [], isLoading: plansLoading } = useBillingPlans()

  const subscribe = useSubscribe()
  const cancel = useCancelSubscription()
  const pause = usePauseSubscription()
  const resume = useResumeSubscription()

  const walletBalance = wallet?.balance ?? null
  const lowBalance = walletBalance !== null && walletBalance < 10000 // < ₹100

  async function handleSubscribe(planId: string) {
    setCheckoutPlanId(planId)
    try {
      const result = await subscribe.mutateAsync(planId)
      window.open(result.checkout_url, '_blank')
    } catch {
      // error toast handled in hook
    } finally {
      setCheckoutPlanId(null)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel your subscription? You keep access until the end of your billing period.')) return
    await cancel.mutateAsync()
  }

  async function handlePause(start: string, end: string) {
    await pause.mutateAsync({ pause_start: start, pause_end: end })
    setPauseOpen(false)
  }

  async function handleResume() {
    await resume.mutateAsync()
  }

  const groupedPlans: Record<string, Plan[]> = {}
  for (const bt of allBizTypes) {
    groupedPlans[bt] = plans.filter((p) => p.business_type === bt && p.interval === interval)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing &amp; Plan</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage your subscription and WhatsApp credits</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/billing/wallet">
              <Button variant="outline" className="gap-2 text-sm">
                <Wallet className="h-4 w-4" />Wallet
                {walletBalance !== null && (
                  <span className={`ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${lowBalance ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                    {formatPaise(walletBalance)}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/billing/invoices">
              <Button variant="outline" className="gap-2 text-sm">
                <FileText className="h-4 w-4" />Invoices
              </Button>
            </Link>
          </div>
        </div>

        {/* Low wallet alert */}
        {lowBalance && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-800 dark:text-orange-300 flex-1">
              Your WhatsApp credits are low ({formatPaise(walletBalance!)}). Recharge to keep campaigns and flows running.
            </p>
            <Link href="/billing/wallet">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0">Recharge</Button>
            </Link>
          </div>
        )}

        {/* Subscription Status Card */}
        {subLoading ? (
          <Card><CardContent className="p-6 flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /><span className="text-sm text-gray-400">Loading subscription...</span></CardContent></Card>
        ) : !sub || sub.status === 'cancelled' || sub.status === 'expired' ? (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-5 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300">No active subscription</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">Choose a plan below to activate your account.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="font-bold text-gray-900 dark:text-white capitalize">{sub.plan} Plan</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[sub.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {sub.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {sub.status === 'paused' ? 'Subscription is paused' : (
                      <>Renews {formatDate(sub.current_period_end)} · {daysLeft(sub.current_period_end)} days left</>
                    )}
                  </p>
                  {sub.cancel_at_period_end && (
                    <p className="text-sm text-red-600">Cancels {formatDate(sub.current_period_end)} — access continues until then</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {sub.status === 'paused' && (
                    <Button size="sm" onClick={handleResume} disabled={resume.isPending} className="gap-1.5">
                      {resume.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      Resume
                    </Button>
                  )}
                  {sub.status === 'active' && !sub.cancel_at_period_end && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setPauseOpen(true)} disabled={pause.isPending} className="gap-1.5">
                        <Pause className="h-3.5 w-3.5" />Pause
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5"
                        onClick={handleCancel} disabled={cancel.isPending}>
                        {cancel.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credit pricing */}
        <CreditPricingSection />

        {/* Plans section */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {sub && sub.status === 'active' ? 'Change Plan' : 'Choose a Plan'}
            </h2>
            {/* Monthly / Yearly toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setInterval('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${interval === 'monthly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}
              >Monthly</button>
              <button
                onClick={() => setInterval('yearly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${interval === 'yearly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}
              >
                Yearly
                <span className="ml-1 text-[10px] text-green-600 font-bold">SAVE 20%</span>
              </button>
            </div>
          </div>

          <Tabs defaultValue={userBizType}>
            <TabsList className="mb-5 flex-wrap h-auto gap-1">
              {allBizTypes.map((bt) => (
                <TabsTrigger key={bt} value={bt} className="text-xs">
                  {BIZ_TAB_LABELS[bt]}
                </TabsTrigger>
              ))}
            </TabsList>

            {allBizTypes.map((bt) => (
              <TabsContent key={bt} value={bt}>
                {plansLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (groupedPlans[bt] ?? []).length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm">
                    No plans available for this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-3">
                    {(groupedPlans[bt] ?? []).map((plan) => (
                      <PlanCard
                        key={plan.plan_id}
                        plan={plan}
                        currentPlan={sub?.plan}
                        onSubscribe={handleSubscribe}
                        loading={checkoutPlanId === plan.plan_id}
                      />
                    ))}
                  </div>
                )}
                {interval === 'yearly' && (
                  <p className="text-xs text-gray-400 text-center mt-4">
                    <ExternalLink className="h-3 w-3 inline mr-1" />
                    Annual plans are billed once yearly. Cancel anytime before renewal.
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Pause dialog */}
        <PauseDialog
          open={pauseOpen}
          onClose={() => setPauseOpen(false)}
          onConfirm={handlePause}
          loading={pause.isPending}
        />
      </div>
    </DashboardLayout>
  )
}
