'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuickAction } from '@/types'
import { Plus, Package, Users, ShoppingCart, Megaphone, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface QuickActionsProps {
  actions?: QuickAction[]
}

const defaultActions: QuickAction[] = [
  {
    id: 'add-product',
    label: 'Add Product',
    description: 'Add a new product to inventory',
    icon: 'Package',
    href: '/products/new',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'add-lead',
    label: 'Add Lead',
    description: 'Capture a new sales lead',
    icon: 'Users',
    href: '/leads/new',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    id: 'create-order',
    label: 'Create Order',
    description: 'Process a new customer order',
    icon: 'ShoppingCart',
    href: '/orders/new',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    id: 'start-campaign',
    label: 'Start Campaign',
    description: 'Launch a marketing campaign',
    icon: 'Megaphone',
    href: '/campaigns/new',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
]

const iconMap = {
  Package,
  Users,
  ShoppingCart,
  Megaphone,
}

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  const getIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Plus
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump to common tasks and operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => {
            const Icon = getIcon(action.icon)

            return (
              <Link key={action.id} href={action.href}>
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-2 p-4 hover:shadow-md transition-all"
                >
                  <div className={`rounded-lg p-2 ${action.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground font-normal">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 self-end text-muted-foreground" />
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
