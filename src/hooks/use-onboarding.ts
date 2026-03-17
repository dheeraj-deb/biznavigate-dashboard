import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnboardingEmployee {
  name: string
  email: string
  phone?: string
  role: string
}

export interface OnboardingPayload {
  business_name: string
  business_type: string
  email: string
  phone: string
  website?: string
  city: string
  address?: string
  country: string
  gst_number?: string
  pan_number?: string
  whatsapp_number?: string
  employees: OnboardingEmployee[]
}

export interface OnboardingBusiness {
  business_id: string
  tenant_id: string
  business_name: string
  business_type: string
  email: string
  phone: string
  website: string | null
  city: string
  address: string | null
  country: string
  gst_number: string | null
  pan_number: string | null
  whatsapp_number: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingEmployeeResult {
  user_id: string
  name: string
  email: string
  phone: string | null
  role: string
  temp_password: string
}

export interface OnboardingResult {
  business: OnboardingBusiness
  employees_created: OnboardingEmployeeResult[]
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: async (payload: OnboardingPayload): Promise<OnboardingResult> => {
      const response = await apiClient.post('/api/v1/onboarding/complete', payload)
      const body = response.data as { success?: boolean; data?: OnboardingResult; message?: string } & Partial<OnboardingResult>
      if (body.success === false) throw new Error(body.message || 'Onboarding failed')
      // Handle both { data: { business, employees_created } } and { business, employees_created } shapes
      return body.data ?? (body as unknown as OnboardingResult)
    },
    onSuccess: () => {
      toast.success('Onboarding complete! 🎉', { position: 'top-center' })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to complete onboarding', { position: 'top-center' })
    },
  })
}
