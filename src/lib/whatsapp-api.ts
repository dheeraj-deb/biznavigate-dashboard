import { apiClient } from './api-client';
import { ApiResponse } from '@/types';

// ==================== Types ====================

export type QualityRating = 'GREEN' | 'YELLOW' | 'RED';
export type MessagingLimitTier = 'TIER_NOT_SET' | 'TIER_50' | 'TIER_250' | 'TIER_1K' | 'TIER_2K' | 'TIER_10K' | 'TIER_100K';
/** TPP onboarding provisioning state. "pending" = Gupshup still provisioning; "live" = fully active; "error" = provisioning failed */
export type GupshupAppStatus = 'pending' | 'live' | 'error';

export interface WhatsAppAccount {
    account_id: string;
    phone_number_id: string;
    whatsapp_business_account_id: string;
    display_phone_number: string | null;
    verified_name: string | null;
    quality_rating: QualityRating | null;
    messaging_limit: MessagingLimitTier | null;
    is_active: boolean;
    created_at: string;
    /** Gupshup app UUID assigned after TPP onboarding Step 1 */
    gupshup_app_id: string | null;
    /** TPP provisioning state. null = not a TPP account */
    gupshup_app_status: GupshupAppStatus | null;
}

// Mapped is identical to the API shape — no transformation needed
export type WhatsAppAccountMapped = WhatsAppAccount;

export type GetAccountsResponse = WhatsAppAccount[];

export interface GupshupPipelineStatusResponse {
    status: string;
    whatsapp?: {
        creationStage: string;
        pipeLineStage: string;
        embedStage: string;
        whatsappVerificationStatus: string;
    };
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

    /**
     * Poll Gupshup pipeline status for a TPP-onboarded app.
     * Returns the provisioning stage. Call until creationStage === "WHATSAPP_PROVISIONING_DONE".
     */
    getGupshupPipelineStatus: async (gupshupAppId: string): Promise<ApiResponse<GupshupPipelineStatusResponse>> => {
        return apiClient.get(`/gupshup/onboarding/pipeline-status/${gupshupAppId}`);
    },
};
