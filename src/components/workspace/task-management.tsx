'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function TaskManagement({ teamMembers }: any) {
  const tasks = [
    { id: '1', title: 'Review summer campaign creative assets', assignee: 'Sarah Johnson', completed: false },
    { id: '2', title: 'Approve Valentine budget allocation', assignee: 'Michael Chen', completed: true },
    { id: '3', title: 'Update Q1 brand awareness metrics', assignee: 'Emily Rodriguez', completed: false },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Task Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Checkbox checked={task.completed} />
              <div className="flex-1">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-gray-500">Assigned to {task.assignee}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
