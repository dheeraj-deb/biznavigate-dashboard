'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  Mail,
  MessageSquare,
  Calendar,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'

// Mock data for campaigns
const mockCampaigns = [
  {
    campaign_id: '1',
    campaign_name: 'Summer Product Launch',
    campaign_type: 'product_announcement',
    channel: 'whatsapp',
    status: 'completed',
    total_recipients: 1250,
    sent_count: 1250,
    delivered_count: 1180,
    clicked_count: 340,
    converted_count: 45,
    scheduled_at: new Date('2024-06-15'),
    sent_at: new Date('2024-06-15T10:00:00'),
    created_at: new Date('2024-06-10'),
  },
  {
    campaign_id: '2',
    campaign_name: 'Flash Sale - Weekend Special',
    campaign_type: 'promotional',
    channel: 'email',
    status: 'active',
    total_recipients: 3500,
    sent_count: 2100,
    delivered_count: 2050,
    clicked_count: 520,
    converted_count: 78,
    scheduled_at: new Date('2024-12-20T09:00:00'),
    created_at: new Date('2024-12-18'),
  },
  {
    campaign_id: '3',
    campaign_name: 'Course Enrollment Reminder',
    campaign_type: 'follow_up',
    channel: 'whatsapp',
    status: 'scheduled',
    total_recipients: 850,
    sent_count: 0,
    delivered_count: 0,
    clicked_count: 0,
    converted_count: 0,
    scheduled_at: new Date('2024-12-25T14:00:00'),
    created_at: new Date('2024-12-19'),
  },
  {
    campaign_id: '4',
    campaign_name: 'Customer Feedback Survey',
    campaign_type: 'survey',
    channel: 'email',
    status: 'draft',
    total_recipients: 0,
    sent_count: 0,
    delivered_count: 0,
    clicked_count: 0,
    converted_count: 0,
    created_at: new Date('2024-12-19'),
  },
]

// Status configuration
const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400', icon: Calendar },
  active: { label: 'Active', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400', icon: Play },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400', icon: CheckCircle2 },
  paused: { label: 'Paused', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400', icon: Pause },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', icon: XCircle },
}

// Channel configuration
const channelConfig = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-600 dark:text-blue-400' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600 dark:text-green-400' },
  sms: { label: 'SMS', icon: Send, color: 'text-purple-600 dark:text-purple-400' },
}

export default function CampaignsPage() {
  const [selectedTab, setSelectedTab] = useState('all')
  const [campaigns] = useState(mockCampaigns)

  // Calculate stats
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
    totalConverted: campaigns.reduce((sum, c) => sum + c.converted_count, 0),
    avgConversionRate: campaigns.filter(c => c.sent_count > 0).length > 0
      ? (campaigns.reduce((sum, c) => sum + (c.sent_count > 0 ? (c.converted_count / c.sent_count) * 100 : 0), 0) / campaigns.filter(c => c.sent_count > 0).length).toFixed(1)
      : '0.0',
  }

  // Filter campaigns by tab
  const filteredCampaigns = selectedTab === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === selectedTab)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Campaigns</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Create and manage marketing campaigns</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {/* Statistics Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Campaigns</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stats.active} active now</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Messages Sent</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalSent.toLocaleString()}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Conversions</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalConverted}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Total leads converted</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Conversion</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-950">
                <CheckCircle2 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.avgConversionRate}%</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Tabs and List */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Campaigns</CardTitle>
                <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                  Manage and monitor your marketing campaigns
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="space-y-4">
                {filteredCampaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Send className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No campaigns found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Get started by creating your first campaign
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Button>
                  </div>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const StatusIcon = statusConfig[campaign.status as keyof typeof statusConfig]?.icon || Clock
                    const ChannelIcon = channelConfig[campaign.channel as keyof typeof channelConfig]?.icon || MessageSquare
                    const deliveryRate = campaign.sent_count > 0
                      ? ((campaign.delivered_count / campaign.sent_count) * 100).toFixed(1)
                      : '0.0'
                    const conversionRate = campaign.sent_count > 0
                      ? ((campaign.converted_count / campaign.sent_count) * 100).toFixed(2)
                      : '0.00'

                    return (
                      <Card key={campaign.campaign_id} className="border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            {/* Left: Campaign Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-4">
                                {/* Campaign Icon */}
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md flex-shrink-0">
                                  <ChannelIcon className="h-7 w-7" />
                                </div>

                                {/* Campaign Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                                      {campaign.campaign_name}
                                    </h3>
                                    <Badge className={statusConfig[campaign.status as keyof typeof statusConfig]?.color}>
                                      <StatusIcon className="mr-1 h-3 w-3" />
                                      {statusConfig[campaign.status as keyof typeof statusConfig]?.label}
                                    </Badge>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                      <ChannelIcon className={`h-4 w-4 ${channelConfig[campaign.channel as keyof typeof channelConfig]?.color}`} />
                                      <span className="capitalize">{channelConfig[campaign.channel as keyof typeof channelConfig]?.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Users className="h-4 w-4" />
                                      <span>{campaign.total_recipients.toLocaleString()} recipients</span>
                                    </div>
                                    {campaign.scheduled_at && (
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(campaign.scheduled_at)}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Campaign Performance Metrics */}
                                  {campaign.sent_count > 0 && (
                                    <div className="mt-4 grid grid-cols-4 gap-4">
                                      <div>
                                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Sent</div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{campaign.sent_count.toLocaleString()}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Delivered</div>
                                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                          {campaign.delivered_count.toLocaleString()}
                                          <span className="text-xs ml-1 text-gray-500">({deliveryRate}%)</span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Clicked</div>
                                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{campaign.clicked_count.toLocaleString()}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Converted</div>
                                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                          {campaign.converted_count}
                                          <span className="text-xs ml-1 text-gray-500">({conversionRate}%)</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="flex-shrink-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {campaign.status === 'draft' && (
                                  <DropdownMenuItem>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Now
                                  </DropdownMenuItem>
                                )}
                                {campaign.status === 'active' && (
                                  <DropdownMenuItem>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause Campaign
                                  </DropdownMenuItem>
                                )}
                                {campaign.status === 'paused' && (
                                  <DropdownMenuItem>
                                    <Play className="mr-2 h-4 w-4" />
                                    Resume Campaign
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
