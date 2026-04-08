import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, WhatsAppAccount, WhatsAppAccountMapped } from '@/lib/whatsapp-api';
import { toast } from 'react-hot-toast';

// ==================== Query Keys ====================

export const whatsappKeys = {
    all: ['whatsapp'] as const,
    accounts: (businessId: string) => [...whatsappKeys.all, 'accounts', businessId] as const,
};

// ==================== Queries ====================

/**
 * Hook to fetch WhatsApp accounts for a business.
 * Returns the first active account and a boolean `isConnected`.
 * Polls every 5 minutes and refetches on window focus (quality_rating can change).
 */
export function useWhatsAppAccounts(businessId: string) {
    return useQuery({
        queryKey: whatsappKeys.accounts(businessId),
        queryFn: async () => {
            const response = await whatsappApi.getAccounts(businessId);
            const body = (response as any)?.data;
            // Axios wraps body in .data; API returns array directly
            const data: WhatsAppAccountMapped[] = Array.isArray(body) ? body : [];
            return data;
        },
        enabled: !!businessId,
        staleTime: 5 * 60 * 1000,       // 5 minutes
        refetchInterval: 5 * 60 * 1000,  // poll every 5 minutes
        refetchOnWindowFocus: true,
        select: (data: WhatsAppAccountMapped[]) => {
            const activeAccount = data.find((acc) => acc.is_active) ?? data[0] ?? null;
            return {
                raw: data,
                account: activeAccount,
                isConnected: data.length > 0,
            };
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
