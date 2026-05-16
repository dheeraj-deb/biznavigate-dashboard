import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api-client'

export interface BookingMethodsConfig {
  availability_response: {
    mode: 'interactive' | 'flow' | 'text' | 'website_link'
  }
  ai_chat: {
    enabled: boolean
    collect_guest_details: boolean
    require_confirmation: boolean
  }
  interactive: {
    enabled: boolean
    send_entry_buttons: boolean
    send_room_or_service_list: boolean
  }
  catalog: {
    enabled: boolean
    send_product_messages: boolean
  }
  templates: {
    enabled: boolean
    confirmation_template_name: string
    reminder_template_name: string
    language: string
  }
  human_handoff: {
    enabled: boolean
    on_unavailable: boolean
    on_low_confidence: boolean
    on_payment_issue: boolean
  }
}

export const defaultBookingMethods: BookingMethodsConfig = {
  availability_response: {
    mode: 'interactive',
  },
  ai_chat: {
    enabled: true,
    collect_guest_details: true,
    require_confirmation: true,
  },
  interactive: {
    enabled: true,
    send_entry_buttons: true,
    send_room_or_service_list: true,
  },
  catalog: {
    enabled: false,
    send_product_messages: false,
  },
  templates: {
    enabled: false,
    confirmation_template_name: '',
    reminder_template_name: '',
    language: 'en',
  },
  human_handoff: {
    enabled: true,
    on_unavailable: true,
    on_low_confidence: true,
    on_payment_issue: true,
  },
}

function unwrap<T>(response: any): T {
  return (response?.data?.data ?? response?.data ?? response) as T
}

export function normalizeBookingMethods(input?: Partial<BookingMethodsConfig> | null): BookingMethodsConfig {
  return {
    availability_response: { ...defaultBookingMethods.availability_response, ...(input?.availability_response ?? {}) },
    ai_chat: { ...defaultBookingMethods.ai_chat, ...(input?.ai_chat ?? {}) },
    interactive: { ...defaultBookingMethods.interactive, ...(input?.interactive ?? {}) },
    catalog: { ...defaultBookingMethods.catalog, ...(input?.catalog ?? {}) },
    templates: { ...defaultBookingMethods.templates, ...(input?.templates ?? {}) },
    human_handoff: { ...defaultBookingMethods.human_handoff, ...(input?.human_handoff ?? {}) },
  }
}

export function useBookingMethods() {
  return useQuery({
    queryKey: ['booking-methods'],
    queryFn: async () => {
      const response = await apiClient.get('/business-settings/booking-methods')
      return normalizeBookingMethods(unwrap<BookingMethodsConfig>(response))
    },
    retry: 1,
  })
}

export function useUpdateBookingMethods() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BookingMethodsConfig) => {
      const response = await apiClient.patch('/business-settings/booking-methods', data)
      return normalizeBookingMethods(unwrap<BookingMethodsConfig>(response))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-methods'] })
      toast.success('Booking methods updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update booking methods')
    },
  })
}
