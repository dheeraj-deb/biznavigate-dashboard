'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/store/auth-store';
import {
  useInstagramAccounts,
  useInstagramMedia,
  useInstagramAccountInsights,
} from '@/hooks/use-instagram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Instagram,
  Users,
  Eye,
  TrendingUp,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

export default function InstagramAnalyticsPage() {
  const { user } = useAuthStore();
  const businessId = user?.business_id || '';
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts(businessId);
  const { data: mediaData, isLoading: mediaLoading } = useInstagramMedia(
    selectedAccountId,
    25
  );
  const { data: insights, isLoading: insightsLoading } = useInstagramAccountInsights({
    accountId: selectedAccountId,
    metrics: ['reach', 'follower_count', 'profile_views', 'website_clicks'],
    period: 'day',
  });

  // Set first account as default
  if (accounts && accounts.length > 0 && !selectedAccountId) {
    setSelectedAccountId(accounts[0].account_id);
  }

  const selectedAccount = accounts?.find((acc) => acc.account_id === selectedAccountId);

  if (accountsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Instagram className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Instagram Accounts Connected</h2>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Connect your Instagram Business account in Settings to view analytics.
              </p>
              <a
                href="/settings/instagram"
                className="text-primary hover:underline"
              >
                Go to Settings →
              </a>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Extract real insights data
  const reach = insights?.reach || 0;
  const profileViews = insights?.profile_views || 0;
  const websiteClicks = insights?.website_clicks || 0;
  const followerCount = insights?.follower_count || selectedAccount?.follower_count || 0;

  // Calculate engagement metrics from media data
  const totalLikes = mediaData?.data?.reduce((sum, media) => sum + (media.like_count || 0), 0) || 0;
  const totalComments = mediaData?.data?.reduce((sum, media) => sum + (media.comment_count || 0), 0) || 0;
  const totalEngagement = totalLikes + totalComments;
  const engagementRate = followerCount > 0 ? ((totalEngagement / followerCount) * 100).toFixed(1) : '0.0';

  // Aggregate media stats by day for charts (last 7 posts approximation)
  const recentMedia = mediaData?.data?.slice(0, 7) || [];
  const engagementChartData = recentMedia.map((media, index) => ({
    date: format(new Date(media.timestamp), 'EEE'),
    likes: media.like_count || 0,
    comments: media.comment_count || 0,
    shares: 0, // Instagram API doesn't provide share count directly
  })).reverse();

  const reachChartData = recentMedia.map((media, index) => ({
    date: format(new Date(media.timestamp), 'EEE'),
    reach: media.reach || 0,
    views: media.impressions || 0,
  })).reverse();

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Instagram Analytics</h1>
        <p className="text-muted-foreground">
          Track your Instagram performance and engagement metrics
        </p>
      </div>

      {/* Account Selector */}
      {accounts.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.account_id} value={account.account_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={account.profile_picture} />
                        <AvatarFallback>
                          <Instagram className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      @{account.username}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Selected Account Overview */}
      {selectedAccount && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedAccount.profile_picture} />
                  <AvatarFallback>
                    <Instagram className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">@{selectedAccount.username}</CardTitle>
                  <CardDescription>Instagram Business Account</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">
                Last synced: {format(new Date(selectedAccount.last_synced_at || new Date()), 'PPp')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Followers</p>
                <p className="text-3xl font-bold">
                  {selectedAccount.follower_count?.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Following</p>
                <p className="text-3xl font-bold">
                  {selectedAccount.following_count?.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Posts</p>
                <p className="text-3xl font-bold">
                  {selectedAccount.media_count?.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="text-2xl font-bold text-muted-foreground">-</div>
                ) : (
                  <div className="text-2xl font-bold">{reach.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Unique accounts reached
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Website Clicks</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="text-2xl font-bold text-muted-foreground">-</div>
                ) : (
                  <div className="text-2xl font-bold">{websiteClicks.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Profile link clicks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {mediaLoading ? (
                  <div className="text-2xl font-bold text-muted-foreground">-</div>
                ) : (
                  <div className="text-2xl font-bold">{engagementRate}%</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {totalEngagement.toLocaleString()} total interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="text-2xl font-bold text-muted-foreground">-</div>
                ) : (
                  <div className="text-2xl font-bold">{profileViews.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Profile visits today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reach & Views</CardTitle>
                <CardDescription>Last {recentMedia.length} posts</CardDescription>
              </CardHeader>
              <CardContent>
                {mediaLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reachChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reachChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="reach" stroke="#8b5cf6" strokeWidth={2} name="Reach" />
                      <Line type="monotone" dataKey="views" stroke="#ec4899" strokeWidth={2} name="Impressions" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
                <CardDescription>Last {recentMedia.length} posts</CardDescription>
              </CardHeader>
              <CardContent>
                {mediaLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : engagementChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="likes" fill="#ec4899" name="Likes" />
                      <Bar dataKey="comments" fill="#8b5cf6" name="Comments" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
              <CardDescription>Your most engaging content</CardDescription>
            </CardHeader>
            <CardContent>
              {mediaLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaData?.data?.slice(0, 6).map((media) => (
                    <Card key={media.id} className="overflow-hidden">
                      <div className="aspect-square relative bg-muted">
                        {media.media_url && (
                          <img
                            src={media.media_url}
                            alt={media.caption || 'Instagram post'}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {media.media_type === 'VIDEO' && (
                          <div className="absolute top-2 right-2">
                            <PlayCircle className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm line-clamp-2 mb-2">
                          {media.caption || 'No caption'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {media.like_count?.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {media.comment_count?.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Follower Growth</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Follower growth data will be available here
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
                <CardDescription>Top locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Demographic data will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}
