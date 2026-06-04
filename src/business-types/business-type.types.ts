import type { DashboardLayoutConfig, NavGroup } from '@/config/navigation.types'

export type BusinessType =
  | 'hospitality'
  | 'healthcare'
  | 'retail'
  | 'real_estate'
  | 'used_cars'
  | 'professional_services'
  | 'crm_automation'
  | 'education'
  | 'events'
  | 'products'

export type BusinessModuleKey =
  | 'crm'
  | 'whatsapp'
  | 'automations'
  | 'bookings'
  | 'orders'
  | 'catalog'
  | 'appointments'
  | 'properties'
  | 'payments'
  | 'analytics'
  | 'campaigns'
  | 'inventory'

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise'

export interface BusinessSummary {
  business_id: string
  tenant_id?: string
  business_name: string
  business_type: BusinessType
  subscription_tier?: SubscriptionTier
  modules: BusinessModuleKey[]
  role?: string
  permissions?: string[]
}

export interface BusinessTypeConfig {
  type: BusinessType
  label: string
  modules: BusinessModuleKey[]
  terminology: Record<string, string>
  navigation: NavGroup[]
  dashboard: DashboardLayoutConfig
  featureFlags?: Partial<Record<string, boolean>>
}

export const BUSINESS_TYPE_ALIASES: Record<string, BusinessType> = {
  hotel: 'hospitality',
  resort: 'hospitality',
  camping: 'hospitality',
  accommodation: 'hospitality',
  clinic: 'healthcare',
  healthcare: 'healthcare',
  medical: 'healthcare',
  ecommerce: 'retail',
  e_commerce: 'retail',
  retail: 'retail',
  products: 'products',
  product: 'products',
  realestate: 'real_estate',
  real_estate: 'real_estate',
  property: 'real_estate',
  used_cars: 'used_cars',
  used_car: 'used_cars',
  second_hand_car: 'used_cars',
  second_hand_cars: 'used_cars',
  automotive: 'used_cars',
  vehicle: 'used_cars',
  car_dealer: 'used_cars',
  education: 'education',
  school: 'education',
  institute: 'education',
  services: 'professional_services',
  professional_services: 'professional_services',
  crm: 'crm_automation',
  automation: 'crm_automation',
  crm_automation: 'crm_automation',
  events: 'events',
}

export const DEFAULT_BUSINESS_TYPE: BusinessType = 'hospitality'

export function normalizeBusinessType(raw?: string | null): BusinessType {
  const key = String(raw ?? '').trim().toLowerCase()
  return BUSINESS_TYPE_ALIASES[key] ?? DEFAULT_BUSINESS_TYPE
}
