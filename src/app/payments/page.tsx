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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Download,
  CreditCard,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  usePayments,
  usePaymentAnalytics,
  useRefundPayment,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getPaymentMethodInfo,
  formatCurrency,
  formatDateTime,
  getSuccessRateColor,
  canRefund,
  type PaymentQueryDto,
  type PaymentStatus,
  type PaymentMethod,
} from '@/hooks/use-payments'
import { useAuthStore } from '@/store/auth-store'
import { format } from 'date-fns'

export default function PaymentsPage() {
  const { user } = useAuthStore()
  const businessId = user?.business_id || ''

  // Filters state
  const [filters, setFilters] = useState<PaymentQueryDto>({
    business_id: businessId,
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    order: 'desc',
  })

  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Update filters when businessId changes
  useEffect(() => {
    if (businessId) {
      setFilters((prev) => ({ ...prev, business_id: businessId }))
    }
  }, [businessId])

  // Fetch data
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch,
  } = usePayments(filters)

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = usePaymentAnalytics({ business_id: businessId })

  const refundPayment = useRefundPayment()

  // Handle refund
  const handleRefund = (paymentId: string, amount?: number) => {
    if (confirm(`Are you sure you want to ${amount ? 'partially' : 'fully'} refund this payment?`)) {
      refundPayment.mutate({ paymentId, payment_id: paymentId, amount })
    }
  }

  // Loading state
  if (paymentsLoading || analyticsLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const payments = paymentsData?.data || []
  const meta = paymentsData?.meta

  // Only show error if there's an actual network/server error, not just empty data
  const hasErrors = (paymentsError && payments.length === 0 && !paymentsData) ||
                    (analyticsError && !analytics)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground">Track and manage all payment transactions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load payment data. Please ensure the backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.successfulPayments} successful payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.netRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  After {formatCurrency(analytics.totalRefunded)} refunded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getSuccessRateColor(analytics.successRate)}`}>
                  {analytics.successRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.failedPayments} failed payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalPayments}</div>
                <p className="text-xs text-muted-foreground">All time transactions</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>View and manage all payment records</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            {showFilters && (
              <div className="mb-4 grid gap-4 rounded-lg border p-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Order ID, Payment ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        status: value === 'all' ? undefined : (value as PaymentStatus),
                        page: 1,
                      })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="captured">Captured</SelectItem>
                      <SelectItem value="authorized">Authorized</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="partial_refund">Partial Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select
                    value={filters.method || 'all'}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        method: value === 'all' ? undefined : (value as PaymentMethod),
                        page: 1,
                      })
                    }
                  >
                    <SelectTrigger id="method">
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="netbanking">Net Banking</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    onChange={(e) =>
                      setFilters({ ...filters, from_date: e.target.value, page: 1 })
                    }
                  />
                </div>
              </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Razorpay ID</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => {
                        const methodInfo = getPaymentMethodInfo(payment.method)
                        return (
                          <tr key={payment.payment_id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">
                              {format(new Date(payment.created_at), 'MMM dd, HH:mm')}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {payment.order_id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {formatCurrency(payment.amount, payment.currency)}
                              {payment.refund_amount > 0 && (
                                <div className="text-xs text-red-600">
                                  -{formatCurrency(payment.refund_amount, payment.currency)} refunded
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className={`flex items-center gap-1 ${methodInfo.color}`}>
                                {methodInfo.label}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={getPaymentStatusColor(payment.status)}>
                                {getPaymentStatusLabel(payment.status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {payment.razorpay_payment_id?.slice(0, 12) || '-'}...
                            </td>
                            <td className="px-4 py-3 text-right">
                              {canRefund(payment) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRefund(payment.payment_id)}
                                  disabled={refundPayment.isPending}
                                >
                                  Refund
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.total > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                    {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} payments
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                      disabled={meta.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                      disabled={meta.page >= meta.totalPages}
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
