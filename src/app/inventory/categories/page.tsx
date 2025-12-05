'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Plus, Search, FolderTree, Edit, Trash2, ChevronRight, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useCategories, useDeleteCategory } from '@/hooks/use-categories'
import { useAuthStore } from '@/store/auth-store'

// Fallback business ID from seed data
const FALLBACK_BUSINESS_ID = 'dd8ae5a1-cab4-4041-849d-e108d74490d3'

export default function CategoriesPage() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Fetch categories from API
  const businessId = user?.business_id || FALLBACK_BUSINESS_ID
  const { data: categoriesData, isLoading, error, refetch } = useCategories(businessId)
  const deleteCategory = useDeleteCategory()

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory.mutateAsync({ id, hard: false })
      refetch()
    }
  }

  // Build hierarchical structure
  const buildCategoryTree = (categories: any[]) => {
    if (!categories) return []

    const categoryMap = new Map()
    const rootCategories: any[] = []

    // First pass: create map of all categories
    categories.forEach((cat) => {
      categoryMap.set(cat.category_id, { ...cat, children: [] })
    })

    // Second pass: build tree structure
    categories.forEach((cat) => {
      const category = categoryMap.get(cat.category_id)
      if (cat.parent_category_id && categoryMap.has(cat.parent_category_id)) {
        categoryMap.get(cat.parent_category_id).children.push(category)
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  const categoryTree = buildCategoryTree(categoriesData || [])

  // Filter categories by search
  const filteredCategories = searchQuery
    ? categoryTree.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryTree

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-blue-600">
              Categories
            </h1>
            <p className="text-muted-foreground">Organize your products with hierarchical categories</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-muted-foreground">Loading categories...</span>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600">Failed to load categories</p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Categories List */}
        {!isLoading && !error && (
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-blue-200 dark:border-blue-900 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {filteredCategories.map((category) => (
                <div key={category.category_id}>
                  <div className="group flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200 bg-white dark:bg-gray-950">
                    <div className="flex flex-1 items-center gap-4">
                      {category.children?.length > 0 && (
                        <button
                          onClick={() => toggleCategory(category.category_id)}
                          className="rounded-lg p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                        >
                          <ChevronRight
                            className={`h-4 w-4 text-blue-500 transition-transform ${
                              expandedCategories.has(category.category_id) ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      )}
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
                        <FolderTree className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Updated {formatDate(category.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                        onClick={() => handleDeleteCategory(category.category_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedCategories.has(category.category_id) && category.children?.length > 0 && (
                    <div className="ml-12 mt-2 space-y-2">
                      {category.children.map((child: any) => (
                        <div
                          key={child.category_id}
                          className="group flex items-center justify-between rounded-xl border border-dashed border-blue-200 dark:border-blue-900 p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200"
                        >
                          <div className="flex flex-1 items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-md shadow-blue-500/20">
                              <FolderTree className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{child.name}</h4>
                              {child.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{child.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Updated {formatDate(child.updated_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                              onClick={() => handleDeleteCategory(child.category_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Empty State */}
              {filteredCategories.length === 0 && (
                <div className="py-12 text-center">
                  <FolderTree className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">No categories found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first category'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
