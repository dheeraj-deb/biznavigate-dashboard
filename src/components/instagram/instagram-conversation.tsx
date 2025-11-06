'use client';

import { useState } from 'react';
import { useInstagramMessages, useReplyToMessage } from '@/hooks/use-instagram';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InstagramConversationProps {
  conversationId: string;
  accountId: string;
  recipientId: string;
  recipientUsername?: string;
  recipientName?: string;
}

export function InstagramConversation({
  conversationId,
  accountId,
  recipientId,
  recipientUsername,
  recipientName,
}: InstagramConversationProps) {
  const [message, setMessage] = useState('');
  const { data: messagesData, isLoading } = useInstagramMessages(conversationId, accountId);
  const replyMutation = useReplyToMessage();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    await replyMutation.mutateAsync({
      recipientId,
      message: message.trim(),
      accountId,
    });

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              <Instagram className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              {recipientName || recipientUsername || 'Instagram User'}
            </CardTitle>
            {recipientUsername && (
              <CardDescription>@{recipientUsername}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !messagesData?.data || messagesData.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Instagram className="w-12 h-12 mb-2" />
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messagesData.data.map((msg) => {
                const isFromCustomer = msg.from.id === recipientId;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      isFromCustomer ? 'justify-start' : 'justify-end'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg px-4 py-2',
                        isFromCustomer
                          ? 'bg-muted'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.message.text}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          isFromCustomer
                            ? 'text-muted-foreground'
                            : 'text-primary-foreground/70'
                        )}
                      >
                        {format(new Date(msg.created_time), 'PPp')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={replyMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || replyMutation.isPending}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {replyMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
