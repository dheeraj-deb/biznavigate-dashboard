'use client';

import { useState } from 'react';
import { useReplyToComment, useDeleteComment, useHideComment } from '@/hooks/use-instagram';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Send, Loader2, MoreVertical, Trash2, EyeOff, Eye } from 'lucide-react';
import { InstagramComment } from '@/types/instagram';
import { format } from 'date-fns';

interface InstagramCommentReplyProps {
  comment: InstagramComment;
  accountId: string;
  postUrl?: string;
  onReplySuccess?: () => void;
}

export function InstagramCommentReply({
  comment,
  accountId,
  postUrl,
  onReplySuccess,
}: InstagramCommentReplyProps) {
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const replyMutation = useReplyToComment();
  const deleteMutation = useDeleteComment();
  const hideMutation = useHideComment();

  const handleReply = async () => {
    if (!replyText.trim()) return;

    await replyMutation.mutateAsync({
      commentId: comment.id,
      message: replyText.trim(),
      accountId,
    });

    setReplyText('');
    setShowReplyBox(false);
    onReplySuccess?.();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    await deleteMutation.mutateAsync({
      commentId: comment.id,
      accountId,
    });
  };

  const handleHideToggle = async (hide: boolean) => {
    await hideMutation.mutateAsync({
      commentId: comment.id,
      accountId,
      hide,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              @{comment.username}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(new Date(comment.timestamp), 'PPp')}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleHideToggle(true)}>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Comment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleHideToggle(false)}>
                <Eye className="mr-2 h-4 w-4" />
                Unhide Comment
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Comment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Comment Text */}
        <p className="text-sm">{comment.text}</p>

        {/* Post Link */}
        {postUrl && (
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View on Instagram →
          </a>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-4 border-l-2 border-muted space-y-2">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="text-sm">
                <p className="font-medium">@{reply.username}</p>
                <p className="text-muted-foreground">{reply.text}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(reply.timestamp), 'PPp')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reply Button */}
        {!showReplyBox && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReplyBox(true)}
            className="w-full"
          >
            Reply
          </Button>
        )}

        {/* Reply Box */}
        {showReplyBox && (
          <div className="space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[80px]"
              disabled={replyMutation.isPending}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || replyMutation.isPending}
                size="sm"
                className="flex-1"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Reply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReplyBox(false);
                  setReplyText('');
                }}
                disabled={replyMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
