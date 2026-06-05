'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api-client'

function unwrap<T>(response: any): T {
  return (response?.data?.data ?? response?.data ?? response) as T
}

function syncPendingWhatsAppCatalog() {
  void apiClient.post('/whatsapp/catalog/sync', {}).catch(() => undefined)
}

export interface AppointmentAvailabilityWindow {
  availability_id?: string
  sales_staff_id?: string
  day_of_week: number
  start_time: string
  end_time: string
  window_type?: 'working' | 'lunch' | 'break' | 'blocked' | string
  label?: string
  is_active?: boolean
}

export interface AppointmentSalesStaff {
  sales_staff_id?: string
  name: string
  phone?: string
  email?: string
  role?: string
  title?: string
  priority?: number
  is_active?: boolean
  availability?: AppointmentAvailabilityWindow[]
}

export interface AppointmentSalesListing {
  item_id?: string
  name: string
  description?: string
  price: number
  category?: string
  primary_image_url?: string
  image_urls?: string[]
  status?: string
  whatsapp_sync_status?: string
  whatsapp_last_synced_at?: string
  whatsapp_external_product_id?: string
  whatsapp_retailer_id?: string
  readiness_missing?: string[]
  is_ready_for_whatsapp?: boolean
  make?: string
  model_name?: string
  year?: number
  fuel_type?: string
  transmission?: string
  color?: string
  km_driven?: number
  condition?: string
  ownership_count?: number
  insurance_valid_until?: string
  registration_number?: string
  rc_status?: string
  finance_available?: boolean
  exchange_accepted?: boolean
  accident_history?: string
  service_history?: string
  test_drive_available?: boolean
  property_type?: string
  listing_type?: 'sale' | 'rent' | 'lease'
  bedrooms?: number
  bathrooms?: number
  area_sqft?: number
  floor_number?: number
  total_floors?: number
  locality?: string
  city?: string
  furnishing?: string
  possession_status?: string
  facing?: string
  parking?: string
  rera_id?: string
  map_url?: string
  documents_status?: string
  loan_support_available?: boolean
  visit_landmark?: string
  vehicle?: Record<string, unknown>
  property?: Record<string, unknown>
}

export interface AppointmentSalesSettings {
  vertical_type: 'used_cars' | 'real_estate' | string
  onboarding_status?: string
  default_visit_type?: string
  default_visit_location?: string
  slot_duration_minutes?: number
  visit_buffer_minutes?: number
  auto_assign_visits?: boolean
  reminder_minutes_before?: number
  max_visits_per_time?: number
}

export interface AppointmentSalesSetup {
  settings: AppointmentSalesSettings
  staff: AppointmentSalesStaff[]
  listings: AppointmentSalesListing[]
  checklist: {
    staff_added: boolean
    availability_added: boolean
    listings_added: boolean
    ready_for_visits: boolean
  }
  status: string
}

export interface AppointmentSalesVisit {
  visit_id: string
  item_id?: string
  item_name?: string
  sales_staff_id?: string
  sales_staff_name?: string
  sales_staff_phone?: string
  customer_name?: string
  customer_phone?: string
  visit_type?: string
  status: string
  scheduled_start: string
  scheduled_end: string
  location?: string
  notes?: string
}

export interface AppointmentSalesOverview {
  business_type: string
  title: string
  summary: {
    active_listings: number
    active_staff: number
    visits_today: number
    upcoming_visits: number
    reserved_listings?: number
    sold_listings?: number
    inactive_listings?: number
    sync_attention?: number
    listings_needing_update?: number
  }
  primary_actions: Array<{ key: string; label: string; count: number }>
  ai_employees: Array<{
    key: string
    name: string
    status: string
    summary: string
    next: string
    metrics?: Array<{ label: string; value: number; tone?: string }>
  }>
  recent_visits: AppointmentSalesVisit[]
  settings: AppointmentSalesSettings
}

export interface AppointmentSlot {
  sales_staff_id: string
  sales_staff_name: string
  sales_staff_phone?: string
  start: string
  end: string
  label: string
  booked_count?: number
  available_count?: number
  capacity?: number
}

export function useAppointmentSalesSetup() {
  return useQuery({
    queryKey: ['appointment-sales-setup'],
    queryFn: async () => unwrap<AppointmentSalesSetup>(await apiClient.get('/appointment-sales/setup')),
    staleTime: 15000,
    retry: 1,
  })
}

export function useAppointmentSalesOverview() {
  return useQuery({
    queryKey: ['appointment-sales-overview'],
    queryFn: async () => unwrap<AppointmentSalesOverview>(await apiClient.get('/appointment-sales/overview')),
    staleTime: 15000,
    retry: 1,
  })
}

export function useAppointmentSalesListings() {
  return useQuery({
    queryKey: ['appointment-sales-listings'],
    queryFn: async () => unwrap<AppointmentSalesListing[]>(await apiClient.get('/appointment-sales/listings')),
    staleTime: 15000,
    retry: 1,
  })
}

export function useAppointmentSalesStaff() {
  return useQuery({
    queryKey: ['appointment-sales-staff'],
    queryFn: async () => unwrap<AppointmentSalesStaff[]>(await apiClient.get('/appointment-sales/staff')),
    staleTime: 15000,
    retry: 1,
  })
}

export function useAppointmentSalesVisits(params?: { status?: string; from_date?: string; to_date?: string; limit?: number }) {
  return useQuery({
    queryKey: ['appointment-sales-visits', params],
    queryFn: async () => unwrap<AppointmentSalesVisit[]>(await apiClient.get('/appointment-sales/visits', { params })),
    staleTime: 10000,
    retry: 1,
  })
}

export function useAppointmentSalesSlots(params?: { date?: string; item_id?: string; sales_staff_id?: string; duration_minutes?: number }) {
  return useQuery({
    queryKey: ['appointment-sales-slots', params],
    queryFn: async () => unwrap<{ date: string; slots: AppointmentSlot[] }>(await apiClient.get('/appointment-sales/slots', { params })),
    enabled: Boolean(params?.date),
    staleTime: 10000,
    retry: 1,
  })
}

export function useCompleteAppointmentSalesSetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      vertical_type?: string
      default_visit_type?: string
      default_visit_location?: string
      slot_duration_minutes?: number
      visit_buffer_minutes?: number
      auto_assign_visits?: boolean
      staff?: AppointmentSalesStaff[]
      listings?: AppointmentSalesListing[]
    }) => unwrap<any>(await apiClient.post('/appointment-sales/setup/complete', payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-setup'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-overview'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
      syncPendingWhatsAppCatalog()
      toast.success('Sales setup saved')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not save setup'),
  })
}

export function useUpsertAppointmentSalesStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AppointmentSalesStaff) => unwrap<AppointmentSalesStaff>(await apiClient.post('/appointment-sales/staff', payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-staff'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-setup'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-overview'] })
      toast.success('Salesperson saved')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not save salesperson'),
  })
}

export function useUpsertAppointmentSalesListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AppointmentSalesListing) => unwrap<AppointmentSalesListing>(await apiClient.post('/appointment-sales/listings', payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-listings'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-setup'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-overview'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
      syncPendingWhatsAppCatalog()
      toast.success('Listing saved')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not save listing'),
  })
}

export function useUpdateAppointmentListingStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { item_id: string; status: string }) =>
      unwrap<AppointmentSalesListing>(await apiClient.patch(`/appointment-sales/listings/${payload.item_id}/status`, {
        status: payload.status,
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-listings'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-setup'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-overview'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
      toast.success('Listing status updated')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not update listing'),
  })
}

export function useDeleteAppointmentSalesListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => unwrap<{ deleted: boolean }>(await apiClient.delete(`/appointment-sales/listings/${itemId}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-listings'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-setup'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-overview'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-catalog-status'] })
      toast.success('Listing removed')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not remove listing'),
  })
}

export function useCreateAppointmentSalesVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      item_id?: string
      sales_staff_id?: string
      customer_name?: string
      customer_phone?: string
      visit_type?: string
      scheduled_start: string
      duration_minutes?: number
      location?: string
      notes?: string
    }) => unwrap<AppointmentSalesVisit>(await apiClient.post('/appointment-sales/visits', payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-visits'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-slots'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-overview'] })
      toast.success('Visit booked')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not book visit'),
  })
}

export function useUpdateAppointmentVisitStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { visit_id: string; status: string; notes?: string }) =>
      unwrap<AppointmentSalesVisit>(await apiClient.patch(`/appointment-sales/visits/${payload.visit_id}/status`, {
        status: payload.status,
        notes: payload.notes,
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-visits'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-overview'] })
      toast.success('Visit updated')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not update visit'),
  })
}

export function useAssignAppointmentVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { visit_id: string; sales_staff_id?: string; notes?: string }) =>
      unwrap<AppointmentSalesVisit>(await apiClient.patch(`/appointment-sales/visits/${payload.visit_id}/assign`, {
        sales_staff_id: payload.sales_staff_id,
        notes: payload.notes,
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-visits'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-slots'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-sales-overview'] })
      toast.success('Salesperson changed')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not change salesperson'),
  })
}
