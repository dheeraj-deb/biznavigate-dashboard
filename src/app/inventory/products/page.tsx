'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  SellerProductImportRow,
  SellerStockProduct,
  useAdjustSellerProductStock,
  useImportSellerProductsStock,
  useSellerProductsStock,
} from '@/hooks/use-seller-os'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'low_stock', label: 'Low stock' },
  { key: 'out_of_stock', label: 'Out' },
] as const

const STOCK_REASONS = [
  { value: 'new_purchase', label: 'New purchase' },
  { value: 'sale_correction', label: 'Sale correction' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'returned', label: 'Returned' },
  { value: 'manual_correction', label: 'Correction' },
]

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function stockLabel(product: SellerStockProduct) {
  if (product.stock_status === 'out_of_stock') return 'Out'
  if (product.stock_status === 'low_stock') return 'Low'
  if (product.stock_status === 'not_tracked') return 'Not tracked'
  return 'In stock'
}

function stockClass(product: SellerStockProduct) {
  if (product.stock_status === 'out_of_stock') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (product.stock_status === 'low_stock') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (product.stock_status === 'not_tracked') return 'bg-slate-50 text-slate-600 border-slate-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

function parseDelimited(text: string): SellerProductImportRow[] {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
  const headers = splitLine(lines[0], delimiter).map((header) => normaliseHeader(header))

  return lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = cells[index]?.trim() ?? ''
    })

    return {
      name: row.name || row.product_name || row.product || '',
      sku: row.sku || row.code || undefined,
      category: row.category || undefined,
      description: row.description || undefined,
      price: toNumber(row.price || row.selling_price || row.rate),
      cost_price: row.cost_price || row.cost ? toNumber(row.cost_price || row.cost) : undefined,
      stock_quantity: toInt(row.stock_quantity || row.stock || row.quantity || row.qty),
      image_url: row.image_url || row.image || undefined,
      is_active: row.is_active ? !['false', '0', 'no'].includes(row.is_active.toLowerCase()) : true,
    }
  })
}

function splitLine(line: string, delimiter: string) {
  if (delimiter !== ',') return line.split(delimiter)
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells.map((cell) => cell.replace(/^"|"$/g, ''))
}

function normaliseHeader(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function toNumber(value: string | number | undefined) {
  const parsed = Number(String(value ?? 0).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function toInt(value: string | number | undefined) {
  return Math.max(0, Math.floor(toNumber(value)))
}

function ProductRow({
  product,
  onAdjust,
}: {
  product: SellerStockProduct
  onAdjust: (product: SellerStockProduct) => void
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="py-3 pl-4 pr-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            {product.primary_image_url ? (
              <img src={product.primary_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{product.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {[product.sku, product.category].filter(Boolean).join(' / ') || 'No SKU'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-sm font-semibold text-slate-900">{money(product.price)}</td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${stockClass(product)}`}>
          {stockLabel(product)}
        </span>
      </td>
      <td className="px-3 py-3 text-sm text-slate-700">
        <span className="font-semibold text-slate-950">{product.available_stock}</span>
        <span className="text-slate-400"> / {product.stock_quantity}</span>
      </td>
      <td className="px-3 py-3 text-sm text-slate-600">{product.reserved_stock}</td>
      <td className="px-3 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => onAdjust(product)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
            title="Update stock"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <Link
            href={`/inventory/products/${product.product_id}/edit`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
            title="Edit product"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  )
}

function ImportPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const importProducts = useImportSellerProductsStock()
  const [rows, setRows] = useState<SellerProductImportRow[]>([])
  const [paste, setPaste] = useState('')

  if (!open) return null

  const loadText = (text: string) => {
    const parsed = parseDelimited(text)
    setRows(parsed)
    if (!parsed.length) toast.error('No product rows found')
  }

  const submit = () => {
    if (!rows.length) {
      toast.error('Add product rows first')
      return
    }
    importProducts.mutate(
      { source: 'csv', products: rows },
      {
        onSuccess: () => {
          setRows([])
          setPaste('')
          onClose()
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Import products</h2>
            <p className="text-xs text-slate-500">name, sku, category, price, stock_quantity, cost_price, image_url</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
              <FileUp className="h-4 w-4" />
              CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  file.text().then(loadText)
                }}
              />
            </label>
            <button
              onClick={() => loadText(paste)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
            >
              Paste rows
            </button>
          </div>
          <textarea
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            rows={6}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="name,sku,category,price,stock_quantity,cost_price"
          />
          <div className="rounded-md border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-sm font-semibold text-slate-800">{rows.length} rows ready</span>
              {rows.length > 0 && <button onClick={() => setRows([])} className="text-xs font-semibold text-slate-500">Clear</button>}
            </div>
            <div className="max-h-52 overflow-auto">
              {rows.slice(0, 8).map((row, index) => (
                <div key={`${row.sku || row.name}-${index}`} className="grid grid-cols-[1fr_90px_80px] gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0">
                  <span className="truncate font-medium text-slate-900">{row.name || 'No name'}</span>
                  <span className="text-slate-600">{money(row.price || 0)}</span>
                  <span className="text-right text-slate-600">{row.stock_quantity ?? 0}</span>
                </div>
              ))}
              {!rows.length && <p className="px-3 py-8 text-center text-sm text-slate-500">No rows loaded</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button
            onClick={submit}
            disabled={!rows.length || importProducts.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {importProducts.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Import
          </button>
        </div>
      </div>
    </div>
  )
}

function StockPanel({
  product,
  onClose,
}: {
  product: SellerStockProduct | null
  onClose: () => void
}) {
  const adjustStock = useAdjustSellerProductStock()
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'reduce' | 'set'>('add')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('new_purchase')
  const [note, setNote] = useState('')

  if (!product) return null

  const submit = () => {
    const parsedQuantity = Math.max(0, Math.floor(Number(quantity)))
    if ((adjustmentType !== 'set' && parsedQuantity <= 0) || Number.isNaN(parsedQuantity)) {
      toast.error('Enter a valid quantity')
      return
    }
    adjustStock.mutate(
      {
        product_id: product.product_id,
        adjustment_type: adjustmentType,
        quantity: parsedQuantity,
        reason,
        note,
      },
      {
        onSuccess: () => {
          setQuantity('')
          setNote('')
          onClose()
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-950">{product.name}</h2>
            <p className="text-xs text-slate-500">Available {product.available_stock}, held {product.reserved_stock}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'add', label: 'Add', icon: ArrowUp },
              { key: 'reduce', label: 'Reduce', icon: ArrowDown },
              { key: 'set', label: 'Set exact', icon: CheckCircle2 },
            ].map((item) => {
              const Icon = item.icon
              const active = adjustmentType === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setAdjustmentType(item.key as any)}
                  className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
                    active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-blue-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Quantity</span>
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                type="number"
                min="0"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Reason</span>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
              >
                {STOCK_REASONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button
            onClick={submit}
            disabled={adjustStock.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {adjustStock.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]['key']>('all')
  const [importOpen, setImportOpen] = useState(false)
  const [stockProduct, setStockProduct] = useState<SellerStockProduct | null>(null)
  const query = useSellerProductsStock({ page, limit: 50, search, status })

  const data = query.data
  const products = data?.products ?? []
  const summary = data?.summary
  const canPrev = (data?.pagination.page ?? page) > 1
  const canNext = (data?.pagination.page ?? page) < (data?.pagination.total_pages ?? 1)

  const visibleSummary = useMemo(() => [
    { label: 'Products', value: summary?.total_products ?? 0, icon: Package, tone: 'text-slate-950' },
    { label: 'Low stock', value: summary?.low_stock ?? 0, icon: AlertTriangle, tone: 'text-amber-700' },
    { label: 'Out', value: summary?.out_of_stock ?? 0, icon: X, tone: 'text-rose-700' },
    { label: 'Held', value: summary?.active_holds ?? 0, icon: CheckCircle2, tone: 'text-blue-700' },
  ], [summary])

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Products & Stock</h1>
            <p className="mt-1 text-sm text-slate-500">Live stock used by WhatsApp AI, counter sale and payment desk.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => query.refetch()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
            >
              <RefreshCw className={`h-4 w-4 ${query.isRefetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
            >
              <FileUp className="h-4 w-4" />
              Import
            </button>
            <Link
              href="/inventory/add"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleSummary.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">{item.label}</span>
                  <Icon className={`h-4 w-4 ${item.tone}`} />
                </div>
                <p className={`mt-2 text-2xl font-bold ${item.tone}`}>{item.value}</p>
              </div>
            )
          })}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setPage(1)
                  setSearch(event.target.value)
                }}
                className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                placeholder="Search product, SKU or category"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {STATUS_FILTERS.map((filter) => {
                const active = status === filter.key
                return (
                  <button
                    key={filter.key}
                    onClick={() => {
                      setPage(1)
                      setStatus(filter.key)
                    }}
                    className={`rounded-md px-3 py-2 text-sm font-semibold ${
                      active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-3 pl-4 pr-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Price</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Available / total</th>
                  <th className="px-3 py-3 font-semibold">Held</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-4 pl-4 pr-3" colSpan={6}>
                        <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : products.length ? (
                  products.map((product) => (
                    <ProductRow key={product.product_id} product={product} onAdjust={setStockProduct} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Package className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-800">No products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              Page {data?.pagination.page ?? page} of {data?.pagination.total_pages ?? 1}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canPrev}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={!canNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-950">Recent stock changes</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(data?.recent_adjustments ?? []).length ? (
              data!.recent_adjustments.map((item) => (
                <div key={item.adjustment_id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.product_name}</p>
                    <p className="text-xs text-slate-500">{item.reason.replace(/_/g, ' ')} / {item.source}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${item.quantity_change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {item.quantity_change >= 0 ? '+' : ''}{item.quantity_change}
                    </p>
                    <p className="text-xs text-slate-500">{item.quantity_before} to {item.quantity_after}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No stock changes yet</p>
            )}
          </div>
        </div>
      </div>

      <ImportPanel open={importOpen} onClose={() => setImportOpen(false)} />
      <StockPanel product={stockProduct} onClose={() => setStockProduct(null)} />
    </DashboardLayout>
  )
}
