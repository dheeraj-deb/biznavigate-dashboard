'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { CampaignKanbanBoard } from '@/components/workspace/campaign-kanban-board'
import { TeamActivityFeed } from '@/components/workspace/team-activity-feed'
import { CampaignChat } from '@/components/workspace/campaign-chat'
import { RoleBasedDashboard } from '@/components/workspace/role-based-dashboard'
import { SharedCalendar } from '@/components/workspace/shared-calendar'
import { TaskManagement } from '@/components/workspace/task-management'
import {
  Users,
  Calendar,
  MessageSquare,
  LayoutGrid,
  CheckSquare,
  BarChart3,
  Filter,
  Plus,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'

// Mock team data
const mockTeamMembers = [
  {
    id: 'user_1',
    name: 'Sarah Johnson',
    role: 'Marketing Manager',
    avatar: 'SJ',
    status: 'online' as const,
    department: 'Marketing',
  },
  {
    id: 'user_2',
    name: 'Michael Chen',
    role: 'Finance Director',
    avatar: 'MC',
    status: 'online' as const,
    department: 'Finance',
  },
  {
    id: 'user_3',
    name: 'Emily Rodriguez',
    role: 'Content Specialist',
    avatar: 'ER',
    status: 'away' as const,
    department: 'Marketing',
  },
  {
    id: 'user_4',
    name: 'David Park',
    role: 'Campaign Analyst',
    avatar: 'DP',
    status: 'offline' as const,
    department: 'Marketing',
  },
  {
    id: 'user_5',
    name: 'Lisa Thompson',
    role: 'HR Manager',
    avatar: 'LT',
    status: 'online' as const,
    department: 'HR',
  },
]

export default function WorkspacePage() {
  const [selectedRole, setSelectedRole] = useState<'marketing' | 'finance' | 'hr' | 'all'>('all')
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)

  const handleInviteTeamMember = () => {
    toast.success('Team invitation sent')
  }

  const handleCreateCampaign = () => {
    toast.success('Creating new campaign...')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            Team Workspace
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Collaborate with your team on campaigns and tasks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleInviteTeamMember}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team
          </Button>
          <Button size="sm" onClick={handleCreateCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Team Members Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Team Members
                </span>
                <Badge variant="outline" className="ml-2">
                  {mockTeamMembers.length} members
                </Badge>
              </div>
              <div className="flex items-center -space-x-2">
                {mockTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="relative group cursor-pointer"
                    title={`${member.name} - ${member.role}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-white dark:border-gray-950">
                      {member.avatar}
                    </div>
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-950',
                        getStatusColor(member.status)
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as typeof selectedRole)}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Roles</option>
                <option value="marketing">Marketing</option>
                <option value="finance">Finance</option>
                <option value="hr">HR</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="board" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="board" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban Board
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Activity
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Role View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          <CampaignKanbanBoard onCampaignSelect={setSelectedCampaign} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <TeamActivityFeed teamMembers={mockTeamMembers} />
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <CampaignChat
            campaignId={selectedCampaign}
            teamMembers={mockTeamMembers}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <SharedCalendar teamMembers={mockTeamMembers} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManagement teamMembers={mockTeamMembers} />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <RoleBasedDashboard selectedRole={selectedRole} teamMembers={mockTeamMembers} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
