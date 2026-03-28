import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, WhatsAppAccountMapped } from '@/lib/whatsapp-api';
import { toast } from 'react-hot-toast';

// ==================== Query Keys ====================

export const whatsappKeys = {
    all: ['whatsapp'] as const,
    accounts: (businessId: string) => [...whatsappKeys.all, 'accounts', businessId] as const,
};

// ==================== Helpers ====================

function mapAccount(raw: any): WhatsAppAccountMapped {
    return {
        account_id: raw.account_id,
        phone_number: raw.username,
        display_phone_number: raw.username,
        display_name: raw.display_name || 'WhatsApp Business',
        phone_number_id: raw.page_id,
        whatsapp_business_account_id: raw.instagram_business_account_id,
        quality_rating: 'GREEN',
        messaging_limit_tier: 'TIER_1K',
        is_verified: true,
        is_active: raw.is_active,
        webhook_verified: true,
        last_message_at: raw.updated_at,
        created_at: raw.created_at,
        api_key_id: raw.page_id,
    };
}

// ==================== Queries ====================

/**
 * Hook to fetch WhatsApp accounts for a business.
 * Returns the first active account (mapped) and a boolean `isConnected`.
 */
export function useWhatsAppAccounts(businessId: string) {
    return useQuery({
        queryKey: whatsappKeys.accounts(businessId),
        queryFn: async () => {
            const response = await whatsappApi.getAccounts(businessId);
            const data: any[] = (response as any)?.data?.data || (response as any)?.data || [];
            return data;
        },
        enabled: !!businessId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        select: (data: any[]) => {
            const activeAccount = data.find((acc) => acc.is_active) || data[0];
            return {
                raw: data,
                account: activeAccount ? mapAccount(activeAccount) : null,
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
