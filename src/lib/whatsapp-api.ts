import { apiClient } from './api-client';
import { ApiResponse } from '@/types';

// ==================== Types ====================

export interface WhatsAppAccount {
    account_id: string;
    username: string;
    display_name: string;
    page_id: string;
    instagram_business_account_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface WhatsAppAccountMapped {
    account_id: string;
    phone_number: string;
    display_phone_number: string;
    display_name: string;
    phone_number_id: string;
    whatsapp_business_account_id?: string;
    quality_rating: string;
    messaging_limit_tier: string;
    is_verified: boolean;
    is_active: boolean;
    webhook_verified: boolean;
    last_message_at: string;
    created_at: string;
    api_key_id: string;
}

export interface GetAccountsResponse {
    data: WhatsAppAccount[];
}

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
