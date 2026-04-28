import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, WhatsAppAccount, WhatsAppAccountMapped } from '@/lib/whatsapp-api';
import { toast } from 'react-hot-toast';

// ==================== Query Keys ====================

export const whatsappKeys = {
    all: ['whatsapp'] as const,
    accounts: (businessId: string) => [...whatsappKeys.all, 'accounts', businessId] as const,
    pipeline: (gupshupAppId: string) => [...whatsappKeys.all, 'pipeline', gupshupAppId] as const,
};

// ==================== Queries ====================

/**
 * Hook to fetch WhatsApp accounts for a business.
 * Returns the first active account and a boolean `isConnected`.
 *
 * `isConnected` — true only when at least one account is LIVE (not pending provisioning).
 * `isPending`   — true when an account exists but Gupshup is still provisioning it.
 */
export function useWhatsAppAccounts(businessId: string) {
    return useQuery({
        queryKey: whatsappKeys.accounts(businessId),
        queryFn: async () => {
            const response = await whatsappApi.getAccounts(businessId);
            const body = (response as any)?.data;
            // Axios wraps body in .data; API returns { data: [...] }
            const raw: any[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
            const data: WhatsAppAccountMapped[] = raw.map((acc) => ({
                ...acc,
                display_phone_number: acc.display_phone_number ?? acc.username ?? null,
                verified_name: acc.verified_name ?? null,
                quality_rating: acc.quality_rating ?? null,
                messaging_limit: acc.messaging_limit ?? null,
            }));
            return data;
        },
        enabled: !!businessId,
        staleTime: 5 * 60 * 1000,       // 5 minutes
        refetchInterval: 5 * 60 * 1000,  // poll every 5 minutes
        refetchOnWindowFocus: true,
        select: (data: WhatsAppAccountMapped[]) => {
            // "live" = is_active AND (no TPP account OR gupshup_app_status is live)
            const liveAccount = data.find(
                (acc) => acc.is_active && (acc.gupshup_app_status === 'live' || acc.gupshup_app_status === null)
            ) ?? null;
            // "pending" = account exists but Gupshup still provisioning
            const pendingAccount = data.find(
                (acc) => acc.gupshup_app_status === 'pending'
            ) ?? null;

            const stuckAccount = data.find(
                (acc) => acc.gupshup_app_status === 'stuck'
            ) ?? null;

            return {
                raw: data,
                account: liveAccount ?? pendingAccount ?? stuckAccount ?? data[0] ?? null,
                isConnected: liveAccount !== null,
                isPending: pendingAccount !== null && liveAccount === null,
                hasError: data.some((acc) => acc.gupshup_app_status === 'error'),
                isStuck: stuckAccount !== null && liveAccount === null,
            };
        },
    });
}

/**
 * Poll Gupshup pipeline status while an account is pending provisioning.
 * Only runs when `gupshupAppId` is provided. Stops polling once live/error.
 */
export function useGupshupPipelineStatus(gupshupAppId: string | null | undefined) {
    return useQuery({
        queryKey: whatsappKeys.pipeline(gupshupAppId ?? ''),
        queryFn: async () => {
            const response = await whatsappApi.getGupshupPipelineStatus(gupshupAppId!);
            return (response as any)?.data ?? response;
        },
        enabled: !!gupshupAppId,
        // Poll every 15 seconds while pending
        refetchInterval: (query) => {
            const stage = query.state.data?.whatsapp?.creationStage;
            if (stage === 'WHATSAPP_PROVISIONING_DONE' || stage === 'ERROR' || stage === 'INITIAL') {
                return false; // stop polling — INITIAL means stuck on Gupshup's side
            }
            return 15_000;
        },
    });
}

// ==================== Mutations ====================

/**
 * Hook to disconnect a WhatsApp account.
 */
export function useDisconnectWhatsAppAccount(businessId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (accountId: string) =>
            whatsappApi.disconnectAccount(accountId, businessId),
        onSuccess: () => {
            toast.success('WhatsApp account disconnected');
            queryClient.invalidateQueries({ queryKey: whatsappKeys.accounts(businessId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to disconnect WhatsApp account');
        },
    });
}
