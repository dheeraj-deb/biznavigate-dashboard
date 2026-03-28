'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  Plus, Search, Package, AlertTriangle, AlertCircle,
  Pencil, Trash2, Loader2, RefreshCw, IndianRupee,
  CheckCircle2, XCircle, Box,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  product_id?: string
  id?: string
  name: string
  description?: string
  price: number | string
  sku?: string
  brand?: string
  category?: string
  condition?: string
  weight?: number | string
  dimensions?: string
  track_inventory?: boolean
  stock_quantity?: number
  low_stock_threshold?: number
  is_active?: boolean
  primary_image_url?: string
  images?: string[]
  metadata?: Record<string, unknown>
  created_at?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENT = '#0066FF'

function pid(p: Product) { return p.product_id ?? p.id ?? '' }

function fmt(n: number | string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n))
}

function stockStatus(p: Product): 'out' | 'low' | 'ok' | 'untracked' {
  if (!p.track_inventory) return 'untracked'
  const qty = p.stock_quantity ?? 0
  const threshold = p.low_stock_threshold ?? 10
  if (qty === 0) return 'out'
  if (qty <= threshold) return 'low'
  return 'ok'
}


// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0">
      <div className="h-12 w-12 rounded-xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-40 rounded bg-slate-200" />
        <div className="h-3 w-64 rounded bg-slate-100" />
      </div>
      <div className="h-6 w-16 rounded-full bg-slate-200" />
      <div className="h-6 w-20 rounded-full bg-slate-100" />
    </div>
  )
}

// ── Product Row ───────────────────────────────────────────────────────────────

function ProductRow({ product, onDelete }: { product: Product; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const stock = stockStatus(product)

  const handleDelete = async () => {
    if (!confirm(`Delete "${product.name}"?`)) return
    setDeleting(true)
    try { await onDelete(pid(product)) } finally { setDeleting(false) }
  }

  return (
    <div className="group flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">

      {/* Image or placeholder */}
      <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
        {product.primary_image_url ? (
          <img src={product.primary_image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-5 w-5 text-slate-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-[13px] text-[#4B4B4B] truncate">{product.name}</p>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${product.is_active !== false ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {product.is_active !== false ? '● Active' : '○ Inactive'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#6E6E6E]">
          {(product.brand ?? product.metadata?.brand as string) && (
            <span>{product.brand ?? product.metadata?.brand as string}</span>
          )}
          {product.category && <span>{product.category}</span>}
        </div>
      </div>

      {/* Price */}
      <div className="shrink-0 text-right">
        <p className="font-bold text-[13px] text-[#4B4B4B] flex items-center gap-0.5">
          <IndianRupee className="h-3 w-3 text-[#0066FF]" />
          {fmt(product.price).replace('₹', '')}
        </p>
      </div>

      {/* Stock badge */}
      <div className="shrink-0">
        {stock === 'untracked' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500">
            <Box className="h-3 w-3" /> No tracking
          </span>
        ) : stock === 'out' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600">
            <XCircle className="h-3 w-3" /> Out of stock
          </span>
        ) : stock === 'low' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-2.5 py-1 text-[11px] font-bold text-yellow-700">
            <AlertTriangle className="h-3 w-3" /> Low · {product.stock_quantity}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[11px] font-bold text-green-700">
            <CheckCircle2 className="h-3 w-3" /> {product.stock_quantity} in stock
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`/inventory/products/${pid(product)}/edit`}
          className="flex items-center gap-1 rounded-full border border-[#E5E5E5] px-2.5 py-1.5 text-[11px] font-bold text-[#4B4B4B] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
        >
          <Pencil className="h-3 w-3" /> Edit
        </a>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 rounded-full border border-[#E5E5E5] px-2.5 py-1.5 text-[11px] font-bold text-[#4B4B4B] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          Delete
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'low_stock', label: 'Low Stock' },
  { key: 'out_of_stock', label: 'Out of Stock' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await apiClient.get('/products', { params: { limit: 500 } })
      const inner = res.data as { products?: Product[] } | null
      const list: Product[] = inner?.products ?? []
      setProducts(list)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/products/${id}`)
      setProducts(p => p.filter(x => pid(x) !== id))
      toast.success('Product deleted')
    } catch {
      toast.error('Failed to delete product')
    }
  }

  // Stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.is_active !== false).length,
    lowStock: products.filter(p => p.track_inventory && (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 10)).length,
    outOfStock: products.filter(p => p.track_inventory && (p.stock_quantity ?? 0) === 0).length,
  }

  // Filter
  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      (p.metadata?.brand as string)?.toLowerCase().includes(q)

    const matchStatus =
      statusFilter === 'all' ? true
      : statusFilter === 'active' ? p.is_active !== false
      : statusFilter === 'inactive' ? p.is_active === false
      : statusFilter === 'low_stock' ? (p.track_inventory && (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 10))
      : statusFilter === 'out_of_stock' ? (p.track_inventory && (p.stock_quantity ?? 0) === 0)
      : true

    return matchSearch && matchStatus
  })

  return (
    <DashboardLayout>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.012)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-70" />

      <div className="relative max-w-5xl mx-auto pb-12 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                <Package className="h-3 w-3" />
                Inventory
              </span>
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#4B4B4B]">Products</h1>
            <p className="text-[13px] text-[#6E6E6E] mt-0.5">Manage your physical product inventory</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-4 py-2.5 text-[13px] font-bold text-[#4B4B4B] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="/inventory/add"
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`, boxShadow: `0 6px 20px ${ACCENT}40` }}
            >
              <Plus className="h-4 w-4" /> Add Product
            </a>
          </div>
        </div>

        {/* ── Stats strip ── */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Products', value: stats.total, color: '#4B4B4B', icon: Package },
              { label: 'Active', value: stats.active, color: '#16A34A', icon: CheckCircle2 },
              { label: 'Low Stock', value: stats.lowStock, color: '#D97706', icon: AlertTriangle },
              { label: 'Out of Stock', value: stats.outOfStock, color: '#DC2626', icon: AlertCircle },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                    <p className="text-[12px] text-[#6E6E6E] font-medium">{s.label}</p>
                  </div>
                  <p className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Search + filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#989898]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, SKU, brand, or category…"
              className="h-10 w-full rounded-full border border-[#E5E5E5] bg-white pl-9 pr-4 text-[13px] text-[#4B4B4B] placeholder:text-[#989898] focus:outline-none focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex-shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold transition-all ${
                  statusFilter === f.key
                    ? 'text-white shadow-sm'
                    : 'border border-[#E5E5E5] text-[#6E6E6E] bg-white hover:border-[#0066FF] hover:text-[#0066FF]'
                }`}
                style={statusFilter === f.key ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">

          {/* Table header */}
          <div className="hidden md:flex items-center gap-4 px-5 py-3 bg-[#F9F9F9] border-b border-slate-100">
            <div className="w-12 shrink-0" />
            <p className="flex-1 text-[11px] font-bold text-[#989898] uppercase tracking-wider">Product</p>
            <p className="shrink-0 text-[11px] font-bold text-[#989898] uppercase tracking-wider w-24 text-right">Price</p>
            <p className="shrink-0 text-[11px] font-bold text-[#989898] uppercase tracking-wider w-32">Stock</p>
            <div className="w-28 shrink-0" />
          </div>

          {loading ? (
            <div>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${ACCENT}10` }}>
                <Package className="h-7 w-7" style={{ color: ACCENT }} />
              </div>
              <p className="font-bold text-[#4B4B4B]">
                {search || statusFilter !== 'all' ? 'No products match your filter' : 'No products yet'}
              </p>
              <p className="text-[13px] text-[#6E6E6E]">
                {search || statusFilter !== 'all' ? 'Try clearing your search or filter' : 'Click "Add Product" to add your first product'}
              </p>
              {!search && statusFilter === 'all' && (
                <a
                  href="/inventory/add"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white mt-2"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` }}
                >
                  <Plus className="h-4 w-4" /> Add Product
                </a>
              )}
            </div>
          ) : (
            <div>
              {filtered.map(p => (
                <ProductRow key={pid(p)} product={p} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="text-[12px] text-[#989898] text-center">
            Showing {filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        )}

      </div>
    </DashboardLayout>
  )
}
