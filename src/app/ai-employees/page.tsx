'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAiEmployeesDashboard, type AiEmployeeMetric } from '@/hooks/use-ai-manager'
import { useBusinessType } from '@/hooks/use-business-type'
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Loader2,
  Megaphone,
  Package,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'

function money(value?: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 'Rs 0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

function iconFor(key: string) {
  if (key === 'sales') return Users
  if (key === 'orders') return Truck
  if (key === 'inventory') return Package
  if (key === 'marketing') return Megaphone
  if (key === 'growth') return BarChart3
  return Bot
}

function statusTone(status: string) {
  if (status === 'needs_attention') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'working') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-green-200 bg-green-50 text-green-700'
}

function metricTone(tone?: AiEmployeeMetric['tone']) {
  if (tone === 'danger') return 'bg-rose-50 text-rose-700'
  if (tone === 'warning') return 'bg-amber-50 text-amber-700'
  if (tone === 'good') return 'bg-green-50 text-green-700'
  return 'bg-slate-100 text-slate-700'
}

function metricValue(metric: AiEmployeeMetric) {
  if (metric.format === 'money') return money(metric.value)
  return metric.value
}

export default function AiEmployeesPage() {
  const { businessType, isLoading: businessLoading } = useBusinessType()
  const aiManagerQuery = useAiEmployeesDashboard()
  const isProductBusiness = businessType === 'products' || businessType === 'retail'
  const employees = aiManagerQuery.data?.employees ?? []
  const workFeed = aiManagerQuery.data?.work_feed ?? []

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-8">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#0066FF]">Product seller workspace</p>
                  <h1 className="text-2xl font-bold text-slate-950">AI employees</h1>
                </div>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Sales, marketing, inventory, order desk and growth work are separated so the owner can see what each AI employee checked and what needs approval next.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]">
                <Link href="/crm/inbox">
                  <Users className="h-4 w-4" />
                  Open inbox
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/orders">
                  <Truck className="h-4 w-4" />
                  Orders
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 bg-white">
                <Link href="/inventory/products">
                  <Package className="h-4 w-4" />
                  Products
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {businessLoading || aiManagerQuery.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
          </div>
        ) : !isProductBusiness ? (
          <Card className="border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">This workspace is for product sellers.</h2>
            <p className="mt-2 text-sm text-slate-600">
              Hospitality businesses continue using the AI Assistant and booking worklist on the dashboard.
            </p>
            <Button asChild className="mt-4 bg-[#0066FF] hover:bg-[#0052CC]">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </Card>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
              {employees.map((employee) => {
                const Icon = iconFor(employee.key)
                const primaryAction = employee.next_actions?.[0]

                return (
                  <Card key={employee.key} className="flex min-h-[360px] flex-col border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${statusTone(employee.status)}`}>
                        {employee.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h2 className="text-base font-bold leading-5 text-slate-950">{employee.name}</h2>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold uppercase text-slate-500">{employee.role}</p>
                      <p className="mt-3 min-h-[72px] text-sm leading-5 text-slate-600">{employee.summary}</p>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {employee.metrics.slice(0, 3).map((metric) => (
                        <div key={metric.label} className={`rounded-md px-2 py-2 ${metricTone(metric.tone)}`}>
                          <p className="truncate text-[11px] font-semibold">{metric.label}</p>
                          <p className="mt-1 truncate text-sm font-bold">{metricValue(metric)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex-1 space-y-2">
                      {employee.completed_work.slice(0, 2).map((item) => (
                        <Link
                          key={`${employee.key}-${item.title}`}
                          href={item.href ?? '/dashboard'}
                          className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                        >
                          <p className="truncate text-xs font-bold text-slate-950">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">{item.detail}</p>
                        </Link>
                      ))}
                    </div>

                    {employee.safety ? (
                      <div className="mt-3 flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                        <span className="line-clamp-2">{employee.safety}</span>
                      </div>
                    ) : null}

                    {primaryAction ? (
                      <Button asChild variant="outline" size="sm" className="mt-4 justify-between bg-white">
                        <Link href={primaryAction.action_href}>
                          {primaryAction.action_label}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <div className="mt-4 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
                        No owner action needed
                      </div>
                    )}
                  </Card>
                )
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Next owner approvals</h2>
                    <p className="mt-1 text-sm text-slate-500">Highest-priority employee actions from today.</p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-[#0066FF]">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </div>
                <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {workFeed.length > 0 ? workFeed.slice(0, 8).map((item) => (
                    <Link key={`${item.employee_key}-${item.type}-${item.title}`} href={item.action_href} className="block p-3 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{item.reason}</p>
                          <p className="mt-2 text-xs font-semibold uppercase text-slate-400">{item.employee_name}</p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                      </div>
                    </Link>
                  )) : (
                    <div className="p-4 text-sm text-slate-500">No approval queue right now.</div>
                  )}
                </div>
              </Card>

              <Card className="border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Operating rule</h2>
                    <p className="mt-1 text-sm text-slate-500">AI can prepare work. Owner controls risky actions.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <p>Sales replies, payment follow-ups, stock risk and campaigns are visible separately.</p>
                  <p>Low-stock and unpaid-order work is shown before products are promoted again.</p>
                  <p>Campaign actions stay owner-approved so WhatsApp templates and customer intent remain controlled.</p>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
