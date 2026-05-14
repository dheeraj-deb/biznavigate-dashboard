// ── Business & Subscription Types ────────────────────────────────────────────

import type { BusinessType, SubscriptionTier } from '@/business-types/business-type.types'

export type { BusinessType, SubscriptionTier }

// Normalization map: backend values → canonical BusinessType
export const BIZ_TYPE_MAP: Record<string, BusinessType> = {
  hotel: 'hospitality',
  resort: 'hospitality',
  camping: 'hospitality',
  retail: 'retail',
  ecommerce: 'retail',
  products: 'products',
  clinic: 'healthcare',
  property: 'real_estate',
  services: 'professional_services',
  crm: 'crm_automation',
  automation: 'crm_automation',
  crm_automation: 'crm_automation',
  school: 'education',
}

// ── Navigation Types ─────────────────────────────────────────────────────────

export interface NavItem {
  name: string
  href: string
  icon?: string                        // Lucide icon name (resolved at render)
  businessTypes?: BusinessType[]       // omit → visible to ALL types
  displayName?: Partial<Record<BusinessType, string>>  // override label per business type
  minTier?: SubscriptionTier           // future: subscription gating
  comingSoon?: boolean                 // renders disabled with badge
}

export interface NavGroup {
  name: string
  icon: string                         // Lucide icon name for the group header
  href?: string                        // if set, group is a direct link (no children)
  children?: NavItem[]
  businessTypes?: BusinessType[]       // omit → visible to ALL types
  displayName?: Partial<Record<BusinessType, string>>  // override label per business type
  minTier?: SubscriptionTier
  comingSoon?: boolean
}

export interface QuickLink {
  href: string
  label: string
  icon: string
  businessTypes?: BusinessType[]
}

export interface NavigationConfig {
  quickLinks: QuickLink[]
  groups: NavGroup[]
}

// ── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardStatConfig {
  key: string
  label: string
  icon: string
  color: string                        // tailwind color class prefix e.g. 'blue'
  valueKey: string                     // property name in the fetched data
  changeKey?: string                   // property name for % change
  prefix?: string                      // e.g. '$' or '₹'
  suffix?: string                      // e.g. '%'
}

export interface DashboardWidgetConfig {
  key: string                          // unique widget identifier
  component: string                    // component name in the widget registry
  colSpan: number                      // grid columns (out of 12)
  title?: string
  props?: Record<string, unknown>
}

export interface DashboardLayoutConfig {
  stats: DashboardStatConfig[]
  widgets: DashboardWidgetConfig[]
}
