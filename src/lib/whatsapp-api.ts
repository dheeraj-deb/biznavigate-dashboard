import { apiClient } from './api-client';
import { ApiResponse } from '@/types';

// ==================== Types ====================

export type QualityRating = 'GREEN' | 'YELLOW' | 'RED';
export type MessagingLimitTier = 'TIER_NOT_SET' | 'TIER_50' | 'TIER_250' | 'TIER_1K' | 'TIER_10K' | 'TIER_100K';

export interface WhatsAppAccount {
    account_id: string;
    phone_number_id: string;
    whatsapp_business_account_id: string;
    display_phone_number: string | null;
    verified_name: string | null;
    quality_rating: QualityRating | null;
    messaging_limit_tier: MessagingLimitTier | null;
    is_active: boolean;
    created_at: string;
}

// Mapped is identical to the API shape — no transformation needed
export type WhatsAppAccountMapped = WhatsAppAccount;

export type GetAccountsResponse = WhatsAppAccount[];

// ==================== API ====================

export const whatsappApi = {
    /**
     * Get all WhatsApp accounts for a business
     */
    getAccounts: async (businessId: string): Promise<ApiResponse<GetAccountsResponse>> => {
        return apiClient.get(`/whatsapp/accounts?businessId=${businessId}`);
    },

    /**
     * Disconnect (delete) a WhatsApp account
     */
    disconnectAccount: async (
        accountId: string,
        businessId: string
    ): Promise<ApiResponse<void>> => {
        return apiClient.delete(`/whatsapp/accounts/${accountId}`, {
            data: { businessId },
        });
    },
};
