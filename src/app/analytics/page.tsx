'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/store/auth-store'
import {
  useDashboardStats, useLeadFunnel, useRevenueByPeriod,
  useTopProducts, useLowStockAlerts,
} from '@/hooks/use-analytics'
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, IndianRupee,
  BarChart3, AlertTriangle, Package, Loader2, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function pct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  label, value, change, icon: Icon, color,
}: {
  label: string
  value: string
  change?: number
  icon: React.ElementType
  color: string
}) {
  const positive = (change ?? 0) >= 0
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {pct(change)} vs last month
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Funnel Bar ────────────────────────────────────────────────────────────────

const FUNNEL_COLORS: Record<string, string> = {
  new: '#9ca3af',
  contacted: '#3b82f6',
  interested: '#f97316',
  converted: '#22c55e',
  lost: '#ef4444',
}

function FunnelChart({ data }: { data: Array<{ stage: string; count: number }> }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-2">
      {data.map(row => (
        <div key={row.stage} className="flex items-center gap-3">
          <span className="w-20 text-xs font-semibold text-gray-500 capitalize text-right">{row.stage}</span>
          <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{
                width: `${Math.round((row.count / max) * 100)}%`,
                backgroundColor: FUNNEL_COLORS[row.stage] ?? '#6366f1',
              }}
            >
              <span className="text-white text-[10px] font-bold">{row.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const businessId = user?.business_id

  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month')

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(businessId)
  const { data: funnel = [], isLoading: funnelLoading } = useLeadFunnel(businessId)
  const { data: revenue = [], isLoading: revenueLoading } = useRevenueByPeriod(period, { business_id: businessId })
  const { data: topProducts = [], isLoading: productsLoading } = useTopProducts({ business_id: businessId, limit: 5 })
  const { data: lowStock = [], isLoading: stockLoading } = useLowStockAlerts()

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Business performance overview</p>
          </div>
          <button
            onClick={() => refetchStats()}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* KPI Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-2"><div className="h-3 w-20 bg-gray-200 rounded" /><div className="h-7 w-28 bg-gray-200 rounded" /></div></CardContent></Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total Revenue"
              value={fmt(stats.totalRevenue ?? 0)}
              change={stats.revenueChange}
              icon={IndianRupee}
              color="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
            />
            <KPICard
              label="Total Orders"
              value={String(stats.totalOrders ?? 0)}
              change={stats.ordersChange}
              icon={ShoppingCart}
              color="bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
            />
            <KPICard
              label="Customers"
              value={String(stats.totalCustomers ?? 0)}
              change={stats.customersChange}
              icon={Users}
              color="bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
            />
            <KPICard
              label="Conversion Rate"
              value={`${(stats.conversionRate ?? 0).toFixed(1)}%`}
              change={stats.conversionChange}
              icon={BarChart3}
              color="bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
            />
          </div>
        ) : null}

        {/* Revenue Chart + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by period */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Revenue</CardTitle>
                <div className="flex gap-1">
                  {(['day', 'week', 'month'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        period === p ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} labelClassName="text-xs" />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Lead Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lead Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : funnel.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No funnel data</div>
              ) : (
                <FunnelChart data={funnel} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products + Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Top Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No product data yet</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p: any, i: number) => (
                    <div key={p.item_id ?? i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        <p className="text-sm font-medium truncate">{p.name ?? p.item_name}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-bold text-blue-600">{fmt(p.revenue ?? p.total_revenue ?? 0)}</p>
                        <p className="text-[10px] text-muted-foreground">{p.orders ?? p.total_orders ?? 0} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : lowStock.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-green-600 font-medium gap-2">
                  <Package className="h-4 w-4" />All stock levels are healthy
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStock.map((item: any, i: number) => (
                    <div key={item.item_id ?? i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.category ?? 'Uncategorized'}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        (item.stock_quantity ?? 0) === 0 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {item.stock_quantity ?? 0} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
