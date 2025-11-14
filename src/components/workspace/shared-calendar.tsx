'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export function SharedCalendar({ teamMembers }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Shared Campaign Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-gray-500">Calendar view - Campaign deadlines and milestones</p>
        </div>
      </CardContent>
    </Card>
  )
}
