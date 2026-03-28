'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useTopProducts } from '@/hooks/use-analytics'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function TopProductsWidget({ title = 'Top Products' }: { title?: string }) {
  const { data: products = [], isLoading } = useTopProducts({ limit: 5 })

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>Best performing this month</CardDescription>
          </div>
          <Link href="/analytics/sales">
            <Button variant="ghost" size="sm">View All<ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">No data yet</div>
        ) : (
          <div className="space-y-3">
            {products.map((p: any, i: number) => (
              <div key={p.productId ?? i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 font-semibold text-xs">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{p.productName ?? p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.quantity ?? p.sales ?? 0} sales</p>
                  </div>
                </div>
                <p className="font-semibold text-sm">{fmt(p.revenue ?? 0)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
