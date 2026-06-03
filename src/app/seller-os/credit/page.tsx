'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, HandCoins, Loader2, ShieldAlert, WalletCards } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCollectCreditPayment,
  useCreateCreditCustomer,
  useCreditCustomers,
  useSellerOsOverview,
} from '@/hooks/use-seller-os'

function money(value?: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 'Rs 0'
  return `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num)}`
}

function statusTone(status?: string) {
  if (status === 'approved') return 'bg-green-50 text-green-700'
  if (status === 'blocked') return 'bg-rose-50 text-rose-700'
  return 'bg-amber-50 text-amber-700'
}

export default function SellerCreditPage() {
  const overviewQuery = useSellerOsOverview()
  const customersQuery = useCreditCustomers()
  const createCredit = useCreateCreditCustomer()
  const collectPayment = useCollectCreditPayment()

  const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data])
  const [credit, setCredit] = useState({
    phone: '',
    customer_name: '',
    credit_limit: 1000,
    opening_balance: 0,
    due_days: 30,
    status: 'approved' as 'approved' | 'pending' | 'paused' | 'blocked',
  })
  const [payment, setPayment] = useState({
    credit_account_id: '',
    amount: 0,
    payment_method: 'cash' as 'cash' | 'upi' | 'card' | 'bank' | 'other',
  })

  useEffect(() => {
    if (!payment.credit_account_id && customers[0]?.credit_account_id) {
      setPayment((current) => ({
        ...current,
        credit_account_id: customers[0].credit_account_id,
      }))
    }
  }, [customers, payment.credit_account_id])

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

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!payment.credit_account_id) return
    collectPayment.mutate({
      credit_account_id: payment.credit_account_id,
      amount: Number(payment.amount),
      payment_method: payment.payment_method,
    })
  }

  const summary = overviewQuery.data?.summary
  const creditEnabled = Boolean(overviewQuery.data?.features?.credit_sales)
  const approvedCount = overviewQuery.data?.workspaces.credit.approved_customers ?? 0
  const askOwnerCount = overviewQuery.data?.workspaces.credit.pending_customers ?? 0

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-5 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
              <HandCoins className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase text-[#0066FF]">Product seller</p>
              <h1 className="text-2xl font-bold text-slate-950">Credit</h1>
            </div>
          </div>
        </section>

        {!overviewQuery.isLoading && !creditEnabled ? (
          <Card className="border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Credit is hidden for this seller type</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Online sellers can continue with chatbot orders, UPI, COD and delivery flows. Change seller type to Wholesale Seller in Store Setup to enable credit.
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {creditEnabled ? (
        <>
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Money due', value: money(summary?.credit_due ?? 0), icon: WalletCards, tone: 'bg-sky-50 text-sky-700' },
            { label: 'Credit allowed', value: approvedCount, icon: CheckCircle2, tone: 'bg-green-50 text-green-700' },
            { label: 'Ask owner', value: askOwnerCount, icon: ShieldAlert, tone: 'bg-amber-50 text-amber-700' },
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

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-slate-200 p-4 sm:p-5">
            <h2 className="text-lg font-bold text-slate-950">Credit Customers</h2>
            <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
              {customersQuery.isLoading ? (
                <div className="flex items-center gap-2 p-4 text-sm font-semibold text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading customers
                </div>
              ) : customers.length ? customers.map((customer) => (
                <div key={customer.credit_account_id} className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_120px_120px] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-950">{customer.customer_name || customer.phone}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusTone(customer.status)}`}>
                        {customer.credit_label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Due</p>
                    <p className="text-sm font-bold text-slate-950">{money(customer.current_balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Can give</p>
                    <p className="text-sm font-bold text-slate-950">{money(customer.available_credit)}</p>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-sm text-slate-500">No credit customers yet.</div>
              )}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="border-slate-200 p-4 sm:p-5">
              <h2 className="text-lg font-bold text-slate-950">Add Customer</h2>
              <form onSubmit={submitCredit} className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="credit-phone">Phone</Label>
                  <Input id="credit-phone" value={credit.phone} onChange={(event) => setCredit((current) => ({ ...current, phone: event.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="credit-name">Name</Label>
                  <Input id="credit-name" value={credit.customer_name} onChange={(event) => setCredit((current) => ({ ...current, customer_name: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-limit">Limit</Label>
                    <Input id="credit-limit" type="number" min={0} value={credit.credit_limit} onChange={(event) => setCredit((current) => ({ ...current, credit_limit: Number(event.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-old">Old due</Label>
                    <Input id="credit-old" type="number" min={0} value={credit.opening_balance} onChange={(event) => setCredit((current) => ({ ...current, opening_balance: Number(event.target.value) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-days">Due days</Label>
                    <Input id="credit-days" type="number" min={1} value={credit.due_days} onChange={(event) => setCredit((current) => ({ ...current, due_days: Number(event.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit-status">Status</Label>
                    <select id="credit-status" value={credit.status} onChange={(event) => setCredit((current) => ({ ...current, status: event.target.value as typeof credit.status }))} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]">
                      <option value="approved">Allowed</option>
                      <option value="pending">Ask owner</option>
                      <option value="blocked">Blocked</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#0066FF] hover:bg-[#0052CC]" disabled={createCredit.isPending}>
                  Save
                </Button>
              </form>
            </Card>

            <Card className="border-slate-200 p-4 sm:p-5">
              <h2 className="text-lg font-bold text-slate-950">Collect Payment</h2>
              <form onSubmit={submitPayment} className="mt-4 space-y-3">
                <select value={payment.credit_account_id} onChange={(event) => setPayment((current) => ({ ...current, credit_account_id: event.target.value }))} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]" disabled={!customers.length}>
                  {customers.length ? customers.map((customer) => (
                    <option key={customer.credit_account_id} value={customer.credit_account_id}>
                      {customer.customer_name || customer.phone} - {money(customer.current_balance)}
                    </option>
                  )) : (
                    <option value="">No customers</option>
                  )}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" min={1} value={payment.amount} onChange={(event) => setPayment((current) => ({ ...current, amount: Number(event.target.value) }))} />
                  <select value={payment.payment_method} onChange={(event) => setPayment((current) => ({ ...current, payment_method: event.target.value as typeof payment.payment_method }))} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={collectPayment.isPending || !payment.credit_account_id || payment.amount <= 0}>
                  Collect
                </Button>
              </form>
            </Card>
          </div>
        </section>
        </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
