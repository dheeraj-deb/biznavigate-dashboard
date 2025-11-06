'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/store/auth-store';
import {
  useInstagramAccounts,
  useInstagramOAuthUrl,
  useDisconnectInstagramAccount,
  useRefreshInstagramToken,
  useSyncInstagramAccount,
  useConnectInstagramAccount,
} from '@/hooks/use-instagram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Instagram, RefreshCw, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function InstagramSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const businessId = user?.business_id || '';

  const { data: accounts, isLoading, refetch } = useInstagramAccounts(businessId);
  const { data: oauthUrl } = useInstagramOAuthUrl(businessId);
  const disconnectMutation = useDisconnectInstagramAccount(businessId);
  const refreshTokenMutation = useRefreshInstagramToken(businessId);
  const syncAccountMutation = useSyncInstagramAccount(businessId);
  const connectAccountMutation = useConnectInstagramAccount();

  // Handle OAuth callback
  useState(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      // Exchange code for access token
      fetch(`/api/instagram/callback?code=${code}&state=${state}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast.success('Instagram account connected successfully!');
            router.replace('/settings/instagram');
            refetch();
          } else {
            toast.error('Failed to connect Instagram account');
          }
        })
        .catch(() => {
          toast.error('Failed to connect Instagram account');
        });
    }
  });

  console.log("businessId", businessId)

  const handleConnectInstagram = () => {
    if (oauthUrl) {
      // Open OAuth URL in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        oauthUrl,
        'Instagram Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    }
  };

  const handleDisconnect = async (accountId: string) => {
    await disconnectMutation.mutateAsync(accountId);
  };

  const handleRefreshToken = async (accountId: string) => {
    await refreshTokenMutation.mutateAsync(accountId);
  };

  const handleSyncAccount = async (accountId: string) => {
    await syncAccountMutation.mutateAsync(accountId);
  };

  const getTokenExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', text: 'Unknown', variant: 'secondary' as const };

    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', text: 'Expired', variant: 'destructive' as const };
    } else if (daysUntilExpiry < 7) {
      return { status: 'expiring-soon', text: `Expires in ${daysUntilExpiry} days`, variant: 'warning' as const };
    } else {
      return { status: 'valid', text: `Expires in ${daysUntilExpiry} days`, variant: 'success' as const };
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Instagram Integration</h1>
        <p className="text-muted-foreground">
          Connect and manage your Instagram Business accounts for automated messaging and analytics.
        </p>
      </div>

      {/* Connect New Account */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connect Instagram Account</CardTitle>
          <CardDescription>
            Connect your Instagram Business or Creator account via Facebook to start receiving and responding to messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConnectInstagram}
            disabled={!oauthUrl}
            className="flex items-center gap-2"
          >
            <Instagram className="w-4 h-4" />
            Connect via Facebook
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Note: You need to have your Instagram account connected to a Facebook Page.
          </p>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Connected Accounts</h2>

        {!accounts || accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Instagram className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Instagram accounts connected</p>
              <p className="text-muted-foreground text-center max-w-md">
                Connect your Instagram Business account to start managing messages, comments, and analytics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => {
              const tokenStatus = getTokenExpiryStatus(account.token_expiry);

              return (
                <Card key={account.account_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={account.profile_picture} alt={account.username} />
                          <AvatarFallback>
                            <Instagram className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">@{account.username}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {account.follower_count?.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                      <Badge variant={tokenStatus.variant}>
                        {tokenStatus.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Account Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center py-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Following</p>
                          <p className="font-semibold">{account.following_count?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Posts</p>
                          <p className="font-semibold">{account.media_count?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Synced</p>
                          <p className="font-semibold text-xs">
                            {account.last_synced_at
                              ? formatDistanceToNow(new Date(account.last_synced_at), { addSuffix: true })
                              : 'Never'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncAccount(account.account_id)}
                          disabled={syncAccountMutation.isPending}
                          className="flex-1"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync
                        </Button>

                        {tokenStatus.status !== 'valid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefreshToken(account.account_id)}
                            disabled={refreshTokenMutation.isPending}
                            className="flex-1"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Refresh Token
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Disconnect Instagram Account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to disconnect @{account.username}? You won't be able to
                                receive or respond to messages from this account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDisconnect(account.account_id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Disconnect
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Connected Date */}
                      <p className="text-xs text-muted-foreground">
                        Connected {format(new Date(account.created_at), 'PPP')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Information Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Access tokens expire after 60 days and need to be refreshed.</p>
          <p>• Only Instagram Business and Creator accounts can be connected.</p>
          <p>• Your Instagram account must be linked to a Facebook Page.</p>
          <p>• You need the following permissions: instagram_basic, instagram_manage_comments, instagram_manage_messages.</p>
          <p>• Webhooks are automatically configured to receive comments, messages, and mentions.</p>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
