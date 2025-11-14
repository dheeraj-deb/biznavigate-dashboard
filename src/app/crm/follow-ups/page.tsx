'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Video,
  Users,
  Filter,
  ChevronRight,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatDateTime } from '@/lib/utils'

// Mock data for follow-ups
const mockFollowUps = [
  {
    followup_id: '1',
    lead: {
      lead_id: '1',
      first_name: 'John',
      last_name: 'Doe',
      phone: '9876543210',
      email: 'john@example.com',
      lead_quality: 'hot',
    },
    followup_type: 'call',
    followup_description: 'Schedule product demo call to discuss features and pricing',
    scheduled_at: new Date('2024-12-22T10:00:00'),
    assigned_to_user: {
      name: 'Sarah Johnson',
    },
    status: 'pending',
    created_at: new Date('2024-12-20'),
  },
  {
    followup_id: '2',
    lead: {
      lead_id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '9876543211',
      email: 'jane@example.com',
      lead_quality: 'warm',
    },
    followup_type: 'email',
    followup_description: 'Send course enrollment details and payment instructions',
    scheduled_at: new Date('2024-12-22T14:30:00'),
    assigned_to_user: {
      name: 'Michael Chen',
    },
    status: 'pending',
    created_at: new Date('2024-12-21'),
  },
  {
    followup_id: '3',
    lead: {
      lead_id: '3',
      first_name: 'Bob',
      last_name: 'Johnson',
      phone: '9876543212',
      email: 'bob@example.com',
      lead_quality: 'hot',
    },
    followup_type: 'meeting',
    followup_description: 'In-person meeting at office to finalize contract',
    scheduled_at: new Date('2024-12-23T11:00:00'),
    assigned_to_user: {
      name: 'Sarah Johnson',
    },
    status: 'pending',
    created_at: new Date('2024-12-20'),
  },
  {
    followup_id: '4',
    lead: {
      lead_id: '4',
      first_name: 'Alice',
      last_name: 'Williams',
      phone: '9876543213',
      email: 'alice@example.com',
      lead_quality: 'warm',
    },
    followup_type: 'whatsapp',
    followup_description: 'Follow up on product inquiry via WhatsApp',
    scheduled_at: new Date('2024-12-20T09:00:00'),
    assigned_to_user: {
      name: 'Michael Chen',
    },
    status: 'completed',
    completed_at: new Date('2024-12-20T09:15:00'),
    completion_notes: 'Sent product catalog and pricing. Lead is interested and will get back by EOD.',
    created_at: new Date('2024-12-19'),
  },
  {
    followup_id: '5',
    lead: {
      lead_id: '5',
      first_name: 'Charlie',
      last_name: 'Brown',
      phone: '9876543214',
      email: 'charlie@example.com',
      lead_quality: 'cold',
    },
    followup_type: 'call',
    followup_description: 'Reminder call for pending payment',
    scheduled_at: new Date('2024-12-19T15:00:00'),
    assigned_to_user: {
      name: 'Sarah Johnson',
    },
    status: 'overdue',
    created_at: new Date('2024-12-18'),
  },
]

// Follow-up type configuration
const followupTypeConfig = {
  call: { label: 'Call', icon: Phone, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  email: { label: 'Email', icon: Mail, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  meeting: { label: 'Meeting', icon: Users, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' },
  video_call: { label: 'Video Call', icon: Video, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' },
}

// Status configuration
const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', icon: AlertCircle },
}

// Helper to get initials from name
const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '?'
}

// Helper to get quality badge color
const getQualityColor = (quality?: string) => {
  switch (quality) {
    case 'hot':
      return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
    case 'warm':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
    case 'cold':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400'
  }
}

// Helper to check if a date is today
const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

// Helper to check if a date is overdue
const isOverdue = (date: Date) => {
  return date < new Date() && !isToday(date)
}

export default function FollowUpsPage() {
  const [selectedTab, setSelectedTab] = useState('all')
  const [followUps] = useState(mockFollowUps)
  const [selectedFollowUps, setSelectedFollowUps] = useState<string[]>([])

  // Calculate stats
  const stats = {
    total: followUps.length,
    pending: followUps.filter(f => f.status === 'pending').length,
    today: followUps.filter(f => f.status === 'pending' && isToday(new Date(f.scheduled_at))).length,
    overdue: followUps.filter(f => f.status === 'overdue' || (f.status === 'pending' && isOverdue(new Date(f.scheduled_at)))).length,
    completed: followUps.filter(f => f.status === 'completed').length,
  }

  // Filter follow-ups by tab
  const filteredFollowUps = (() => {
    switch (selectedTab) {
      case 'today':
        return followUps.filter(f => f.status === 'pending' && isToday(new Date(f.scheduled_at)))
      case 'overdue':
        return followUps.filter(f => f.status === 'overdue' || (f.status === 'pending' && isOverdue(new Date(f.scheduled_at))))
      case 'completed':
        return followUps.filter(f => f.status === 'completed')
      default:
        return followUps
    }
  })()

  // Sort by scheduled_at
  const sortedFollowUps = [...filteredFollowUps].sort((a, b) =>
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )

  // Handle checkbox toggle
  const handleToggleFollowUp = (followupId: string) => {
    setSelectedFollowUps(prev =>
      prev.includes(followupId)
        ? prev.filter(id => id !== followupId)
        : [...prev, followupId]
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Follow-Ups</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Manage scheduled follow-up tasks</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Follow-Up
          </Button>
        </div>

        {/* Statistics Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Follow-Ups</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stats.pending} pending</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Due Today</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-950">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.today}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Overdue</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Action needed</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">Completed</CardTitle>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Successfully done</p>
            </CardContent>
          </Card>
        </div>

        {/* Follow-Ups List */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Scheduled Follow-Ups</CardTitle>
                <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                  Track and complete your follow-up tasks
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {selectedFollowUps.length > 0 && (
                  <Button variant="outline" size="sm" className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400">
                    Mark {selectedFollowUps.length} as Complete
                  </Button>
                )}
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="today">Today ({stats.today})</TabsTrigger>
                <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="space-y-3">
                {sortedFollowUps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No follow-ups found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Schedule your first follow-up task to get started
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule Follow-Up
                    </Button>
                  </div>
                ) : (
                  sortedFollowUps.map((followup) => {
                    const TypeIcon = followupTypeConfig[followup.followup_type as keyof typeof followupTypeConfig]?.icon || Phone
                    const StatusIcon = statusConfig[followup.status as keyof typeof statusConfig]?.icon || Clock
                    const isSelected = selectedFollowUps.includes(followup.followup_id)
                    const scheduledDate = new Date(followup.scheduled_at)
                    const isFollowupOverdue = isOverdue(scheduledDate)

                    return (
                      <Card
                        key={followup.followup_id}
                        className={`border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer ${
                          isSelected ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            <div className="flex items-center pt-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleFollowUp(followup.followup_id)}
                              />
                            </div>

                            {/* Lead Avatar */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md flex-shrink-0">
                              {getInitials(followup.lead.first_name, followup.lead.last_name)}
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                              {/* Lead Name and Quality */}
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {followup.lead.first_name} {followup.lead.last_name}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {followup.lead.email}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {followup.lead.lead_quality && (
                                    <Badge className={getQualityColor(followup.lead.lead_quality)}>
                                      {followup.lead.lead_quality}
                                    </Badge>
                                  )}
                                  <Badge className={followupTypeConfig[followup.followup_type as keyof typeof followupTypeConfig]?.color}>
                                    <TypeIcon className="mr-1 h-3 w-3" />
                                    {followupTypeConfig[followup.followup_type as keyof typeof followupTypeConfig]?.label}
                                  </Badge>
                                </div>
                              </div>

                              {/* Follow-up Description */}
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                {followup.followup_description}
                              </p>

                              {/* Schedule Info and Status */}
                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className={`h-4 w-4 ${isFollowupOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
                                    <span className={isFollowupOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                      {formatDate(followup.scheduled_at)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className={`h-4 w-4 ${isFollowupOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
                                    <span className={isFollowupOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                      {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                    <User className="h-4 w-4" />
                                    <span>{followup.assigned_to_user.name}</span>
                                  </div>
                                </div>

                                <Badge className={statusConfig[followup.status as keyof typeof statusConfig]?.color}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {statusConfig[followup.status as keyof typeof statusConfig]?.label}
                                </Badge>
                              </div>

                              {/* Completion Notes */}
                              {followup.status === 'completed' && followup.completion_notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Completion Notes:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{followup.completion_notes}</p>
                                  {followup.completed_at && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                      Completed on {formatDateTime(followup.completed_at)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Arrow */}
                            <div className="flex items-center pt-1">
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
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
