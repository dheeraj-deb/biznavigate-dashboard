'use client'

import { useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  useCatalog, useCatalogConfig, useCreateCatalogItem, useUpdateCatalogItem,
  useDeleteCatalogItem, useUpdateCatalogStock, parsePrice,
  type CatalogItem, type ItemType,
} from '@/hooks/use-catalog'
import {
  Plus, Search, Package, SlidersHorizontal, Pencil, Trash2,
  Loader2, RefreshCw, ChevronDown, X, IndianRupee, Tag,
  Box, Hotel, Activity, Wrench, Image as ImageIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ItemType, string> = {
  physical_product: 'Product',
  accommodation: 'Accommodation',
  activity: 'Activity',
  service: 'Service',
}

const TYPE_ICONS: Record<ItemType, React.ElementType> = {
  physical_product: Package,
  accommodation: Hotel,
  activity: Activity,
  service: Wrench,
}

const TYPE_COLORS: Record<ItemType, string> = {
  physical_product: 'bg-blue-50 text-blue-700 border-blue-200',
  accommodation: 'bg-purple-50 text-purple-700 border-purple-200',
  activity: 'bg-green-50 text-green-700 border-green-200',
  service: 'bg-orange-50 text-orange-700 border-orange-200',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

// ── Item Card ─────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onEdit,
  onDelete,
  onStockUpdate,
}: {
  item: CatalogItem
  onEdit: (item: CatalogItem) => void
  onDelete: (id: string) => void
  onStockUpdate: (id: string, qty: number) => void
}) {
  const [stockInput, setStockInput] = useState('')
  const [editingStock, setEditingStock] = useState(false)
  const Icon = TYPE_ICONS[item.item_type] ?? Package
  const price = parsePrice(item.base_price)
  const hasStock = item.stock_quantity !== null

  return (
    <Card className="group relative overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-md">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
          {item.primary_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.primary_image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Icon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${TYPE_COLORS[item.item_type]}`}>
              <Icon className="h-2.5 w-2.5" />
              {TYPE_LABELS[item.item_type]}
            </span>
          </div>
          {!item.is_active && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">Inactive</span>
            </div>
          )}
          {/* Actions on hover */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
              <Pencil className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
            </button>
            <button onClick={() => onDelete(item.item_id)} className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
          {item.category && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Tag className="h-2.5 w-2.5" />{item.category}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-0.5">
              <IndianRupee className="h-3 w-3" />{fmt(price).replace('₹', '')}
            </p>
            {hasStock && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                item.stock_quantity === 0 ? 'bg-red-50 text-red-600' :
                (item.stock_quantity ?? 0) <= 5 ? 'bg-yellow-50 text-yellow-600' :
                'bg-green-50 text-green-600'
              }`}>
                {item.stock_quantity} in stock
              </span>
            )}
          </div>
          {hasStock && (
            <div className="mt-2 flex items-center gap-1">
              {editingStock ? (
                <>
                  <Input
                    type="number"
                    value={stockInput}
                    onChange={e => setStockInput(e.target.value)}
                    className="h-6 text-xs w-16 px-1"
                    placeholder="qty"
                    autoFocus
                  />
                  <button
                    onClick={() => { onStockUpdate(item.item_id, Number(stockInput)); setEditingStock(false) }}
                    className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >OK</button>
                  <button onClick={() => setEditingStock(false)} className="text-[10px] px-1 py-1 text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>
                </>
              ) : (
                <button onClick={() => { setStockInput(String(item.stock_quantity ?? 0)); setEditingStock(true) }}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                  <Box className="h-2.5 w-2.5" />Update stock
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Item Form Modal ───────────────────────────────────────────────────────────

interface ItemFormData {
  name: string
  description: string
  item_type: ItemType
  category: string
  base_price: string
  compare_price: string
  stock_quantity: string
  sku: string
  primary_image_url: string
  is_active: boolean
  attributes: Record<string, string | boolean | number>
}

const BLANK_FORM: ItemFormData = {
  name: '', description: '', item_type: 'physical_product',
  category: '', base_price: '', compare_price: '', stock_quantity: '',
  sku: '', primary_image_url: '', is_active: true, attributes: {},
}

function ItemModal({
  open,
  editing,
  allowedTypes,
  attributeSchemas,
  categories,
  onClose,
  onSave,
}: {
  open: boolean
  editing: CatalogItem | null
  allowedTypes: ItemType[]
  attributeSchemas: Record<string, any>
  categories: string[]
  onClose: () => void
  onSave: (data: ItemFormData) => Promise<void>
}) {
  const [form, setForm] = useState<ItemFormData>(BLANK_FORM)
  const [saving, setSaving] = useState(false)

  // Populate form when editing changes
  const prevEditing = editing?.item_id
  if (open && editing && editing.item_id !== prevEditing) {
    // Will be set via useEffect below — done with direct state to avoid double render
  }

  // Reset on open
  const handleOpen = useCallback(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description ?? '',
        item_type: editing.item_type,
        category: editing.category ?? '',
        base_price: String(parsePrice(editing.base_price)),
        compare_price: editing.compare_price ? String(parsePrice(editing.compare_price)) : '',
        stock_quantity: editing.stock_quantity !== null ? String(editing.stock_quantity) : '',
        sku: editing.sku ?? '',
        primary_image_url: editing.primary_image_url ?? '',
        is_active: editing.is_active,
        attributes: Object.fromEntries(
          Object.entries(editing.attributes ?? {}).map(([k, v]) => [k, String(v)])
        ),
      })
    } else {
      setForm({ ...BLANK_FORM, item_type: allowedTypes[0] ?? 'physical_product' })
    }
  }, [editing, allowedTypes])

  // Call handleOpen when modal opens
  if (open && form.name === '' && !editing) {
    setForm(prev => ({ ...prev, item_type: allowedTypes[0] ?? 'physical_product' }))
  }

  const set = (key: keyof ItemFormData, val: any) => setForm(prev => ({ ...prev, [key]: val }))
  const setAttr = (key: string, val: any) => setForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: val } }))

  const schema = attributeSchemas[form.item_type] ?? {}
  const schemaFields = Object.entries(schema) as [string, any][]

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.base_price) { toast.error('Price is required'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Item' : 'Add Catalog Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type selector */}
          {!editing && (
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item Type</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {allowedTypes.map(t => {
                  const Icon = TYPE_ICONS[t]
                  return (
                    <button
                      key={t}
                      onClick={() => set('item_type', t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        form.item_type === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-900 text-gray-600 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {TYPE_LABELS[t]}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Item name" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description" rows={2} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Price (INR) *</Label>
              <Input type="number" value={form.base_price} onChange={e => set('base_price', e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Compare Price</Label>
              <Input type="number" value={form.compare_price} onChange={e => set('compare_price', e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Input value={form.category} onChange={e => set('category', e.target.value)} list="category-suggestions" placeholder="e.g. Electronics" className="mt-1" />
              <datalist id="category-suggestions">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <Label className="text-xs">SKU</Label>
              <Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="SKU-001" className="mt-1" />
            </div>
            {form.item_type === 'physical_product' && (
              <div>
                <Label className="text-xs">Stock Quantity</Label>
                <Input type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} placeholder="Leave blank = unlimited" className="mt-1" />
              </div>
            )}
            <div className={form.item_type === 'physical_product' ? '' : 'col-span-2'}>
              <Label className="text-xs">Image URL</Label>
              <Input value={form.primary_image_url} onChange={e => set('primary_image_url', e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
          </div>

          {/* Dynamic attribute fields from config */}
          {schemaFields.length > 0 && (
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {TYPE_LABELS[form.item_type]} Details
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {schemaFields.map(([key, field]) => (
                  <div key={key} className={field.type === 'string' && !field.options ? 'col-span-2' : ''}>
                    <Label className="text-xs">{field.label}{field.required ? ' *' : ''}</Label>
                    {field.type === 'boolean' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          id={`attr-${key}`}
                          checked={Boolean(form.attributes[key])}
                          onChange={e => setAttr(key, e.target.checked)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`attr-${key}`} className="text-sm text-gray-600">{field.label}</label>
                      </div>
                    ) : field.options ? (
                      <Select value={String(form.attributes[key] ?? '')} onValueChange={v => setAttr(key, v)}>
                        <SelectTrigger className="mt-1 text-sm h-9"><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'number' ? 'number' : field.type === 'time' ? 'time' : 'text'}
                        value={String(form.attributes[key] ?? '')}
                        onChange={e => setAttr(key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="mt-1 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="h-4 w-4" />
            <Label htmlFor="is_active" className="text-sm cursor-pointer">Active (visible to customers)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {editing ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ALL_TYPES: ItemType[] = ['physical_product', 'accommodation', 'activity', 'service']

export default function CatalogPage() {
  const { user } = useAuthStore()
  const businessId = user?.business_id

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all')
  const [page] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)

  // Data
  const { data: configData } = useCatalogConfig(businessId)
  const { data: catalogData, isLoading, refetch } = useCatalog({
    businessId,
    item_type: typeFilter === 'all' ? undefined : typeFilter,
    search: search || undefined,
    page,
    limit: 50,
  })

  const createItem = useCreateCatalogItem()
  const updateItem = useUpdateCatalogItem()
  const deleteItem = useDeleteCatalogItem()
  const updateStock = useUpdateCatalogStock()

  const items = catalogData?.data ?? []
  const allowedTypes: ItemType[] = configData?.allowed_item_types ?? ALL_TYPES
  const attributeSchemas = configData?.attribute_schemas ?? {}

  // Derive unique categories from loaded items
  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[]

  const openAdd = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: CatalogItem) => { setEditingItem(item); setModalOpen(true) }

  const handleSave = async (form: any) => {
    const payload = {
      item_type: form.item_type as ItemType,
      name: form.name,
      description: form.description || undefined,
      category: form.category || undefined,
      base_price: parseFloat(form.base_price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : undefined,
      stock_quantity: form.item_type === 'physical_product' && form.stock_quantity !== ''
        ? parseInt(form.stock_quantity)
        : null,
      sku: form.sku || undefined,
      primary_image_url: form.primary_image_url || undefined,
      is_active: form.is_active,
      attributes: form.attributes,
    }

    if (editingItem) {
      await updateItem.mutateAsync({ itemId: editingItem.item_id, data: payload })
    } else {
      await createItem.mutateAsync(payload)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    await deleteItem.mutateAsync(id)
  }

  const handleStockUpdate = async (id: string, qty: number) => {
    await updateStock.mutateAsync({ itemId: id, quantity: qty })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Catalog</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {catalogData?.meta.total ?? 0} items across all types
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />Add Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search catalog..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                typeFilter === 'all' ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-900 text-gray-600 border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              All Types
            </button>
            {allowedTypes.map(t => {
              const Icon = TYPE_ICONS[t]
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    typeFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 text-gray-600 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {TYPE_LABELS[t]}
                </button>
              )
            })}
            <button onClick={() => refetch()} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No items found</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {search || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first catalog item to get started'}
            </p>
            {!search && typeFilter === 'all' && (
              <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" />Add First Item</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map(item => (
              <ItemCard
                key={item.item_id}
                item={item}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStockUpdate={handleStockUpdate}
              />
            ))}
          </div>
        )}
      </div>

      <ItemModal
        open={modalOpen}
        editing={editingItem}
        allowedTypes={allowedTypes}
        attributeSchemas={attributeSchemas}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </DashboardLayout>
  )
}
