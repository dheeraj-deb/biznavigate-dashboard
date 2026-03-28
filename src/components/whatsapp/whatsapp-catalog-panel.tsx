'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  useWhatsAppCatalogStatus,
  useSyncCatalog,
} from '@/hooks/use-whatsapp-catalog';

interface WhatsAppCatalogPanelProps {
  businessId: string;
  selectedProductIds?: string[];
}

export function WhatsAppCatalogPanel({
  businessId,
  selectedProductIds = [],
}: WhatsAppCatalogPanelProps) {
  const { data: status, isLoading: statusLoading } = useWhatsAppCatalogStatus(businessId);
  const syncMutation = useSyncCatalog();

  const handleSync = () => {
    syncMutation.mutate({
      businessId,
      productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
    });
  };

  const stats = status?.stats || {};
  const totalInCatalog =
    (stats.synced || 0) +
    (stats.pending || 0) +
    (stats.syncing || 0) +
    (stats.failed || 0);

  const isSyncing = (stats.syncing || 0) > 0;

  return (
    <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-green-900 dark:text-green-100">
              WhatsApp Catalog
            </CardTitle>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending || isSyncing || totalInCatalog === 0}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {syncMutation.isPending || isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync to WhatsApp
              </>
            )}
          </Button>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {selectedProductIds.length > 0
            ? `Sync ${selectedProductIds.length} selected products`
            : 'Sync all catalog products to WhatsApp Commerce Manager'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        {statusLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Total in Catalog */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  In Catalog
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalInCatalog}
              </div>
            </div>

            {/* Synced */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Synced
                </span>
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.synced || 0}
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                  Pending
                </span>
              </div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {stats.pending || 0}
              </div>
            </div>

            {/* Syncing */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw
                  className={`h-4 w-4 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`}
                />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Syncing
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.syncing || 0}
              </div>
            </div>

            {/* Failed */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  Failed
                </span>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stats.failed || 0}
              </div>
            </div>
          </div>
        )}

        {/* Last Sync Info */}
        {status?.lastSyncAt && (
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Last synced: {new Date(status.lastSyncAt).toLocaleString()}
          </div>
        )}

        {/* Info Alert */}
        {totalInCatalog === 0 ? (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              No products in catalog. Use the checkboxes below to add products to your
              WhatsApp catalog.
            </AlertDescription>
          </Alert>
        ) : (stats.pending || 0) > 0 || (stats.failed || 0) > 0 ? (
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              {(stats.pending || 0) > 0 && (
                <span>
                  {stats.pending} products pending sync.{' '}
                </span>
              )}
              {(stats.failed || 0) > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  {stats.failed} products failed to sync.
                </span>
              )}
              {' '}Click "Sync to WhatsApp" to update.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
