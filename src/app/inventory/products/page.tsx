'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Download, Upload, Edit, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const mockProducts = [
  {
    id: '1',
    name: 'Laptop Pro 15"',
    sku: 'LPT-001',
    category: 'Electronics',
    supplier: 'Tech Supplies Inc.',
    price: 1299.99,
    cost: 899.99,
    stockQuantity: 45,
    minStockLevel: 10,
    status: 'ACTIVE',
    updatedAt: '2024-03-15',
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    sku: 'MSE-002',
    category: 'Electronics',
    supplier: 'Peripherals Co.',
    price: 29.99,
    cost: 15.99,
    stockQuantity: 8,
    minStockLevel: 20,
    status: 'ACTIVE',
    updatedAt: '2024-03-14',
  },
  {
    id: '3',
    name: 'Office Chair Deluxe',
    sku: 'CHR-003',
    category: 'Furniture',
    supplier: 'Office Solutions',
    price: 249.99,
    cost: 149.99,
    stockQuantity: 23,
    minStockLevel: 5,
    status: 'ACTIVE',
    updatedAt: '2024-03-13',
  },
]

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [products] = useState(mockProducts)

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Supplier</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Stock</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Updated</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="py-4 font-mono text-sm">{product.sku}</td>
                      <td className="py-4 font-medium">{product.name}</td>
                      <td className="py-4 text-sm text-muted-foreground">{product.category}</td>
                      <td className="py-4 text-sm text-muted-foreground">{product.supplier}</td>
                      <td className="py-4 text-right font-medium">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-4 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            product.stockQuantity < product.minStockLevel
                              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                          }`}
                        >
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                          {product.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {formatDate(product.updatedAt)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
