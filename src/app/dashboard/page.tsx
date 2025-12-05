'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProfileCompletionCheck } from '@/components/dashboard/ProfileCompletionCheck'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ShoppingCart,
  IndianRupee,
  MousePointerClick,
  Clock,
  Users,
  Bot,
  AlertCircle,
  Package,
  Star,
  MessageCircle,
  XCircle,
  ChevronRight,
  Lightbulb,
  Zap,
  Bell,
  Target,
  BarChart3,
  ArrowUpRight,
  Rocket,
  CheckSquare,
  Camera,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Comprehensive Dummy Data
const quickStats = [
  {
    title: 'New Leads Today',
    value: '24',
    change: '+12%',
    trend: 'up' as const,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    title: 'Active Conversations',
    value: '47',
    change: '+8%',
    trend: 'up' as const,
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    title: 'Orders Today',
    value: '18',
    change: '+23%',
    trend: 'up' as const,
    icon: ShoppingCart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  {
    title: 'Revenue Today',
    value: '₹45,230',
    change: '+15%',
    trend: 'up' as const,
    icon: IndianRupee,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  {
    title: 'Campaign Clicks',
    value: '1,234',
    change: '-5%',
    trend: 'down' as const,
    icon: MousePointerClick,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    title: 'Avg Response Time',
    value: '2.4m',
    change: '-18%',
    trend: 'up' as const,
    icon: Clock,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
  },
]

const leadFunnel = [
  { stage: 'New Leads', count: 156, percentage: 100, dropOff: 0, color: 'bg-blue-500' },
  { stage: 'In Discussion', count: 124, percentage: 79.5, dropOff: 20.5, color: 'bg-purple-500' },
  { stage: 'Confirmed', count: 89, percentage: 57.1, dropOff: 22.4, color: 'bg-pink-500' },
  { stage: 'Delivered', count: 67, percentage: 42.9, dropOff: 14.2, color: 'bg-green-500' },
]

const aiChatStats = [
  { label: 'AI Resolved', value: 78, total: 100, color: 'bg-green-500', icon: Bot },
  { label: 'Escalations', value: 15, total: 100, color: 'bg-yellow-500', icon: AlertCircle },
  { label: 'Missed Messages', value: 7, total: 100, color: 'bg-red-500', icon: XCircle },
  { label: 'Out-of-Hours', value: 43, total: 100, color: 'bg-blue-500', icon: Clock },
]

const topProducts = [
  {
    id: 1,
    name: 'Red Kurti',
    thumbnail: '👗',
    inquiries: 45,
    conversions: 23,
    conversionRate: 51,
    lowStock: true,
  },
  {
    id: 2,
    name: 'Blue Saree',
    thumbnail: '🥻',
    inquiries: 38,
    conversions: 19,
    conversionRate: 50,
    lowStock: false,
  },
  {
    id: 3,
    name: 'Lehenga Set',
    thumbnail: '👘',
    inquiries: 32,
    conversions: 12,
    conversionRate: 38,
    lowStock: true,
  },
  {
    id: 4,
    name: 'Ethnic Jewelry',
    thumbnail: '💍',
    inquiries: 28,
    conversions: 15,
    conversionRate: 54,
    lowStock: false,
  },
]

const recentConversations = [
  {
    id: 1,
    channel: 'whatsapp',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 43210',
    lastMessage: 'Do you have this in size M?',
    time: '2m ago',
    status: 'ai' as const,
    unread: 2,
  },
  {
    id: 2,
    channel: 'instagram',
    customerName: 'Rahul Kumar',
    customerPhone: '@rahul_k',
    lastMessage: 'What are the shipping charges?',
    time: '15m ago',
    status: 'human' as const,
    unread: 0,
  },
  {
    id: 3,
    channel: 'whatsapp',
    customerName: 'Anjali Verma',
    customerPhone: '+91 98765 43211',
    lastMessage: 'I want to place a bulk order',
    time: '23m ago',
    status: 'escalated' as const,
    unread: 5,
  },
  {
    id: 4,
    channel: 'instagram',
    customerName: 'Sneha Patel',
    customerPhone: '@sneha_fashion',
    lastMessage: 'Can I get a custom design?',
    time: '1h ago',
    status: 'ai' as const,
    unread: 0,
  },
  {
    id: 5,
    channel: 'whatsapp',
    customerName: 'Vikram Singh',
    customerPhone: '+91 98765 43212',
    lastMessage: 'Thanks for the quick response!',
    time: '2h ago',
    status: 'human' as const,
    unread: 0,
  },
]

const campaignPerformance = {
  totalCampaigns: 5,
  activeCampaigns: 3,
  clicks: 1234,
  conversions: 67,
  revenue: 45230,
  conversionRate: 5.4,
  chartData: [
    { month: 'Jan', conversions: 45, clicks: 890, revenue: 32400 },
    { month: 'Feb', conversions: 52, clicks: 1020, revenue: 38900 },
    { month: 'Mar', conversions: 48, clicks: 950, revenue: 35600 },
    { month: 'Apr', conversions: 67, clicks: 1234, revenue: 45230 },
  ],
}

const alertsTodos = [
  { id: 1, type: 'escalation', message: '3 conversations need urgent attention', priority: 'high' },
  { id: 2, type: 'stock', message: 'Red Kurti stock running low (5 units left)', priority: 'high' },
  { id: 3, type: 'review', message: '12 pending customer reviews to respond', priority: 'medium' },
  { id: 4, type: 'payment', message: '2 payments pending verification', priority: 'medium' },
  { id: 5, type: 'channel', message: 'Instagram reconnection required', priority: 'high' },
]

const aiInsights = [
  {
    id: 1,
    type: 'offer',
    message: 'High demand for Red Kurti 👗 — Add 10% discount campaign?',
    confidence: 'high',
  },
  {
    id: 2,
    type: 'faq',
    message: 'Update FAQ: "Shipping charges" asked 23 times this week',
    confidence: 'medium',
  },
  {
    id: 3,
    type: 'campaign',
    message: 'Weekend sale campaign suggestion: Lehenga Collection',
    confidence: 'high',
  },
]

export default function DashboardPage() {
  const channelStatus = {
    whatsapp: true,
    instagram: true,
  }

  return (
    <ProfileCompletionCheck>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here's your business overview.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Channel Status */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                  channelStatus.whatsapp
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                )}>
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </div>
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                  channelStatus.instagram
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                )}>
                  <Camera className="h-3.5 w-3.5" />
                  Instagram
                </div>
              </div>

              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                <Badge variant="destructive" className="ml-1">5</Badge>
              </Button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quickStats.map((stat) => (
              <Card key={stat.title} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={cn('rounded-lg p-2', stat.bgColor)}>
                      <stat.icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                    <Badge
                      variant={stat.trend === 'up' ? 'default' : 'secondary'}
                      className={cn(
                        'flex items-center gap-1',
                        stat.trend === 'up'
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      )}
                    >
                      {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Conversion & Engagement Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Lead Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Lead Conversion Funnel
                </CardTitle>
                <CardDescription>Track your lead journey and drop-off rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {leadFunnel.map((stage, index) => (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {stage.stage}
                        </span>
                        {stage.dropOff > 0 && (
                          <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400">
                            -{stage.dropOff}%
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {stage.count} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className="relative">
                      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <div
                          className={cn('h-full flex items-center px-3 text-white text-sm font-medium transition-all', stage.color)}
                          style={{ width: `${stage.percentage}%` }}
                        >
                          {stage.percentage > 20 && `${stage.count}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI & Human Chat Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  AI & Human Chat Performance
                </CardTitle>
                <CardDescription>Automation efficiency and response quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {aiChatStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <stat.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {stat.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {stat.value}%
                      </span>
                    </div>
                    <Progress value={stat.value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Products & Sales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Top Products / Services
                  </CardTitle>
                  <CardDescription>Most inquired products and conversion rates</CardDescription>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{product.thumbnail}</div>
                      {product.lowStock && (
                        <Badge variant="destructive" className="text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {product.name}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Inquiries:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{product.inquiries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversions:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{product.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{product.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Conversations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    Recent Conversations
                  </CardTitle>
                  <CardDescription>Multi-channel customer interactions</CardDescription>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        'rounded-full p-2',
                        conversation.channel === 'whatsapp'
                          ? 'bg-green-50 dark:bg-green-950/20'
                          : 'bg-pink-50 dark:bg-pink-950/20'
                      )}>
                        {conversation.channel === 'whatsapp' ? (
                          <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Camera className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {conversation.customerName}
                          </p>
                          <Badge
                            variant={
                              conversation.status === 'ai' ? 'default' :
                              conversation.status === 'human' ? 'secondary' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {conversation.status === 'ai' ? 'AI' :
                             conversation.status === 'human' ? 'Human' : 'Escalated'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {conversation.customerPhone} · {conversation.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {conversation.unread > 0 && (
                        <Badge variant="destructive" className="rounded-full">
                          {conversation.unread}
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        Reply
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Performance & Alerts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Campaign Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Campaign Performance
                </CardTitle>
                <CardDescription>Track your marketing campaign results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {campaignPerformance.clicks}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Clicks</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {campaignPerformance.conversions}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Conversions</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ₹{(campaignPerformance.revenue / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Revenue</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {campaignPerformance.chartData.map((data, index) => (
                    <div key={data.month}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{data.month}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {data.conversions} conversions
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${(data.conversions / 70) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full" variant="default">
                  <Rocket className="h-4 w-4 mr-2" />
                  Launch New Campaign
                </Button>
              </CardContent>
            </Card>

            {/* Alerts & To-Dos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Alerts & To-Dos
                    </CardTitle>
                    <CardDescription>Items requiring your attention</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Resolve All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertsTodos.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border',
                        alert.priority === 'high'
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                          : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
                      )}
                    >
                      <div className={cn(
                        'rounded-full p-1.5 mt-0.5',
                        alert.priority === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-yellow-100 dark:bg-yellow-900/30'
                      )}>
                        {alert.type === 'escalation' && <MessageSquare className="h-4 w-4 text-red-600 dark:text-red-400" />}
                        {alert.type === 'stock' && <Package className="h-4 w-4 text-red-600 dark:text-red-400" />}
                        {alert.type === 'review' && <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                        {alert.type === 'payment' && <IndianRupee className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                        {alert.type === 'channel' && <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {alert.message}
                        </p>
                      </div>

                      <Button variant="ghost" size="sm" className="h-8">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>Smart suggestions to grow your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-start gap-3 p-4 bg-white dark:bg-gray-950 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow"
                  >
                    <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900/30">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {insight.message}
                      </p>
                      <Badge
                        variant={insight.confidence === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.confidence === 'high' ? 'High' : 'Medium'} Confidence
                      </Badge>
                    </div>

                    <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700">
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProfileCompletionCheck>
  )
}
