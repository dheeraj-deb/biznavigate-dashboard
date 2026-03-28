'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useProducts, useDeleteProduct } from '@/hooks/use-products'
import { useAuthStore } from '@/store/auth-store'
import { WhatsAppCatalogPanel } from '@/components/whatsapp/whatsapp-catalog-panel'
import { useToggleProductInCatalog } from '@/hooks/use-whatsapp-catalog'

// Fallback business ID from seed data
const FALLBACK_BUSINESS_ID = 'dd8ae5a1-cab4-4041-849d-e108d74490d3'

export default function WhatsAppCatalogPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  const businessId = user?.business_id || FALLBACK_BUSINESS_ID

  // Fetch products from backend
  const { data: productsResponse, isLoading, error, refetch } = useProducts(1, 100, businessId)
  const deleteProduct = useDeleteProduct()
  const toggleCatalog = useToggleProductInCatalog()

  const products = productsResponse?.data || []

  // Filter to show only catalog products and apply search/status filters
  const filteredProducts = products.filter((product: any) => {
    // Only show products that are in the catalog or can be added
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'in_catalog' && product.in_whatsapp_catalog) ||
                         (statusFilter === 'not_in_catalog' && !product.in_whatsapp_catalog) ||
                         (statusFilter === 'synced' && product.whatsapp_sync_status === 'synced') ||
                         (statusFilter === 'pending' && product.whatsapp_sync_status === 'pending') ||
                         (statusFilter === 'failed' && product.whatsapp_sync_status === 'failed')

    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: products.length,
    inCatalog: products.filter((p: any) => p.in_whatsapp_catalog).length,
    synced: products.filter((p: any) => p.whatsapp_sync_status === 'synced').length,
    pending: products.filter((p: any) => p.whatsapp_sync_status === 'pending').length,
    failed: products.filter((p: any) => p.whatsapp_sync_status === 'failed').length,
  }

  // Handle catalog toggle
  const handleCatalogToggle = (productId: string, inCatalog: boolean) => {
    toggleCatalog.mutate({ businessId, productId, inCatalog })
  }

  // Handle select product
  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map((p: any) => p.product_id || p.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  // Handle delete
  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to remove this product from the catalog?')) {
      try {
        await handleCatalogToggle(productId, false)
        refetch()
      } catch (error) {
        console.error('Failed to remove product from catalog:', error)
      }
    }
  }

  // Get sync status badge
  const getSyncStatusBadge = (product: any) => {
    if (!product.in_whatsapp_catalog) {
      return (
        <Badge variant="secondary" className="text-xs">
          Not in Catalog
        </Badge>
      )
    }

    const status = product.whatsapp_sync_status || 'not_synced'
    const statusConfig = {
      synced: {
        label: 'Synced',
        icon: CheckCircle2,
        color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
      },
      pending: {
        label: 'Pending Sync',
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
      },
      syncing: {
        label: 'Syncing...',
        icon: RefreshCw,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
      },
      failed: {
        label: 'Sync Failed',
        icon: XCircle,
        color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
      },
      not_synced: {
        label: 'Not Synced',
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400'
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_synced
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
        <Icon className={`h-3 w-3 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        {config.label}
      </span>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-green-600" />
            <p className="mt-4 text-muted-foreground">Loading WhatsApp catalog...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <MessageSquare className="h-10 w-10 text-green-600 dark:text-green-400" />
              WhatsApp Catalog
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Manage products synced to WhatsApp Commerce Manager
            </p>
          </div>
        </div>

        {/* WhatsApp Catalog Panel */}
        <WhatsAppCatalogPanel
          businessId={businessId}
          selectedProductIds={Array.from(selectedProducts)}
        />

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Products</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900">
                <Package className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Available products</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">In Catalog</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.inCatalog}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Added to catalog</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Synced</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.synced}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Successfully synced</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Pending</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-950">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Awaiting sync</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Failed</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Sync errors</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Products</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Name, SKU, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sync Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="in_catalog">In Catalog</SelectItem>
                    <SelectItem value="not_in_catalog">Not in Catalog</SelectItem>
                    <SelectItem value="synced">Synced</SelectItem>
                    <SelectItem value="pending">Pending Sync</SelectItem>
                    <SelectItem value="failed">Failed Sync</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedProducts.size > 0 && selectedProducts.size === filteredProducts.length}
                  onCheckedChange={handleSelectAll}
                  className="h-5 w-5"
                />
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Catalog Products</CardTitle>
                  <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                    Showing {filteredProducts.length} of {products.length} products
                    {selectedProducts.size > 0 && (
                      <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                        ({selectedProducts.size} selected)
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No products found matching your filters'
                    : 'No products in catalog yet. Add products from the Products page.'}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/inventory/products')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Go to Products
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product: any) => {
                  const productId = product.product_id || product.id
                  const isSelected = selectedProducts.has(productId)

                  return (
                    <div
                      key={productId}
                      className="group flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md hover:shadow-green-500/10 transition-all duration-200 bg-white dark:bg-gray-950"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectProduct(productId, !!checked)}
                          className="h-5 w-5"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/20">
                              <Package className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                  {product.name}
                                </span>
                                {getSyncStatusBadge(product)}
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                                {product.sku && (
                                  <div className="flex items-center gap-1.5">
                                    <Package className="h-4 w-4 text-green-500" />
                                    <span className="font-mono">{product.sku}</span>
                                  </div>
                                )}
                                {product.category && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-green-500">•</span>
                                    <span>{product.category}</span>
                                  </div>
                                )}
                                {product.price && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      {formatCurrency(Number(product.price))}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`catalog-${productId}`}
                                    checked={product.in_whatsapp_catalog || false}
                                    onCheckedChange={(checked) => handleCatalogToggle(productId, !!checked)}
                                    className="h-4 w-4"
                                  />
                                  <label
                                    htmlFor={`catalog-${productId}`}
                                    className="text-xs font-medium text-green-600 dark:text-green-400 cursor-pointer"
                                  >
                                    In Catalog
                                  </label>
                                </div>
                              </div>
                              {product.whatsapp_sync_error && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{product.whatsapp_sync_error}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600"
                          onClick={() => router.push(`/inventory/products/${productId}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600"
                          onClick={() => router.push(`/inventory/products/${productId}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                          onClick={() => handleDelete(productId)}
                          disabled={toggleCatalog.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
