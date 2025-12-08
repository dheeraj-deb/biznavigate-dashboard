'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  MessageCircle,
  Target,
  BarChart3,
  Users,
  ShoppingCart,
  Star,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'

interface SetupCard {
  id: string
  title: string
  description: string
  icon?: any
  customIcon?: string
  status: 'connected' | 'pending' | 'not_connected'
  path: string
  category: 'integration' | 'automation' | 'analytics' | 'commerce'
  badge?: string
  iconColor: string
  iconBg: string
  stats?: {
    label: string
    value: string
  }
}

export default function HomePage() {
  const router = useRouter()
  const [setups] = useState<SetupCard[]>([
    // Integrations
    {
      id: 'whatsapp',
      title: 'WhatsApp Business',
      description: 'Connect your WhatsApp Business account to manage conversations',
      customIcon: '/icons/whatsapp.png',
      status: 'not_connected',
      path: '/settings/whatsapp',
      category: 'integration',
      badge: 'Popular',
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
    },
    {
      id: 'instagram',
      title: 'Instagram',
      description: 'Manage Instagram DMs, comments, and posts from one place',
      customIcon: '/icons/instagram.png',
      status: 'not_connected',
      path: '/settings/instagram',
      category: 'integration',
      badge: 'Essential',
      iconColor: 'text-pink-600 dark:text-pink-400',
      iconBg: 'bg-gradient-to-br from-pink-100 via-purple-100 to-orange-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-orange-900/30'
    },
    {
      id: 'website-widget',
      title: 'Website Chat Widget',
      description: 'Add live chat to your website and capture leads',
      customIcon: '/icons/internet.png',
      status: 'not_connected',
      path: '/settings/integrations',
      category: 'integration',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30'
    },

    // Automation
    {
      id: 'auto-reply',
      title: 'Auto Reply',
      description: 'Set up automatic responses for common questions',
      icon: MessageCircle,
      status: 'pending',
      path: '/automation/auto-reply',
      category: 'automation',
      badge: 'Time Saver',
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30'
    },
    {
      id: 'workflows',
      title: 'Automation Workflows',
      description: 'Create custom automation flows for your business',
      icon: Zap,
      status: 'not_connected',
      path: '/automation/workflows',
      category: 'automation',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30'
    },

    // Marketing & Campaigns
    {
      id: 'campaigns',
      title: 'Marketing Campaigns',
      description: 'Create and manage marketing campaigns across channels',
      icon: Target,
      status: 'not_connected',
      path: '/campaigns',
      category: 'analytics',
      badge: 'New',
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30'
    },

    // Analytics & Insights
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Track performance metrics and customer insights',
      icon: BarChart3,
      status: 'connected',
      path: '/dashboard',
      category: 'analytics',
      stats: {
        label: 'Active',
        value: '24/7'
      },
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30'
    },
    {
      id: 'customers',
      title: 'Customer Management',
      description: 'Manage customer data, segments, and communication history',
      icon: Users,
      status: 'connected',
      path: '/customers',
      category: 'analytics',
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30'
    },

    // Commerce
    {
      id: 'orders',
      title: 'Order Management',
      description: 'Track and manage orders from all channels',
      icon: ShoppingCart,
      status: 'connected',
      path: '/orders',
      category: 'commerce',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30'
    },
    {
      id: 'reviews',
      title: 'Reviews & Ratings',
      description: 'Collect and showcase customer reviews',
      icon: Star,
      status: 'connected',
      path: '/reviews',
      category: 'commerce',
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-950/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'pending':
        return 'Setup Pending'
      default:
        return 'Not Connected'
    }
  }

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'integration':
        return 'Channel Integrations'
      case 'automation':
        return 'Automation & AI'
      case 'analytics':
        return 'Analytics & Insights'
      case 'commerce':
        return 'Commerce & Sales'
      default:
        return 'Other'
    }
  }

  const categories = ['integration', 'automation', 'analytics', 'commerce']

  return (
    <DashboardLayout>
      <div className="min-h-screen -m-6 lg:-m-8 bg-gray-50 dark:bg-gray-900">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
        {categories.map((category) => {
          const categorySetups = setups.filter(s => s.category === category)
          if (categorySetups.length === 0) return null

          return (
            <div key={category} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getCategoryTitle(category)}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {categorySetups.filter(s => s.status === 'connected').length}/{categorySetups.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorySetups.map((setup) => {
                  const Icon = setup.icon
                  return (
                    <div
                      key={setup.id}
                      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                      style={{
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.03)',
                      }}
                      onClick={() => router.push(setup.path)}
                    >
                      {/* Icon Box */}
                      <div className="mb-4">
                        <div
                          className="w-14 h-14 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-md"
                          style={{
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {setup.customIcon ? (
                            <Image
                              src={setup.customIcon}
                              alt={setup.title}
                              width={28}
                              height={28}
                              className="w-7 h-7"
                            />
                          ) : (
                            Icon && <Icon className={`w-7 h-7 ${setup.iconColor}`} />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {setup.title}
                          </h3>
                          {setup.badge && (
                            <Badge
                              variant="secondary"
                              className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0"
                            >
                              {setup.badge}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {setup.description}
                        </p>

                        {/* Status Badge */}
                        <div className="flex items-center justify-between pt-3">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${getStatusColor(setup.status)}`}>
                            {getStatusIcon(setup.status)}
                            {getStatusText(setup.status)}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        {setup.stats && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {setup.stats.label}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {setup.stats.value}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Quick Actions */}
        <div className="mt-12 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need Help Getting Started?</h3>
              <p className="text-blue-100 mb-4">
                Follow our step-by-step guide to set up your integrations and start managing your business better.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => router.push('/onboarding')}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Start Onboarding
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/settings/integrations')}
                  className="border-white text-white hover:bg-white/10"
                >
                  View All Integrations
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
