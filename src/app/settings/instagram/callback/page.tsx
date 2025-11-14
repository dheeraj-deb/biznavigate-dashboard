'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * OAuth callback page for Instagram
 * This page is loaded after Facebook OAuth redirect (via backend)
 * It completes the Instagram account connection and notifies the parent window
 */
export default function InstagramCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting Instagram Account...');

  useEffect(() => {
    const success = searchParams.get('success');
    const accessToken = searchParams.get('access_token');
    const expiresIn = searchParams.get('expires_in');
    const businessId = searchParams.get('business_id');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      // OAuth error from backend
      setStatus('error');
      setMessage(errorDescription || 'Authorization failed');

      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'INSTAGRAM_OAUTH_ERROR',
            error: error,
            errorDescription: errorDescription || 'Authorization failed',
          },
          window.location.origin
        );
      }
      setTimeout(() => window.close(), 3000);
      return;
    }

    if (success === 'true' && accessToken && businessId) {
      // Success - now need to get Facebook pages and connect Instagram account
      setMessage('Getting your Facebook pages...');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Get user's Facebook pages
      fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
        .then((res) => res.json())
        .then((pagesData) => {
          if (pagesData.data && pagesData.data.length > 0) {
            // For now, check each page for Instagram Business Account
            setMessage('Finding Instagram Business Account...');

            // Get Instagram accounts for all pages
            const pagePromises = pagesData.data.map((page: any) =>
              fetch(
                `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
              ).then((res) => res.json())
            );

            return Promise.all(pagePromises).then((results) => {
              const pageWithInstagram = results.find((page) => page.instagram_business_account);

              if (!pageWithInstagram) {
                throw new Error(
                  'No Instagram Business Account found. Make sure your Instagram account is connected to a Facebook Page and is a Business account.'
                );
              }

              // Find the original page data with access token
              const originalPage = pagesData.data.find((p: any) => p.id === pageWithInstagram.id);

              setMessage('Connecting Instagram account...');

              // Send data to parent window to make the API call (parent has JWT token)
              if (window.opener) {
                window.opener.postMessage(
                  {
                    type: 'INSTAGRAM_CONNECT_ACCOUNT',
                    data: {
                      facebookPageId: pageWithInstagram.id,
                      accessToken: originalPage.access_token,
                      businessId: businessId,
                    },
                  },
                  window.location.origin
                );
              }

              // Return a resolved promise to continue the chain
              return Promise.resolve({ success: true });
            });
          } else {
            throw new Error('No Facebook pages found. Please create a Facebook Page and link your Instagram account to it.');
          }
        })
        .then((data) => {
          if (data && data.success) {
            // Wait for parent to complete the connection
            setMessage('Finalizing connection...');
            // Parent window will handle the actual connection
            // Just wait a bit for the message to be sent
            setTimeout(() => {
              setStatus('success');
              setMessage('Instagram account connected successfully!');
              setTimeout(() => window.close(), 2000);
            }, 1000);
          } else {
            throw new Error('Failed to process Instagram account');
          }
        })
        .catch((err) => {
          setStatus('error');
          setMessage(err.message || 'Failed to connect Instagram account');

          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'INSTAGRAM_OAUTH_ERROR',
                error: 'connection_failed',
                errorDescription: err.message || 'Failed to connect Instagram account',
              },
              window.location.origin
            );
          }
          setTimeout(() => window.close(), 3000);
        });
    } else {
      // Missing required parameters
      setStatus('error');
      setMessage('Invalid callback parameters');

      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'INSTAGRAM_OAUTH_ERROR',
            error: 'invalid_request',
            errorDescription: 'Invalid callback parameters',
          },
          window.location.origin
        );
      }
      setTimeout(() => window.close(), 3000);
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md px-4">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{message}</h2>
            <p className="text-muted-foreground">Please wait while we complete the connection.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{message}</h2>
            <p className="text-muted-foreground">This window will close automatically.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">This window will close automatically.</p>
          </>
        )}
      </div>
    </div>
  );
}
