'use client'

import { useMemo } from 'react'
import { navigationConfig } from '@/config/navigation.config'
import { getBusinessTypeConfig } from '@/business-types/business-type-registry'
import { useCurrentBusiness } from './use-current-business'
import { useSellerSetup } from './use-seller-os'
import type { BusinessType, NavGroup, NavItem, QuickLink } from '@/config/navigation.types'

const LOCAL_SELLER_GROUPS: NavGroup[] = [
  {
    name: 'Store Desk',
    icon: 'ShoppingBag',
    href: '/seller-os',
    businessTypes: ['products', 'retail'],
  },
  {
    name: 'Enquiries',
    icon: 'UserPlus',
    href: '/seller-os/leads',
    businessTypes: ['products', 'retail'],
  },
  {
    name: 'Products',
    icon: 'Package',
    href: '/inventory/products',
    businessTypes: ['products', 'retail'],
  },
  {
    name: 'Payments',
    icon: 'CreditCard',
    href: '/seller-os/payments',
    businessTypes: ['products', 'retail'],
  },
  {
    name: 'Credit',
    icon: 'IndianRupee',
    href: '/seller-os/credit',
    businessTypes: ['products', 'retail'],
    sellerFeatures: ['credit_sales'],
  },
  {
    name: 'AI Employees',
    icon: 'Bot',
    href: '/ai-employees',
    businessTypes: ['products', 'retail'],
  },
  {
    name: 'Settings',
    icon: 'Settings',
    businessTypes: ['products', 'retail'],
    children: [
      { name: 'Store Setup', href: '/seller-setup', icon: 'ListChecks' },
      { name: 'WhatsApp', href: '/settings/whatsapp', icon: 'MessageSquare' },
      { name: 'Business Profile', href: '/settings/business', icon: 'Building' },
      { name: 'Billing', href: '/billing', icon: 'CreditCard' },
    ],
  },
]

const LOCAL_SELLER_QUICK_LINKS: QuickLink[] = [
  { href: '/seller-os', label: 'Store Desk', icon: 'ShoppingBag', businessTypes: ['products', 'retail'] },
  { href: '/seller-os/leads', label: 'Enquiries', icon: 'UserPlus', businessTypes: ['products', 'retail'] },
  { href: '/inventory/products', label: 'Products', icon: 'Package', businessTypes: ['products', 'retail'] },
  { href: '/seller-os/payments', label: 'Payments', icon: 'CreditCard', businessTypes: ['products', 'retail'] },
  { href: '/seller-os/credit', label: 'Credit', icon: 'IndianRupee', businessTypes: ['products', 'retail'], sellerFeatures: ['credit_sales'] },
]

function matchesBizType(
  item: { businessTypes?: BusinessType[] },
  bizType: BusinessType,
): boolean {
  return !item.businessTypes || item.businessTypes.includes(bizType)
}

function matchesSellerFeatures(
  item: { sellerFeatures?: string[] },
  sellerFeatures: Record<string, unknown>,
): boolean {
  return !item.sellerFeatures || item.sellerFeatures.every((feature) => Boolean(sellerFeatures?.[feature]))
}

/**
 * Returns the navigation config filtered for the current user's business type.
 */
export function useNavigation() {
  const { businessType, isLoading } = useCurrentBusiness()
  const isProductSeller = businessType === 'products' || businessType === 'retail'
  const sellerSetupQuery = useSellerSetup({ enabled: isProductSeller })

  const { quickLinks, groups } = useMemo(() => {
    const businessConfig = getBusinessTypeConfig(businessType)
    const sellerFeatures = isProductSeller
      ? (sellerSetupQuery.data?.features ?? {})
      : {}
    const baseQuickLinks = isProductSeller ? LOCAL_SELLER_QUICK_LINKS : navigationConfig.quickLinks
    const filteredQuickLinks: QuickLink[] = baseQuickLinks.filter((ql) =>
      matchesBizType(ql, businessType) && matchesSellerFeatures(ql, sellerFeatures),
    )

    const baseGroups = isProductSeller ? LOCAL_SELLER_GROUPS : businessConfig.navigation
    const filteredGroups: NavGroup[] = baseGroups
      .filter((group) => matchesBizType(group, businessType) && matchesSellerFeatures(group, sellerFeatures))
      .map((group) => {
        if (!group.children) return group
        const filteredChildren: NavItem[] = group.children.filter((child) =>
          matchesBizType(child, businessType) && matchesSellerFeatures(child, sellerFeatures),
        )
        return { ...group, children: filteredChildren }
      })
      .filter((group) => group.href || (group.children && group.children.length > 0))

    return { quickLinks: filteredQuickLinks, groups: filteredGroups }
  }, [businessType, isProductSeller, sellerSetupQuery.data?.features])

  return { quickLinks, groups, businessType, isLoading }
}
