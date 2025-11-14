'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Send } from 'lucide-react'

export function CampaignChat({ campaignId, teamMembers }: any) {
  const [message, setMessage] = useState('')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Campaign Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-semibold">Sarah Johnson</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">The budget looks good, let's proceed!</p>
              </div>
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <Button size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
