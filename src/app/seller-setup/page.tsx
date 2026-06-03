'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  PackagePlus,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  Wallet,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SellerSetupProductPayload,
  useCompleteSellerSetup,
  useSellerSetup,
} from '@/hooks/use-seller-os'

const PAYMENT_MODES = [
  { key: 'cash', label: 'Cash', icon: Wallet },
  { key: 'upi', label: 'UPI', icon: CreditCard },
  { key: 'cod', label: 'COD', icon: Truck },
  { key: 'card', label: 'Card', icon: CreditCard },
]

const DELIVERY_MODES = [
  { key: 'pickup', label: 'Pickup' },
  { key: 'local_delivery', label: 'Local delivery' },
  { key: 'courier', label: 'Courier' },
]

const STARTER_PRODUCTS: SellerSetupProductPayload[] = [
  { name: '', category: '', price: 0, cost_price: 0, stock_quantity: 0, sku: '' },
  { name: '', category: '', price: 0, cost_price: 0, stock_quantity: 0, sku: '' },
  { name: '', category: '', price: 0, cost_price: 0, stock_quantity: 0, sku: '' },
]

const SELLER_MODES = [
  {
    key: 'online_seller',
    title: 'Online seller',
    text: 'Instagram, WhatsApp or website customers buy through chatbot.',
    note: 'Credit hidden',
  },
  {
    key: 'retail_seller',
    title: 'Shop seller',
    text: 'Walk-in or phone orders with stock and delivery control.',
    note: 'Simple sales',
  },
  {
    key: 'wholesale_seller',
    title: 'Wholesale seller',
    text: 'Local sellers buy regularly and may use credit.',
    note: 'Credit enabled',
  },
] as const

function toggle(list: string[], key: string) {
  return list.includes(key) ? list.filter((item) => item !== key) : [...list, key]
}

export default function SellerSetupPage() {
  const router = useRouter()
  const setupQuery = useSellerSetup()
  const completeSetup = useCompleteSellerSetup()

  const existingProducts = useMemo(() => setupQuery.data?.recent_products ?? [], [setupQuery.data?.recent_products])
  const [stockHoldMinutes, setStockHoldMinutes] = useState(15)
  const [sellerMode, setSellerMode] = useState<'online_seller' | 'retail_seller' | 'wholesale_seller'>('online_seller')
  const [lowStockThreshold, setLowStockThreshold] = useState(5)
  const [paymentModes, setPaymentModes] = useState(['cash', 'upi', 'cod'])
  const [deliveryModes, setDeliveryModes] = useState(['pickup', 'local_delivery'])
  const [deliveryAreas, setDeliveryAreas] = useState('')
  const [defaultCreditLimit, setDefaultCreditLimit] = useState(1000)
  const [defaultCreditDueDays, setDefaultCreditDueDays] = useState(30)
  const [highValueApprovalAmount, setHighValueApprovalAmount] = useState(10000)
  const [requireCreditApproval, setRequireCreditApproval] = useState(true)
  const [products, setProducts] = useState<SellerSetupProductPayload[]>(STARTER_PRODUCTS)
  const creditEnabled = sellerMode === 'wholesale_seller'

  useEffect(() => {
    const settings = setupQuery.data?.settings
    if (!settings) return
    setSellerMode(settings.store_type === 'wholesale_seller' || settings.store_type === 'retail_seller' ? settings.store_type : 'online_seller')
    setStockHoldMinutes(settings.stock_hold_minutes ?? 15)
    setLowStockThreshold(settings.low_stock_threshold ?? 5)
    setPaymentModes(settings.payment_modes?.length ? settings.payment_modes : ['cash', 'upi', 'cod'])
    setDeliveryModes(settings.delivery_modes?.length ? settings.delivery_modes : ['pickup', 'local_delivery'])
    setDeliveryAreas((settings.delivery_areas?.areas ?? []).join(', '))
    setDefaultCreditLimit(settings.credit_defaults?.default_limit ?? 1000)
    setDefaultCreditDueDays(settings.credit_defaults?.due_days ?? 30)
    setHighValueApprovalAmount(settings.ai_guardrails?.high_value_approval_amount ?? 10000)
    setRequireCreditApproval(settings.ai_guardrails?.require_owner_approval_for_credit ?? true)
  }, [setupQuery.data?.settings])

  useEffect(() => {
    if (sellerMode === 'online_seller') {
      setPaymentModes((current) => current.filter((mode) => mode !== 'credit'))
      setDeliveryModes((current) => {
        const next = current.length ? current : ['local_delivery', 'courier']
        return next.includes('courier') ? next : [...next, 'courier']
      })
    }
    if (sellerMode === 'wholesale_seller') {
      setPaymentModes((current) => [...new Set([...current, 'cash', 'upi', 'credit'])])
    }
  }, [sellerMode])

  function updateProduct(index: number, patch: Partial<SellerSetupProductPayload>) {
    setProducts((current) => current.map((product, i) => (i === index ? { ...product, ...patch } : product)))
  }

  function removeProduct(index: number) {
    setProducts((current) => current.filter((_, i) => i !== index))
  }

  function addProduct() {
    setProducts((current) => [...current, { name: '', category: '', price: 0, cost_price: 0, stock_quantity: 0, sku: '' }])
  }

  function submit() {
    const starterProducts = products
      .map((product) => ({
        ...product,
        name: product.name.trim(),
        category: product.category?.trim(),
        sku: product.sku?.trim(),
        price: Number(product.price || 0),
        cost_price: Number(product.cost_price || 0),
        stock_quantity: Number(product.stock_quantity || 0),
      }))
      .filter((product) => product.name && product.price >= 0)

    completeSetup.mutate({
      store_type: sellerMode,
      enable_credit: creditEnabled,
      stock_hold_minutes: Number(stockHoldMinutes),
      low_stock_threshold: Number(lowStockThreshold),
      payment_modes: paymentModes,
      delivery_modes: deliveryModes,
      delivery_areas: deliveryAreas.split(',').map((area) => area.trim()).filter(Boolean),
      default_credit_limit: creditEnabled ? Number(defaultCreditLimit) : 0,
      default_credit_due_days: creditEnabled ? Number(defaultCreditDueDays) : 30,
      high_value_approval_amount: Number(highValueApprovalAmount),
      require_owner_approval_for_credit: creditEnabled ? requireCreditApproval : false,
      products: starterProducts,
    }, {
      onSuccess: () => router.push('/seller-os'),
    })
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-slate-950 p-5 text-white sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-slate-950">
                <PackagePlus className="h-6 w-6" />
              </div>
              <p className="mt-6 text-sm font-bold uppercase text-blue-200">Product seller setup</p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal">Prepare your AI store desk</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Add the rules your AI employee must follow for stock, payments, delivery and owner approval.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { icon: Clock, label: 'Stock hold safety', text: `${stockHoldMinutes} minute holds` },
                  {
                    icon: ShieldCheck,
                    label: 'Seller mode',
                    text: SELLER_MODES.find((mode) => mode.key === sellerMode)?.title ?? 'Product seller',
                  },
                  { icon: Truck, label: 'Delivery', text: deliveryModes.join(', ') || 'Not selected' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="rounded-md border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-200" />
                        <p className="text-sm font-bold">{item.label}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">{item.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {setupQuery.isLoading ? (
                <div className="flex min-h-[360px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Store rules</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      These settings protect sellers from wrong promises, double selling and unsafe actions.
                    </p>
                  </div>

                  <Card className="border-slate-200 p-4">
                    <h3 className="text-sm font-bold text-slate-950">Seller type</h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {SELLER_MODES.map((mode) => {
                        const active = sellerMode === mode.key
                        return (
                          <button
                            key={mode.key}
                            type="button"
                            onClick={() => setSellerMode(mode.key)}
                            className={`min-h-[112px] rounded-md border p-3 text-left transition-colors ${
                              active ? 'border-[#0066FF] bg-blue-50 text-slate-950' : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <p className="text-sm font-bold">{mode.title}</p>
                            <p className="mt-2 text-xs leading-5 text-slate-500">{mode.text}</p>
                            <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${
                              active ? 'bg-white text-[#0066FF]' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {mode.note}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-slate-200 p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <h3 className="text-sm font-bold text-slate-950">Stock control</h3>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="hold-minutes">Hold minutes</Label>
                          <Input
                            id="hold-minutes"
                            type="number"
                            min={1}
                            value={stockHoldMinutes}
                            onChange={(event) => setStockHoldMinutes(Number(event.target.value))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="low-stock">Low stock alert</Label>
                          <Input
                            id="low-stock"
                            type="number"
                            min={0}
                            value={lowStockThreshold}
                            onChange={(event) => setLowStockThreshold(Number(event.target.value))}
                          />
                        </div>
                      </div>
                    </Card>

                    <Card className="border-slate-200 p-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-700" />
                        <h3 className="text-sm font-bold text-slate-950">AI guardrails</h3>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="approval-amount">Approval above</Label>
                          <Input
                            id="approval-amount"
                            type="number"
                            min={0}
                            value={highValueApprovalAmount}
                            onChange={(event) => setHighValueApprovalAmount(Number(event.target.value))}
                          />
                        </div>
                        {creditEnabled ? (
                          <label className="flex items-center gap-2 self-end rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={requireCreditApproval}
                              onChange={(event) => setRequireCreditApproval(event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            Credit needs approval
                          </label>
                        ) : (
                          <div className="self-end rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                            Credit hidden for this seller
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-slate-200 p-4">
                      <h3 className="text-sm font-bold text-slate-950">Payments</h3>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {PAYMENT_MODES.map((mode) => {
                          const Icon = mode.icon
                          const active = paymentModes.includes(mode.key)
                          return (
                            <button
                              key={mode.key}
                              type="button"
                              onClick={() => setPaymentModes((current) => toggle(current, mode.key))}
                              className={`flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-bold ${
                                active ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]' : 'border-slate-200 bg-white text-slate-600'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {mode.label}
                            </button>
                          )
                        })}
                      </div>
                    </Card>

                    <Card className="border-slate-200 p-4">
                      <h3 className="text-sm font-bold text-slate-950">{creditEnabled ? 'Delivery and credit' : 'Delivery'}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {DELIVERY_MODES.map((mode) => {
                          const active = deliveryModes.includes(mode.key)
                          return (
                            <button
                              key={mode.key}
                              type="button"
                              onClick={() => setDeliveryModes((current) => toggle(current, mode.key))}
                              className={`rounded-md border px-3 py-2 text-sm font-bold ${
                                active ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-600'
                              }`}
                            >
                              {mode.label}
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="areas">Delivery areas</Label>
                          <Input
                            id="areas"
                            value={deliveryAreas}
                            onChange={(event) => setDeliveryAreas(event.target.value)}
                            placeholder="Kochi, Edappally, Kakkanad"
                          />
                        </div>
                        {creditEnabled ? (
                          <>
                            <div className="space-y-1.5">
                              <Label htmlFor="credit-limit">Default credit limit</Label>
                              <Input
                                id="credit-limit"
                                type="number"
                                min={0}
                                value={defaultCreditLimit}
                                onChange={(event) => setDefaultCreditLimit(Number(event.target.value))}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="credit-days">Due days</Label>
                              <Input
                                id="credit-days"
                                type="number"
                                min={1}
                                value={defaultCreditDueDays}
                                onChange={(event) => setDefaultCreditDueDays(Number(event.target.value))}
                              />
                            </div>
                          </>
                        ) : null}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Starter products</h2>
                <p className="mt-1 text-sm text-slate-500">Add a few products now. More can be imported from WhatsApp catalogue later.</p>
              </div>
              <Button type="button" variant="outline" className="gap-2 bg-white" onClick={addProduct}>
                <Plus className="h-4 w-4" />
                Add row
              </Button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-[820px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Price</th>
                    <th className="px-3 py-3">Cost</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="w-12 px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <Input
                          value={product.name}
                          onChange={(event) => updateProduct(index, { name: event.target.value })}
                          placeholder="Product name"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={product.category ?? ''}
                          onChange={(event) => updateProduct(index, { category: event.target.value })}
                          placeholder="Category"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={product.price}
                          onChange={(event) => updateProduct(index, { price: Number(event.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={product.cost_price ?? 0}
                          onChange={(event) => updateProduct(index, { cost_price: Number(event.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={product.stock_quantity}
                          onChange={(event) => updateProduct(index, { stock_quantity: Number(event.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={product.sku ?? ''}
                          onChange={(event) => updateProduct(index, { sku: event.target.value })}
                          placeholder="Optional"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)}>
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <aside className="space-y-4">
            <Card className="border-slate-200 p-4">
              <h2 className="text-lg font-bold text-slate-950">Already in system</h2>
              <div className="mt-3 space-y-3">
                {existingProducts.length ? existingProducts.map((product: any) => (
                  <div key={product.product_id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">{product.name}</p>
                      <p className="text-xs text-slate-500">Stock {product.stock_quantity ?? 0}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No products added yet.</p>
                )}
              </div>
            </Card>

            <Card className="border-slate-200 p-4">
              <h2 className="text-lg font-bold text-slate-950">Launch checklist</h2>
              <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                {[
                  'WhatsApp connected',
                  'Stock hold rule set',
                  'Payment modes selected',
                  creditEnabled ? 'Credit safety configured' : 'Credit hidden for this seller',
                  'Starter products added',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                onClick={submit}
                disabled={completeSetup.isPending}
                className="mt-5 w-full gap-2 bg-[#0066FF] hover:bg-[#0052CC]"
              >
                {completeSetup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Save and open Store Desk
              </Button>
            </Card>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  )
}
