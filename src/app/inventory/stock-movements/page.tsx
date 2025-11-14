'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Package,
  Plus,
  Minus,
  Edit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  Activity,
} from 'lucide-react'
import {
  useStockMovements,
  useInventorySummary,
  useLowStockAlerts,
  getMovementTypeInfo,
  formatCurrency,
  getHealthScoreColor,
  type StockMovementQueryDto,
} from '@/hooks/use-inventory'
import { useAuthStore } from '@/store/auth-store'
import { format } from 'date-fns'

export default function StockMovementsPage() {
  const { user } = useAuthStore()
  const businessId = user?.business_id || ''

  // Filters state
  const [filters, setFilters] = useState<StockMovementQueryDto>({
    businessId,
    limit: 50,
    offset: 0,
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Update filters when businessId changes
  useEffect(() => {
    if (businessId) {
      setFilters((prev) => ({ ...prev, businessId }))
    }
  }, [businessId])

  // Fetch data
  const {
    data: movementsData,
    isLoading: movementsLoading,
    error: movementsError,
  } = useStockMovements(filters)

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useInventorySummary(businessId)

  const {
    data: alertsData,
    isLoading: alertsLoading,
  } = useLowStockAlerts(businessId)

  // Loading state
  if (movementsLoading || summaryLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const movements = movementsData?.data || []
  const alerts = alertsData?.data || []
  const hasErrors = movementsError || summaryError

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">Track all inventory changes and transactions</p>
        </div>

        {/* Error Alert */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load some inventory data. Please ensure the backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalAvailableUnits} units available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalStockValue)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalReservedUnits} units reserved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summary.lowStockCount}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.outOfStockCount} out of stock
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthScoreColor(summary.healthScore)}`}>
                  {summary.healthScore}%
                </div>
                <p className="text-xs text-muted-foreground">Overall health score</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Low Stock Alerts */}
        {alerts.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <span className="font-medium">{alerts.length} items</span> need reordering.{' '}
              <a href="/inventory" className="underline hover:text-orange-700">
                View inventory
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Stock Movements Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Stock Movements</CardTitle>
                <CardDescription>History of all inventory transactions</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            {showFilters && (
              <div className="mb-4 grid gap-4 rounded-lg border p-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search movements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value, offset: 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value, offset: 0 })
                    }
                  />
                </div>
              </div>
            )}

            {/* Movements Table */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Before</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">After</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Reference</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          No stock movements found
                        </td>
                      </tr>
                    ) : (
                      movements.map((movement) => {
                        const typeInfo = getMovementTypeInfo(movement.movement_type)
                        return (
                          <tr key={movement.movement_id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">
                              {format(new Date(movement.created_at), 'MMM dd, HH:mm')}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={`${typeInfo.color} border-0`}>
                                {typeInfo.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium">Variant {movement.variant_id.slice(0, 8)}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-medium ${
                                  movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {movement.quantity_change > 0 ? '+' : ''}
                                {movement.quantity_change}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                              {movement.quantity_before}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium">
                              {movement.quantity_after}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {movement.reference_type || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {movement.notes || '-'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {movements.length > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {filters.offset! + 1} to{' '}
                    {Math.min(filters.offset! + filters.limit!, movementsData?.count || 0)} of{' '}
                    {movementsData?.count || 0} movements
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          offset: Math.max(0, filters.offset! - filters.limit!),
                        })
                      }
                      disabled={filters.offset === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          offset: filters.offset! + filters.limit!,
                        })
                      }
                      disabled={
                        filters.offset! + filters.limit! >= (movementsData?.count || 0)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
