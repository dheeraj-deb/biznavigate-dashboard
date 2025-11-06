import { apiClient } from './api-client';
import {
  InstagramAccount,
  InstagramMedia,
  InstagramConversation,
  InstagramMessage,
  InstagramInsights,
  InstagramMediaInsights,
  InstagramComment,
  ConnectInstagramRequest,
  ReplyToCommentRequest,
  ReplyToMessageRequest,
  GetAccountInsightsRequest,
  GetMediaInsightsRequest,
  ApiResponse,
  PaginatedResponse,
  OAuthUrlResponse,
  ConnectAccountResponse,
  JobStatusResponse,
} from '@/types/instagram';

export const instagramApi = {
  // ==================== OAuth & Account Management ====================

  /**
   * Get OAuth URL for Facebook/Instagram login
   */
  getOAuthUrl: async (businessId: string): Promise<ApiResponse<OAuthUrlResponse>> => {
    return apiClient.get(`/instagram/auth/url?businessId=${businessId}`);
  },

  /**
   * Handle OAuth callback and exchange code for token
   */
  handleOAuthCallback: async (code: string, state: string): Promise<ApiResponse<any>> => {
    return apiClient.post('/instagram/auth/callback', { code, state });
  },

  /**
   * Connect Instagram account to business
   */
  connectAccount: async (data: ConnectInstagramRequest): Promise<ApiResponse<ConnectAccountResponse>> => {
    return apiClient.post('/instagram/accounts/connect', data);
  },

  /**
   * Get all Instagram accounts for a business
   */
  getAccounts: async (businessId: string): Promise<ApiResponse<InstagramAccount[]>> => {
    return apiClient.get(`/instagram/accounts?businessId=${businessId}`);
  },

  /**
   * Disconnect Instagram account
   */
  disconnectAccount: async (accountId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/instagram/accounts/${accountId}`, {
      data: { accountId },
    });
  },

  /**
   * Refresh access token for an account
   */
  refreshToken: async (accountId: string): Promise<ApiResponse<void>> => {
    return apiClient.post(`/instagram/accounts/${accountId}/refresh`);
  },

  /**
   * Sync account info (followers, media count, etc.)
   */
  syncAccount: async (accountId: string): Promise<ApiResponse<void>> => {
    return apiClient.post(`/instagram/accounts/${accountId}/sync`);
  },

  // ==================== Messaging & Replies ====================

  /**
   * Reply to an Instagram comment
   */
  replyToComment: async (data: ReplyToCommentRequest): Promise<ApiResponse<any>> => {
    return apiClient.post('/instagram/reply/comment', data);
  },

  /**
   * Reply to an Instagram direct message
   */
  replyToMessage: async (data: ReplyToMessageRequest): Promise<ApiResponse<any>> => {
    return apiClient.post('/instagram/reply/message', data);
  },

  /**
   * Get Instagram conversations (DMs)
   */
  getConversations: async (
    accountId: string,
    limit?: number,
    after?: string
  ): Promise<ApiResponse<PaginatedResponse<InstagramConversation>>> => {
    const params = new URLSearchParams({ accountId });
    if (limit) params.append('limit', limit.toString());
    if (after) params.append('after', after);
    return apiClient.get(`/instagram/conversations?${params.toString()}`);
  },

  /**
   * Get messages from a conversation
   */
  getMessages: async (
    conversationId: string,
    accountId: string,
    limit?: number,
    after?: string
  ): Promise<ApiResponse<PaginatedResponse<InstagramMessage>>> => {
    const params = new URLSearchParams({ accountId });
    if (limit) params.append('limit', limit.toString());
    if (after) params.append('after', after);
    return apiClient.get(`/instagram/conversations/${conversationId}/messages?${params.toString()}`);
  },

  /**
   * Delete a comment
   */
  deleteComment: async (commentId: string, accountId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/instagram/comments/${commentId}?accountId=${accountId}`);
  },

  /**
   * Hide/Unhide a comment
   */
  hideComment: async (commentId: string, accountId: string, hide: boolean): Promise<ApiResponse<void>> => {
    return apiClient.post(`/instagram/comments/${commentId}/hide`, {
      commentId,
      accountId,
      hide: hide.toString(),
    });
  },

  // ==================== Media & Posts ====================

  /**
   * Get Instagram posts/media for an account
   */
  getMedia: async (
    accountId: string,
    limit?: number,
    after?: string
  ): Promise<ApiResponse<PaginatedResponse<InstagramMedia>>> => {
    const params = new URLSearchParams({ accountId });
    if (limit) params.append('limit', limit.toString());
    if (after) params.append('after', after);
    return apiClient.get(`/instagram/media?${params.toString()}`);
  },

  /**
   * Get details of a specific media/post
   */
  getMediaDetails: async (
    mediaId: string,
    accountId: string,
    fields?: string
  ): Promise<ApiResponse<InstagramMedia>> => {
    const params = new URLSearchParams({ accountId });
    if (fields) params.append('fields', fields);
    return apiClient.get(`/instagram/media/${mediaId}?${params.toString()}`);
  },

  /**
   * Get comments on a media/post
   */
  getMediaComments: async (
    mediaId: string,
    accountId: string,
    limit?: number,
    after?: string
  ): Promise<ApiResponse<PaginatedResponse<InstagramComment>>> => {
    const params = new URLSearchParams({ accountId });
    if (limit) params.append('limit', limit.toString());
    if (after) params.append('after', after);
    return apiClient.get(`/instagram/media/${mediaId}/comments?${params.toString()}`);
  },

  // ==================== Insights & Analytics ====================

  /**
   * Get account-level insights
   */
  getAccountInsights: async (data: GetAccountInsightsRequest): Promise<ApiResponse<InstagramInsights>> => {
    const params = new URLSearchParams({
      accountId: data.accountId,
      metrics: data.metrics.join(','),
      period: data.period,
    });
    if (data.since) params.append('since', data.since);
    if (data.until) params.append('until', data.until);
    return apiClient.get(`/instagram/insights/account?${params.toString()}`);
  },

  /**
   * Get media-level insights
   */
  getMediaInsights: async (data: GetMediaInsightsRequest): Promise<ApiResponse<InstagramMediaInsights>> => {
    const params = new URLSearchParams({
      accountId: data.accountId,
      metrics: data.metrics.join(','),
    });
    return apiClient.get(`/instagram/insights/media/${data.mediaId}?${params.toString()}`);
  },

  // ==================== Job Status ====================

  /**
   * Get background job status
   */
  getJobStatus: async (): Promise<ApiResponse<JobStatusResponse>> => {
    return apiClient.get('/instagram/jobs/status');
  },

  /**
   * Manually trigger token refresh job
   */
  triggerTokenRefresh: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('/instagram/jobs/refresh-tokens');
  },

  /**
   * Manually trigger insights sync job
   */
  triggerInsightsSync: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('/instagram/jobs/sync-insights');
  },
};
