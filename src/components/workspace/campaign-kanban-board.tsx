'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Calendar, DollarSign, Users, MessageSquare, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Campaign {
  id: string
  title: string
  status: 'planning' | 'in_progress' | 'review' | 'approved' | 'launched'
  platform: 'instagram' | 'facebook' | 'google' | 'whatsapp'
  budget: number
  assignee: { name: string; avatar: string }
  dueDate: string
  comments: number
  description: string
}

const mockCampaigns: Campaign[] = [
  {
    id: 'camp_1',
    title: 'Summer Fashion Launch',
    status: 'planning',
    platform: 'instagram',
    budget: 15000,
    assignee: { name: 'Sarah Johnson', avatar: 'SJ' },
    dueDate: '2025-02-15',
    comments: 5,
    description: 'Launch summer collection with influencer partnerships',
  },
  {
    id: 'camp_2',
    title: 'Valentine\'s Day Sale',
    status: 'in_progress',
    platform: 'facebook',
    budget: 8000,
    assignee: { name: 'Michael Chen', avatar: 'MC' },
    dueDate: '2025-02-10',
    comments: 12,
    description: 'Limited time discount campaign',
  },
  {
    id: 'camp_3',
    title: 'Brand Awareness Q1',
    status: 'review',
    platform: 'google',
    budget: 25000,
    assignee: { name: 'Emily Rodriguez', avatar: 'ER' },
    dueDate: '2025-03-01',
    comments: 8,
    description: 'Increase brand visibility in key markets',
  },
  {
    id: 'camp_4',
    title: 'Customer Re-engagement',
    status: 'approved',
    platform: 'whatsapp',
    budget: 5000,
    assignee: { name: 'David Park', avatar: 'DP' },
    dueDate: '2025-02-20',
    comments: 3,
    description: 'Win back inactive customers',
  },
]

const columns = [
  { id: 'planning', title: 'Planning', color: 'bg-gray-100 dark:bg-gray-900' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'review', title: 'Review', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'approved', title: 'Approved', color: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'launched', title: 'Launched', color: 'bg-purple-50 dark:bg-purple-900/20' },
]

function CampaignCard({ campaign, isDragging }: { campaign: Campaign; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: campaign.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPlatformColor = () => {
    switch (campaign.platform) {
      case 'instagram':
        return 'bg-gradient-to-br from-purple-500 to-pink-500'
      case 'facebook':
        return 'bg-blue-600'
      case 'google':
        return 'bg-red-600'
      case 'whatsapp':
        return 'bg-green-600'
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="hover:shadow-lg transition-shadow cursor-move">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                  {campaign.title}
                </h4>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', getPlatformColor())}>
                  <span className="text-white text-xs font-bold">
                    {campaign.platform.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{campaign.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <DollarSign className="h-3 w-3" />
                <span>${(campaign.budget / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>{new Date(campaign.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <MessageSquare className="h-3 w-3" />
                <span>{campaign.comments}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                  {campaign.assignee.avatar}
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300">{campaign.assignee.name}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CampaignKanbanBoard({
  onCampaignSelect,
}: {
  onCampaignSelect?: (campaignId: string | null) => void
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const campaignId = active.id as string
    const newStatus = over.id as Campaign['status']

    setCampaigns((prev) =>
      prev.map((camp) =>
        camp.id === campaignId ? { ...camp, status: newStatus } : camp
      )
    )

    toast.success(`Campaign moved to ${columns.find((c) => c.id === newStatus)?.title}`)
    setActiveId(null)
  }

  const activeCampaign = campaigns.find((c) => c.id === activeId)

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnCampaigns = campaigns.filter((c) => c.status === column.id)

          return (
            <SortableContext
              key={column.id}
              id={column.id}
              items={columnCampaigns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={cn('rounded-lg p-4 min-h-[600px]', column.color)}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {column.title}
                    <Badge variant="outline" className="ml-1">
                      {columnCampaigns.length}
                    </Badge>
                  </h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {columnCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </SortableContext>
          )
        })}
      </div>

      <DragOverlay>
        {activeCampaign && <CampaignCard campaign={activeCampaign} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
