export interface InstagramAccount {
  account_id: string;
  platform_user_id: string;
  username: string;
  profile_picture?: string;
  follower_count?: number;
  following_count?: number;
  media_count?: number;
  token_expiry?: string;
  last_synced_at?: string;
  created_at: string;
}

export interface InstagramMedia {
  media_id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comment_count?: number;
  impressions?: number;
  reach?: number;
  engagement?: number;
  saved?: number;
  video_views?: number;
}

export interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  from: {
    id: string;
    username: string;
  };
  replies?: InstagramComment[];
}

export interface InstagramConversation {
  conversation_id: string;
  platform_conversation_id: string;
  participant_id: string;
  participant_username?: string;
  participant_name?: string;
  last_message_text?: string;
  last_message_at?: string;
  unread_count: number;
  is_active: boolean;
  created_at: string;
}

export interface InstagramMessage {
  id: string;
  created_time: string;
  from: {
    id: string;
    username?: string;
  };
  to: {
    id: string;
  };
  message: {
    text: string;
  };
}

export interface InstagramInsights {
  // Core metrics
  follower_count?: number;
  reach?: number;
  profile_views?: number;
  website_clicks?: number;

  // Engagement metrics
  online_followers?: number;
  accounts_engaged?: number;
  total_interactions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  replies?: number;

  // Demographics (these return arrays/objects)
  engaged_audience_demographics?: any;
  reached_audience_demographics?: any;
  follower_demographics?: any;

  // Profile actions
  follows_and_unfollows?: number;
  profile_links_taps?: number;

  // Content metrics
  views?: number;

  // Threads metrics
  threads_likes?: number;
  threads_replies?: number;
  reposts?: number;
  quotes?: number;
  threads_followers?: number;
  threads_follower_demographics?: any;
  content_views?: number;
  threads_views?: number;
  threads_clicks?: number;
  threads_reposts?: number;
}

export interface InstagramMediaInsights {
  engagement?: number;
  impressions?: number;
  reach?: number;
  saved?: number;
  video_views?: number;
  shares?: number;
  comments?: number;
  likes?: number;
}

export interface ConnectInstagramRequest {
  facebookPageId: string;
  accessToken: string;
  businessId: string;
}

export interface ReplyToCommentRequest {
  commentId: string;
  message: string;
  accountId: string;
}

export interface ReplyToMessageRequest {
  recipientId: string;
  message: string;
  accountId: string;
}

export interface GetAccountInsightsRequest {
  accountId: string;
  metrics: string[];
  period: 'day' | 'week' | 'days_28';
  since?: string;
  until?: string;
}

export interface GetMediaInsightsRequest {
  mediaId: string;
  accountId: string;
  metrics: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}

export interface OAuthUrlResponse {
  url: string;
}

export interface ConnectAccountResponse {
  accountId: string;
  username: string;
  followersCount: number;
}

export interface JobStatusResponse {
  tokenRefresh: {
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    waiting: number;
  };
  insightsSync: {
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    waiting: number;
  };
}
