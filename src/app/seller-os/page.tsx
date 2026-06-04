'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  CreditCard,
  HandCoins,
  Loader2,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateCreditCustomer,
  useCreateManualSale,
  useCreateStockReservation,
  useCreditCustomers,
  useCollectCreditPayment,
  useReleaseStockReservation,
  useSellerOsOverview,
} from '@/hooks/use-seller-os'
import { useProducts } from '@/hooks/use-products'

function money(value?: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 'Rs 0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

function riskClass(risk?: string) {
  if (risk === 'high') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (risk === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-green-200 bg-green-50 text-green-700'
}

function employeeIcon(key: string) {
  if (key === 'sales' || key === 'sales_ai') return Users
  if (key === 'inventory' || key === 'inventory_ai') return Package
  if (key === 'credit' || key === 'credit_guard') return HandCoins
  if (key === 'delivery' || key === 'delivery_ai') return Truck
  if (key === 'profit' || key === 'profit_coach') return CreditCard
  return ShieldCheck
}

export default function SellerOsPage() {
  const overviewQuery = useSellerOsOverview()
  const productsQuery = useProducts(1, 50)
  const createSale = useCreateManualSale()
  const createHold = useCreateStockReservation()
  const createCredit = useCreateCreditCustomer()
  const collectCreditPayment = useCollectCreditPayment()
  const creditCustomersQuery = useCreditCustomers()
  const releaseHold = useReleaseStockReservation()

  const products = useMemo(() => productsQuery.data?.products ?? [], [productsQuery.data?.products])
  const creditCustomers = useMemo(() => creditCustomersQuery.data ?? [], [creditCustomersQuery.data])
  const firstProductId = products[0]?.id ?? ''

  const [sale, setSale] = useState({
    customer_phone: '',
    customer_name: '',
    item_id: '',
    quantity: 1,
    payment_method: 'cash' as 'cash' | 'upi' | 'card' | 'cod' | 'credit' | 'other',
    delivery_required: false,
  })
  const [hold, setHold] = useState({
    customer_phone: '',
    item_id: '',
    quantity: 1,
    hold_minutes: 60,
  })
  const [credit, setCredit] = useState({
    phone: '',
    customer_name: '',
    credit_limit: 1000,
    opening_balance: 0,
    due_days: 30,
    status: 'approved' as 'approved' | 'pending' | 'paused' | 'blocked',
  })
  const [creditPayment, setCreditPayment] = useState({
    credit_account_id: '',
    amount: 0,
    payment_method: 'cash' as 'cash' | 'upi' | 'card' | 'bank' | 'other',
  })

  useEffect(() => {
    if (firstProductId && !sale.item_id) {
      setSale((current) => ({ ...current, item_id: firstProductId }))
    }
    if (firstProductId && !hold.item_id) {
      setHold((current) => ({ ...current, item_id: firstProductId }))
    }
  }, [firstProductId, hold.item_id, sale.item_id])

  useEffect(() => {
    if (!creditPayment.credit_account_id && creditCustomers[0]?.credit_account_id) {
      setCreditPayment((current) => ({
        ...current,
        credit_account_id: creditCustomers[0].credit_account_id,
      }))
    }
  }, [creditCustomers, creditPayment.credit_account_id])

  const overview = overviewQuery.data
  const summary = overview?.summary
  const creditEnabled = Boolean(overview?.features?.credit_sales)
  const intelligence = overview?.online_intelligence
  const demandedItems = intelligence?.most_demanded_items ?? []
  const restockItems = [
    ...(intelligence?.out_of_stock_demand ?? []),
    ...(intelligence?.fast_moving_low_stock ?? []),
  ].filter((item, index, list) => list.findIndex((candidate) => candidate.product_id === item.product_id) === index)
  const aiRecommendations = intelligence?.ai_recommendations ?? []

  useEffect(() => {
    if (!creditEnabled && sale.payment_method === 'credit') {
      setSale((current) => ({ ...current, payment_method: 'cash' }))
    }
  }, [creditEnabled, sale.payment_method])

  function submitSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sale.item_id) return
    createSale.mutate({
      customer_phone: sale.customer_phone,
      customer_name: sale.customer_name,
      item_id: sale.item_id,
      quantity: Number(sale.quantity),
      payment_method: sale.payment_method,
      delivery_required: sale.delivery_required,
    })
  }

  function submitHold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hold.item_id) return
    createHold.mutate({
      customer_phone: hold.customer_phone,
      item_id: hold.item_id,
      quantity: Number(hold.quantity),
      hold_minutes: Number(hold.hold_minutes),
    })
  }

  function submitCredit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createCredit.mutate({
      phone: credit.phone,
      customer_name: credit.customer_name,
      credit_limit: Number(credit.credit_limit),
      opening_balance: Number(credit.opening_balance),
      due_days: Number(credit.due_days),
      status: credit.status,
    })
  }

  function submitCreditPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!creditPayment.credit_account_id) return
    collectCreditPayment.mutate({
      credit_account_id: creditPayment.credit_account_id,
      amount: Number(creditPayment.amount),
      payment_method: creditPayment.payment_method,
    })
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#0066FF]">Product seller</p>
                  <h1 className="text-2xl font-bold text-slate-950">Store Desk</h1>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/crm/inbox">
                  <Users className="h-4 w-4" />
                  Inbox
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/seller-os/leads">
                  <MessageCircle className="h-4 w-4" />
                  Enquiries
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/seller-os/payments">
                  <CreditCard className="h-4 w-4" />
                  Payment Desk
                </Link>
              </Button>
              <Button asChild className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                <Link href="/inventory/products">
                  <Package className="h-4 w-4" />
                  Products
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {overviewQuery.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
          </div>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Need owner', value: summary?.owner_queue ?? 0, icon: AlertTriangle, tone: 'bg-rose-50 text-rose-700' },
                { label: 'Today sales', value: summary?.today_orders ?? 0, icon: ShoppingBag, tone: 'bg-green-50 text-green-700' },
                { label: 'Stock holds', value: summary?.stock_holds ?? 0, icon: Clock, tone: 'bg-amber-50 text-amber-700' },
                { label: 'Waiting payment', value: summary?.pending_payments ?? 0, icon: CreditCard, tone: 'bg-blue-50 text-[#0066FF]' },
                ...(creditEnabled ? [{ label: 'Credit due', value: money(summary?.credit_due ?? 0), icon: HandCoins, tone: 'bg-sky-50 text-sky-700' }] : []),
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.label} className="border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
                      </div>
                      <span className={`flex h-11 w-11 items-center justify-center rounded-md ${item.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </Card>
                )
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.55fr)]">
              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Owner Approval Queue</h2>
                    <p className="mt-1 text-sm text-slate-500">{summary?.owner_queue ?? 0} waiting</p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
                    <Link href="/ai-employees">AI Employees</Link>
                  </Button>
                </div>
                <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {overview?.owner_queue?.length ? overview.owner_queue.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-950">{item.title}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${riskClass(item.risk)}`}>
                            {item.risk}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{item.text}</p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                  )) : (
                    <div className="p-4 text-sm font-semibold text-green-700">No owner approval waiting</div>
                  )}
                </div>
              </Card>

              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Counter Sale</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {creditEnabled ? 'Cash, UPI, COD, or approved credit' : 'Cash, UPI, COD, or card'}
                    </p>
                  </div>
                </div>
                <form onSubmit={submitSale} className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="sale-phone">Phone</Label>
                      <Input
                        id="sale-phone"
                        value={sale.customer_phone}
                        onChange={(event) => setSale((current) => ({ ...current, customer_phone: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sale-name">Name</Label>
                      <Input
                        id="sale-name"
                        value={sale.customer_name}
                        onChange={(event) => setSale((current) => ({ ...current, customer_name: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sale-product">Product</Label>
                    <select
                      id="sale-product"
                      value={sale.item_id}
                      onChange={(event) => setSale((current) => ({ ...current, item_id: event.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]"
                      required
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {money(product.price)} - stock {product.stock_quantity ?? 0}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="sale-qty">Qty</Label>
                      <Input
                        id="sale-qty"
                        type="number"
                        min={1}
                        value={sale.quantity}
                        onChange={(event) => setSale((current) => ({ ...current, quantity: Number(event.target.value) }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sale-payment">Payment</Label>
                      <select
                        id="sale-payment"
                        value={sale.payment_method}
                        onChange={(event) => setSale((current) => ({ ...current, payment_method: event.target.value as typeof sale.payment_method }))}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="cod">COD</option>
                        {creditEnabled ? <option value="credit">Credit</option> : null}
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={sale.delivery_required}
                      onChange={(event) => setSale((current) => ({ ...current, delivery_required: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Local delivery
                  </label>
                  <Button type="submit" className="w-full gap-2 bg-[#0066FF] hover:bg-[#0052CC]" disabled={createSale.isPending || !products.length}>
                    {createSale.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Save sale
                  </Button>
                </form>
              </Card>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Hold Stock</h2>
                    <p className="mt-1 text-sm text-slate-500">{overview?.workspaces.stock_reservations?.length ?? 0} active</p>
                  </div>
                </div>
                <form onSubmit={submitHold} className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px_120px_auto]">
                  <select
                    value={hold.item_id}
                    onChange={(event) => setHold((current) => ({ ...current, item_id: event.target.value }))}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]"
                    required
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    value={hold.quantity}
                    onChange={(event) => setHold((current) => ({ ...current, quantity: Number(event.target.value) }))}
                  />
                  <Input
                    type="number"
                    min={5}
                    value={hold.hold_minutes}
                    onChange={(event) => setHold((current) => ({ ...current, hold_minutes: Number(event.target.value) }))}
                  />
                  <Button type="submit" disabled={createHold.isPending || !products.length}>
                    Hold
                  </Button>
                </form>
                <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {overview?.workspaces.stock_reservations?.length ? overview.workspaces.stock_reservations.slice(0, 4).map((item) => (
                    <div key={item.reservation_id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">Qty {item.quantity}</p>
                        <p className="truncate text-xs text-slate-500">Until {item.expires_at ? new Date(item.expires_at).toLocaleString() : 'later'}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-white"
                        onClick={() => releaseHold.mutate(item.reservation_id)}
                      >
                        Release
                      </Button>
                    </div>
                  )) : (
                    <div className="p-3 text-sm text-slate-500">No active stock holds</div>
                  )}
                </div>
              </Card>

              {creditEnabled ? (
              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                    <HandCoins className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Credit</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {money(overview?.workspaces.credit.total_credit_due ?? 0)} due from customers
                    </p>
                  </div>
                </div>
                <form onSubmit={submitCredit} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-phone">Phone</Label>
                    <Input
                      id="credit-phone"
                      value={credit.phone}
                      onChange={(event) => setCredit((current) => ({ ...current, phone: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-name">Name</Label>
                    <Input
                      id="credit-name"
                      value={credit.customer_name}
                      onChange={(event) => setCredit((current) => ({ ...current, customer_name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-limit">Credit limit</Label>
                    <Input
                      id="credit-limit"
                      type="number"
                      min={0}
                      value={credit.credit_limit}
                      onChange={(event) => setCredit((current) => ({ ...current, credit_limit: Number(event.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-old-due">Old due</Label>
                    <Input
                      id="credit-old-due"
                      type="number"
                      min={0}
                      value={credit.opening_balance}
                      onChange={(event) => setCredit((current) => ({ ...current, opening_balance: Number(event.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-days">Due days</Label>
                    <Input
                      id="credit-days"
                      type="number"
                      min={1}
                      value={credit.due_days}
                      onChange={(event) => setCredit((current) => ({ ...current, due_days: Number(event.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-status">Credit status</Label>
                    <select
                      id="credit-status"
                      value={credit.status}
                      onChange={(event) => setCredit((current) => ({ ...current, status: event.target.value as typeof credit.status }))}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]"
                    >
                      <option value="approved">Allowed</option>
                      <option value="pending">Ask owner</option>
                      <option value="blocked">Blocked</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                  <Button type="submit" className="sm:col-span-2" disabled={createCredit.isPending}>
                    {createCredit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save credit customer
                  </Button>
                </form>

                <form onSubmit={submitCreditPayment} className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_110px_110px_auto]">
                    <select
                      value={creditPayment.credit_account_id}
                      onChange={(event) => setCreditPayment((current) => ({ ...current, credit_account_id: event.target.value }))}
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]"
                      disabled={!creditCustomers.length}
                    >
                      {creditCustomers.length ? creditCustomers.map((customer) => (
                        <option key={customer.credit_account_id} value={customer.credit_account_id}>
                          {customer.customer_name || customer.phone} - due {money(customer.current_balance)}
                        </option>
                      )) : (
                        <option value="">No credit customers</option>
                      )}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Amount"
                      value={creditPayment.amount}
                      onChange={(event) => setCreditPayment((current) => ({ ...current, amount: Number(event.target.value) }))}
                    />
                    <select
                      value={creditPayment.payment_method}
                      onChange={(event) => setCreditPayment((current) => ({ ...current, payment_method: event.target.value as typeof creditPayment.payment_method }))}
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank</option>
                    </select>
                    <Button type="submit" disabled={collectCreditPayment.isPending || !creditPayment.credit_account_id || creditPayment.amount <= 0}>
                      Collect
                    </Button>
                  </div>
                </form>

                <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {creditCustomers.length ? creditCustomers.slice(0, 5).map((customer) => (
                    <div key={customer.credit_account_id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-950">{customer.customer_name || customer.phone}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            customer.status === 'approved'
                              ? 'bg-green-50 text-green-700'
                              : customer.status === 'blocked'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}>
                            {customer.credit_label}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          Due {money(customer.current_balance)} · Can give {money(customer.available_credit)} more
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-slate-700">{money(customer.credit_limit)}</span>
                    </div>
                  )) : (
                    <div className="p-3 text-sm text-slate-500">Add old trusted customers to allow credit sales.</div>
                  )}
                </div>
              </Card>
              ) : null}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#0066FF]">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Most Demanded Items</h2>
                      <p className="mt-1 text-sm text-slate-500">Last {intelligence?.period_days ?? 30} days from WhatsApp, orders and stock holds</p>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
                    <Link href="/inventory/products">Products</Link>
                  </Button>
                </div>

                <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {demandedItems.length ? demandedItems.slice(0, 6).map((item) => (
                    <div key={item.product_id} className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_80px_80px_100px] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{item.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{item.recommendation}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase text-slate-400">Asked</p>
                        <p className="text-sm font-bold text-slate-950">{item.asked_count}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase text-slate-400">Sold</p>
                        <p className="text-sm font-bold text-slate-950">{item.sold_count}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase text-slate-400">Stock left</p>
                        <p className={`text-sm font-bold ${item.available_stock <= 0 ? 'text-rose-700' : item.available_stock <= 5 ? 'text-amber-700' : 'text-slate-950'}`}>
                          {item.available_stock}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 text-sm text-slate-500">Demand will appear after customers ask or buy products.</div>
                  )}
                </div>
              </Card>

              <div className="space-y-5">
                <Card className="border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h2 className="text-lg font-bold text-slate-950">Restock Alerts</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {restockItems.length ? restockItems.slice(0, 5).map((item) => (
                      <div key={item.product_id} className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-amber-950">{item.name}</p>
                          <span className="shrink-0 text-xs font-bold text-amber-700">Stock {item.available_stock}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Asked {item.asked_count}. Out of stock requests {item.out_of_stock_requests || 0}.
                        </p>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">No urgent restock alert.</p>
                    )}
                  </div>
                </Card>

                <Card className="border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-700" />
                    <h2 className="text-lg font-bold text-slate-950">AI Suggestions</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {aiRecommendations.length ? aiRecommendations.map((item) => (
                      <div key={item.key} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${item.priority === 'high' ? 'bg-rose-500' : item.priority === 'normal' ? 'bg-[#0066FF]' : 'bg-slate-300'}`} />
                          <p className="text-sm font-bold text-slate-950">{item.title}</p>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                        <p className="mt-1 text-xs font-bold text-[#0066FF]">{item.action}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">AI suggestions will appear after more activity.</p>
                    )}
                  </div>
                </Card>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overview?.ai_employees?.map((employee) => {
                const Icon = employeeIcon(employee.key)
                return (
                  <Card key={employee.key} className="border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-950">{employee.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{employee.simple_job}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md bg-slate-50 px-3 py-2">
                        <p className="font-semibold text-slate-500">Today</p>
                        <p className="mt-1 font-bold text-slate-950">{employee.today}</p>
                      </div>
                      <div className="rounded-md bg-green-50 px-3 py-2">
                        <p className="font-semibold text-green-700">Next</p>
                        <p className="mt-1 font-bold text-green-950">{employee.next}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              <Card className="border-slate-200 p-4 sm:p-5">
                <h2 className="text-lg font-bold text-slate-950">Demand Heatmap</h2>
                <div className="mt-4 space-y-3">
                  {overview?.demand_heatmap?.length ? overview.demand_heatmap.map((item) => (
                    <div key={item.category} className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-slate-700">{item.category}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{item.inquiry_count}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">No demand signals yet</p>
                  )}
                </div>
              </Card>

              <Card className="border-slate-200 p-4 sm:p-5">
                <h2 className="text-lg font-bold text-slate-950">Dead Stock Recovery</h2>
                <div className="mt-4 space-y-3">
                  {overview?.dead_stock?.length ? overview.dead_stock.slice(0, 5).map((item) => (
                    <div key={item.item_id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{item.name}</p>
                        <p className="text-xs text-slate-500">Stock {item.stock_quantity ?? 0}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{money(item.base_price)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">No old stock alert</p>
                  )}
                </div>
              </Card>

              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-950">AI Audit Log</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {overview?.ai_audit_log?.length ? overview.ai_audit_log.slice(0, 5).map((item) => (
                    <div key={item.ai_audit_id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                      <p className="text-sm font-bold text-slate-950">{item.ai_employee}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">{item.output_summary}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">No AI checks yet</p>
                  )}
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
