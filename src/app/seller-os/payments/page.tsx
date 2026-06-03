'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AlertTriangle, Banknote, CheckCircle2, Clock, CreditCard, Loader2, Package, WalletCards } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SellerPaymentDeskOrder,
  SellerPaymentHold,
  useCancelSellerPaymentOrder,
  useCreatePaymentRequestFromHold,
  useMarkSellerOrderPaid,
  useSellerPaymentDesk,
} from '@/hooks/use-seller-os'

function money(value?: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 'Rs 0'
  return `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num)}`
}

function methodLabel(method?: string) {
  if (method === 'cod') return 'COD'
  if (method === 'upi') return 'UPI'
  if (method === 'cash') return 'Cash'
  if (method === 'card') return 'Card'
  return method || 'Payment'
}

function OrderCard({
  order,
  onPaid,
  onCancel,
  busy,
}: {
  order: SellerPaymentDeskOrder
  onPaid: (order: SellerPaymentDeskOrder, reference: string) => void
  onCancel: (order: SellerPaymentDeskOrder) => void
  busy?: boolean
}) {
  const [reference, setReference] = useState('')
  const itemText = order.items?.map((item) => `${item.quantity} x ${item.product_name}`).join(', ')

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-950">{order.order_number || order.order_id}</p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
              {methodLabel(order.payment_method)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{order.customer_name || order.customer_phone || 'Customer'}</p>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{itemText}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-950">{money(order.total_amount)}</p>
          {order.payment_expires_in_minutes !== null && order.payment_expires_in_minutes !== undefined ? (
            <p className="mt-1 text-xs font-semibold text-amber-700">{order.payment_expires_in_minutes} min left</p>
          ) : null}
        </div>
      </div>
      <form
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault()
          onPaid(order, reference)
        }}
      >
        <Input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="UPI reference / note"
        />
        <Button type="submit" disabled={busy} className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
          <CheckCircle2 className="h-4 w-4" />
          Paid
        </Button>
        <Button type="button" variant="outline" className="bg-white" disabled={busy} onClick={() => onCancel(order)}>
          Cancel
        </Button>
      </form>
    </div>
  )
}

function HoldCard({
  hold,
  onRequest,
  busy,
}: {
  hold: SellerPaymentHold
  onRequest: (hold: SellerPaymentHold, method: 'upi' | 'cod' | 'cash' | 'card' | 'other', address: string) => void
  busy?: boolean
}) {
  const [method, setMethod] = useState<'upi' | 'cod' | 'cash' | 'card' | 'other'>('upi')
  const [address, setAddress] = useState('')

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950">{hold.product_name}</p>
          <p className="mt-1 text-xs text-slate-500">Qty {hold.quantity} · {hold.customer_phone || 'No phone'}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-950">{money(hold.estimated_amount)}</p>
          <p className="mt-1 text-xs font-semibold text-amber-700">{hold.expires_in_minutes ?? 0} min left</p>
        </div>
      </div>
      {hold.payment_order_id ? (
        <div className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
          Payment request already created
        </div>
      ) : (
        <form
          className="mt-3 grid gap-2 sm:grid-cols-[110px_1fr_auto]"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            onRequest(hold, method, address)
          }}
        >
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as typeof method)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0066FF]"
          >
            <option value="upi">UPI</option>
            <option value="cod">COD</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
          <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Delivery address, optional" />
          <Button type="submit" disabled={busy}>Request</Button>
        </form>
      )}
    </div>
  )
}

export default function SellerPaymentDeskPage() {
  const paymentDeskQuery = useSellerPaymentDesk()
  const createRequest = useCreatePaymentRequestFromHold()
  const markPaid = useMarkSellerOrderPaid()
  const cancelOrder = useCancelSellerPaymentOrder()

  const desk = paymentDeskQuery.data
  const pendingOrders = useMemo(() => desk?.pending_orders ?? [], [desk?.pending_orders])
  const codOrders = useMemo(() => desk?.cod_orders ?? [], [desk?.cod_orders])
  const holds = useMemo(() => desk?.active_holds ?? [], [desk?.active_holds])

  function handlePaid(order: SellerPaymentDeskOrder, reference: string) {
    markPaid.mutate({
      order_id: order.order_id,
      payment_method: (order.payment_method as any) || 'upi',
      payment_reference: reference,
    })
  }

  function handleCancel(order: SellerPaymentDeskOrder) {
    cancelOrder.mutate({
      order_id: order.order_id,
      reason: 'Cancelled from Payment Desk',
    })
  }

  function handleRequest(hold: SellerPaymentHold, method: 'upi' | 'cod' | 'cash' | 'card' | 'other', address: string) {
    createRequest.mutate({
      reservation_id: hold.reservation_id,
      payment_method: method,
      delivery_address: address,
      delivery_required: Boolean(address),
    })
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase text-[#0066FF]">Product seller</p>
              <h1 className="text-2xl font-bold text-slate-950">Payment Desk</h1>
            </div>
          </div>
        </section>

        {paymentDeskQuery.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
          </div>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Waiting payment', value: desk?.summary.pending_payments ?? 0, icon: Clock, tone: 'bg-amber-50 text-amber-700' },
                { label: 'COD collection', value: desk?.summary.cod_collections ?? 0, icon: Banknote, tone: 'bg-green-50 text-green-700' },
                { label: 'Active holds', value: desk?.summary.active_holds ?? 0, icon: Package, tone: 'bg-blue-50 text-[#0066FF]' },
                { label: 'Paid today', value: desk?.summary.paid_today ?? 0, icon: WalletCards, tone: 'bg-slate-100 text-slate-700' },
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

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-slate-950">Waiting Payment</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {pendingOrders.length ? pendingOrders.map((order) => (
                    <OrderCard
                      key={order.order_id}
                      order={order}
                      onPaid={handlePaid}
                      onCancel={handleCancel}
                      busy={markPaid.isPending || cancelOrder.isPending}
                    />
                  )) : (
                    <p className="text-sm text-slate-500">No payment waiting orders.</p>
                  )}
                </div>
              </Card>

              <div className="space-y-5">
                <Card className="border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#0066FF]" />
                    <h2 className="text-lg font-bold text-slate-950">Held Stock</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {holds.length ? holds.slice(0, 8).map((hold) => (
                      <HoldCard
                        key={hold.reservation_id}
                        hold={hold}
                        onRequest={handleRequest}
                        busy={createRequest.isPending}
                      />
                    )) : (
                      <p className="text-sm text-slate-500">No active stock holds.</p>
                    )}
                  </div>
                </Card>

                <Card className="border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-green-700" />
                    <h2 className="text-lg font-bold text-slate-950">COD Follow-up</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {codOrders.length ? codOrders.slice(0, 5).map((order) => (
                      <div key={order.order_id} className="rounded-md border border-green-100 bg-green-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-green-950">{order.order_number || order.order_id}</p>
                          <span className="text-sm font-bold text-green-800">{money(order.total_amount)}</span>
                        </div>
                        <p className="mt-1 text-xs text-green-800">{order.customer_phone || 'Customer'} · {order.shipping_address || 'Pickup / address pending'}</p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3 bg-green-700 hover:bg-green-800"
                          disabled={markPaid.isPending}
                          onClick={() => handlePaid(order, 'COD collected')}
                        >
                          Mark COD collected
                        </Button>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">No COD collection waiting.</p>
                    )}
                  </div>
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
