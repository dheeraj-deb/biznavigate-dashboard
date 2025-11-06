'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FunnelStage } from '@/types'
import { ArrowRight } from 'lucide-react'

interface ConversionFunnelProps {
  stages: FunnelStage[]
}

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Conversion Funnel</CardTitle>
        <CardDescription>Track leads through each stage of your sales pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const widthPercentage = (stage.count / maxCount) * 100
            const isLast = index === stages.length - 1

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{stage.count} leads</span>
                    <span className="font-semibold" style={{ color: stage.color }}>
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
                <div className="relative h-10 w-full overflow-hidden rounded-lg bg-muted">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white mix-blend-difference">
                      {stage.count}
                    </span>
                  </div>
                </div>
                {!isLast && (
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Conversion Summary */}
        <div className="mt-6 rounded-lg bg-muted p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stages[0]?.count || 0}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stages[stages.length - 1]?.count || 0}</p>
              <p className="text-xs text-muted-foreground">Converted</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stages[0]?.count && stages[stages.length - 1]?.count
                  ? Math.round((stages[stages.length - 1].count / stages[0].count) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
