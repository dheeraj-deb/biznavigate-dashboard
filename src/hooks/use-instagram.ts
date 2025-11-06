import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { instagramApi } from '@/lib/instagram-api';
import {
  InstagramAccount,
  InstagramMedia,
  InstagramConversation,
  InstagramInsights,
  ConnectInstagramRequest,
  ReplyToCommentRequest,
  ReplyToMessageRequest,
  GetAccountInsightsRequest,
  GetMediaInsightsRequest,
} from '@/types/instagram';
import { toast } from 'react-hot-toast';

// ==================== Query Keys ====================

export const instagramKeys = {
  all: ['instagram'] as const,
  accounts: (businessId: string) => [...instagramKeys.all, 'accounts', businessId] as const,
  media: (accountId: string) => [...instagramKeys.all, 'media', accountId] as const,
  mediaDetails: (mediaId: string) => [...instagramKeys.all, 'media', mediaId] as const,
  conversations: (accountId: string) => [...instagramKeys.all, 'conversations', accountId] as const,
  messages: (conversationId: string) => [...instagramKeys.all, 'messages', conversationId] as const,
  insights: (accountId: string) => [...instagramKeys.all, 'insights', accountId] as const,
  mediaInsights: (mediaId: string) => [...instagramKeys.all, 'mediaInsights', mediaId] as const,
};

// ==================== Account Queries ====================

/**
 * Hook to fetch Instagram accounts for a business
 */
export function useInstagramAccounts(businessId: string) {
  return useQuery({
    queryKey: instagramKeys.accounts(businessId),
    queryFn: async () => {
      const response = await instagramApi.getAccounts(businessId);
      return response.data;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get OAuth URL for Instagram connection
 */
export function useInstagramOAuthUrl(businessId: string) {
  return useQuery({
    queryKey: [...instagramKeys.all, 'oauthUrl', businessId],
    queryFn: async () => {
      const response = await instagramApi.getOAuthUrl(businessId);
      return response.data.url;
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ==================== Account Mutations ====================

/**
 * Hook to connect Instagram account
 */
export function useConnectInstagramAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConnectInstagramRequest) => instagramApi.connectAccount(data),
    onSuccess: (_, variables) => {
      toast.success('Instagram account connected successfully!');
      queryClient.invalidateQueries({ queryKey: instagramKeys.accounts(variables.businessId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to connect Instagram account');
    },
  });
}

/**
 * Hook to disconnect Instagram account
 */
export function useDisconnectInstagramAccount(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => instagramApi.disconnectAccount(accountId),
    onSuccess: () => {
      toast.success('Instagram account disconnected');
      queryClient.invalidateQueries({ queryKey: instagramKeys.accounts(businessId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disconnect account');
    },
  });
}

/**
 * Hook to refresh access token
 */
export function useRefreshInstagramToken(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => instagramApi.refreshToken(accountId),
    onSuccess: () => {
      toast.success('Token refreshed successfully');
      queryClient.invalidateQueries({ queryKey: instagramKeys.accounts(businessId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to refresh token');
    },
  });
}

/**
 * Hook to sync account info
 */
export function useSyncInstagramAccount(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => instagramApi.syncAccount(accountId),
    onSuccess: () => {
      toast.success('Account synced successfully');
      queryClient.invalidateQueries({ queryKey: instagramKeys.accounts(businessId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync account');
    },
  });
}

// ==================== Media Queries ====================

/**
 * Hook to fetch Instagram media/posts
 */
export function useInstagramMedia(accountId: string, limit: number = 25) {
  return useQuery({
    queryKey: instagramKeys.media(accountId),
    queryFn: async () => {
      const response = await instagramApi.getMedia(accountId, limit);
      return response.data;
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch media details
 */
export function useInstagramMediaDetails(mediaId: string, accountId: string) {
  return useQuery({
    queryKey: instagramKeys.mediaDetails(mediaId),
    queryFn: async () => {
      const response = await instagramApi.getMediaDetails(mediaId, accountId);
      return response.data;
    },
    enabled: !!mediaId && !!accountId,
  });
}

/**
 * Hook to fetch media comments
 */
export function useInstagramMediaComments(mediaId: string, accountId: string) {
  return useQuery({
    queryKey: [...instagramKeys.all, 'comments', mediaId],
    queryFn: async () => {
      const response = await instagramApi.getMediaComments(mediaId, accountId);
      return response.data;
    },
    enabled: !!mediaId && !!accountId,
  });
}

// ==================== Messaging Queries ====================

/**
 * Hook to fetch Instagram conversations
 */
export function useInstagramConversations(accountId: string) {
  return useQuery({
    queryKey: instagramKeys.conversations(accountId),
    queryFn: async () => {
      const response = await instagramApi.getConversations(accountId);
      return response.data;
    },
    enabled: !!accountId,
    staleTime: 30 * 1000, // 30 seconds (more frequent updates for messages)
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook to fetch messages from a conversation
 */
export function useInstagramMessages(conversationId: string, accountId: string) {
  return useQuery({
    queryKey: instagramKeys.messages(conversationId),
    queryFn: async () => {
      const response = await instagramApi.getMessages(conversationId, accountId);
      return response.data;
    },
    enabled: !!conversationId && !!accountId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
  });
}

// ==================== Messaging Mutations ====================

/**
 * Hook to reply to a comment
 */
export function useReplyToComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReplyToCommentRequest) => instagramApi.replyToComment(data),
    onSuccess: () => {
      toast.success('Reply sent successfully!');
      // Invalidate media comments to show the new reply
      queryClient.invalidateQueries({ queryKey: instagramKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reply');
    },
  });
}

/**
 * Hook to reply to a direct message
 */
export function useReplyToMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReplyToMessageRequest) => instagramApi.replyToMessage(data),
    onSuccess: () => {
      toast.success('Message sent successfully!');
      // Invalidate conversations to show the new message
      queryClient.invalidateQueries({ queryKey: instagramKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, accountId }: { commentId: string; accountId: string }) =>
      instagramApi.deleteComment(commentId, accountId),
    onSuccess: () => {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: instagramKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}

/**
 * Hook to hide/unhide a comment
 */
export function useHideComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, accountId, hide }: { commentId: string; accountId: string; hide: boolean }) =>
      instagramApi.hideComment(commentId, accountId, hide),
    onSuccess: (_, variables) => {
      toast.success(`Comment ${variables.hide ? 'hidden' : 'unhidden'}`);
      queryClient.invalidateQueries({ queryKey: instagramKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to hide/unhide comment');
    },
  });
}

// ==================== Insights Queries ====================

/**
 * Hook to fetch account insights
 */
export function useInstagramAccountInsights(request: GetAccountInsightsRequest) {
  return useQuery({
    queryKey: [...instagramKeys.insights(request.accountId), request.period, request.metrics.join(',')],
    queryFn: async () => {
      const response = await instagramApi.getAccountInsights(request);
      return response.data;
    },
    enabled: !!request.accountId && request.metrics.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch media insights
 */
export function useInstagramMediaInsights(request: GetMediaInsightsRequest) {
  return useQuery({
    queryKey: [...instagramKeys.mediaInsights(request.mediaId), request.metrics.join(',')],
    queryFn: async () => {
      const response = await instagramApi.getMediaInsights(request);
      return response.data;
    },
    enabled: !!request.mediaId && !!request.accountId && request.metrics.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
