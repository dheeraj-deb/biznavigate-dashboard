'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, FolderTree, Edit, Trash2, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const mockCategories = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    parentId: null,
    productCount: 145,
    updatedAt: '2024-03-15',
    children: [
      {
        id: '1-1',
        name: 'Computers',
        description: 'Desktop and laptop computers',
        parentId: '1',
        productCount: 67,
        updatedAt: '2024-03-14',
      },
      {
        id: '1-2',
        name: 'Accessories',
        description: 'Computer accessories',
        parentId: '1',
        productCount: 78,
        updatedAt: '2024-03-13',
      },
    ],
  },
  {
    id: '2',
    name: 'Furniture',
    description: 'Office and home furniture',
    parentId: null,
    productCount: 89,
    updatedAt: '2024-03-12',
    children: [
      {
        id: '2-1',
        name: 'Chairs',
        description: 'Office and ergonomic chairs',
        parentId: '2',
        productCount: 34,
        updatedAt: '2024-03-11',
      },
      {
        id: '2-2',
        name: 'Desks',
        description: 'Work desks and tables',
        parentId: '2',
        productCount: 55,
        updatedAt: '2024-03-10',
      },
    ],
  },
  {
    id: '3',
    name: 'Software',
    description: 'Software licenses and subscriptions',
    parentId: null,
    productCount: 45,
    updatedAt: '2024-03-09',
    children: [],
  },
]

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['1', '2']))

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">Organize your products with hierarchical categories</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockCategories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent">
                    <div className="flex flex-1 items-center gap-3">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="hover:bg-muted rounded p-1"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedCategories.has(category.id) ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      <FolderTree className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{category.productCount} products</p>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDate(category.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {expandedCategories.has(category.id) && category.children.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                      {category.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between rounded-lg border border-dashed p-4 hover:bg-accent"
                        >
                          <div className="flex flex-1 items-center gap-3">
                            <FolderTree className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <h4 className="font-medium">{child.name}</h4>
                              <p className="text-sm text-muted-foreground">{child.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{child.productCount} products</p>
                              <p className="text-xs text-muted-foreground">
                                Updated {formatDate(child.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="ml-4 flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
