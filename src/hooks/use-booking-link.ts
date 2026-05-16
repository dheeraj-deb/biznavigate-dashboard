import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api-client'

export type BookingLinkExperience = 'hospitality' | 'events' | 'services' | 'healthcare' | 'education' | 'products' | 'generic'
export type BookingLinkPaymentMode = 'manual' | 'advance' | 'full'
export type BookingLinkAdvanceType = 'fixed' | 'percentage'

export interface BookingLinkConfig {
  enabled: boolean
  slug: string
  experience_type: BookingLinkExperience
  payment_mode: BookingLinkPaymentMode
  advance_type: BookingLinkAdvanceType
  advance_amount: number
  theme: { primary_color: string; show_logo: boolean; show_banner: boolean }
  policies: { cancellation: string; refund: string; terms: string }
  contact: { phone: string; whatsapp: string; address: string }
  required_fields: { name: boolean; phone: boolean; email: boolean; address: boolean; notes: boolean }
}

export const defaultBookingLink: BookingLinkConfig = {
  enabled: false,
  slug: '',
  experience_type: 'generic',
  payment_mode: 'manual',
  advance_type: 'fixed',
  advance_amount: 0,
  theme: { primary_color: '#0066FF', show_logo: true, show_banner: true },
  policies: { cancellation: '', refund: '', terms: '' },
  contact: { phone: '', whatsapp: '', address: '' },
  required_fields: { name: true, phone: true, email: false, address: false, notes: false },
}

function unwrap<T>(response: any): T {
  return (response?.data?.data ?? response?.data ?? response) as T
}

export function normalizeBookingLink(input?: Partial<BookingLinkConfig> | null): BookingLinkConfig {
  return {
    ...defaultBookingLink,
    ...(input ?? {}),
    theme: { ...defaultBookingLink.theme, ...(input?.theme ?? {}) },
    policies: { ...defaultBookingLink.policies, ...(input?.policies ?? {}) },
    contact: { ...defaultBookingLink.contact, ...(input?.contact ?? {}) },
    required_fields: { ...defaultBookingLink.required_fields, ...(input?.required_fields ?? {}) },
  }
}

export function publicBookingUrl(slug: string) {
  if (typeof window === 'undefined') return `/book/${slug}`
  return `${window.location.origin}/book/${slug}`
}

export function useBookingLink() {
  return useQuery({
    queryKey: ['booking-link'],
    queryFn: async () => {
      const response = await apiClient.get('/business-settings/booking-link')
      return normalizeBookingLink(unwrap<BookingLinkConfig>(response))
    },
    retry: 1,
  })
}

export function useUpdateBookingLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: BookingLinkConfig) => {
      const response = await apiClient.patch('/business-settings/booking-link', data)
      return normalizeBookingLink(unwrap<BookingLinkConfig>(response))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-link'] })
      toast.success('Booking link settings updated')
    },
    onError: (error: any) => {
      toast.error(error?.message || error?.response?.data?.message || 'Failed to update booking link')
    },
  })
}
