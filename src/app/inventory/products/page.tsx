'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
  GraduationCap,
  Hotel,
  Calendar,
  Briefcase,
  Eye,
  AlertTriangle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useProducts, useDeleteProduct } from '@/hooks/use-products'
import { useAuthStore } from '@/store/auth-store'

// Product type configuration (matching backend validation)
const PRODUCT_TYPES = {
  physical: {
    label: 'Physical Product',
    icon: Package,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
    description: 'Physical goods with inventory'
  },
  course: {
    label: 'Course',
    icon: GraduationCap,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400',
    description: 'Educational courses and programs'
  },
  event: {
    label: 'Event',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
    description: 'Events, conferences, shows'
  },
  service: {
    label: 'Service',
    icon: Briefcase,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400',
    description: 'Professional services'
  }
}

// Fallback business ID from seed data
const FALLBACK_BUSINESS_ID = 'dd8ae5a1-cab4-4041-849d-e108d74490d3'

export default function ProductsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const businessId = user?.business_id || FALLBACK_BUSINESS_ID

  // Fetch products from backend
  const { data: productsResponse, isLoading, error, refetch } = useProducts(1, 100, businessId)
  const deleteProduct = useDeleteProduct()

  const products = productsResponse?.data || []

  console.log('Fetched products:', productsResponse)

  // Filter products
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || product.product_type === typeFilter
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && product.is_active) ||
                         (statusFilter === 'inactive' && !product.is_active) ||
                         (statusFilter === 'low_stock' && product.track_inventory && product.stock_quantity < 10)
    return matchesSearch && matchesType && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: products.length,
    active: products.filter((p: any) => p.is_active).length,
    lowStock: products.filter((p: any) => p.track_inventory && p.stock_quantity < 10).length,
    outOfStock: products.filter((p: any) => p.track_inventory && p.stock_quantity === 0).length,
  }

  // Handle delete
  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct.mutateAsync(productId)
        refetch()
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  // Get product type config
  const getProductTypeConfig = (type: string) => {
    return PRODUCT_TYPES[type as keyof typeof PRODUCT_TYPES] || {
      label: type,
      icon: Package,
      color: 'bg-gray-100 text-gray-800',
      description: ''
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-muted-foreground">Loading products...</p>
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
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Products</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Manage products, courses, services, and more
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={() => router.push('/inventory/products/bulk-upload')} className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button onClick={() => router.push('/inventory/products/new')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to connect to backend API. Please ensure backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Products</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stats.active} active</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Low Stock</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-950">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lowStock}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Below minimum level</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Out of Stock</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.outOfStock}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Needs restocking</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Product Types</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950">
                <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {new Set(products.map((p: any) => p.product_type)).size}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Different categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
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
                <label className="text-sm font-medium">Product Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(PRODUCT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
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
                    setTypeFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Products</CardTitle>
                <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                  Showing {filteredProducts.length} of {products.length} products
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'No products found matching your filters'
                    : 'No products yet. Add your first product to get started.'}
                </p>
                {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
                  <Button
                    className="mt-4"
                    onClick={() => router.push('/inventory/products/new')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Product
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product: any) => {
                  const typeConfig = getProductTypeConfig(product.product_type)
                  const Icon = typeConfig.icon
                  const isLowStock = product.stock_quantity && product.stock_quantity < 10

                  return (
                    <div
                      key={product.product_id || product.id}
                      className="group flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200 bg-white dark:bg-gray-950"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {product.name}
                              </span>
                              <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs">
                                {product.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              {product.sku && (
                                <div className="flex items-center gap-1.5">
                                  <Package className="h-4 w-4 text-blue-500" />
                                  <span className="font-mono">{product.sku}</span>
                                </div>
                              )}
                              {product.category && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-blue-500">•</span>
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
                              {product.stock_quantity !== null && product.stock_quantity !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                      isLowStock
                                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                        : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                                    }`}
                                  >
                                    Stock: {product.stock_quantity}
                                    {isLowStock && <AlertTriangle className="ml-1 h-3 w-3" />}
                                  </span>
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
                          className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600"
                          onClick={() =>
                            router.push(`/inventory/products/${product.product_id || product.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600"
                          onClick={() =>
                            router.push(`/inventory/products/${product.product_id || product.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                          onClick={() => handleDelete(product.product_id || product.id)}
                          disabled={deleteProduct.isPending}
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
