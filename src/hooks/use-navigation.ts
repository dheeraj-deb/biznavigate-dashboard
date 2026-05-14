'use client'

import { useMemo } from 'react'
import { navigationConfig } from '@/config/navigation.config'
import { getBusinessTypeConfig } from '@/business-types/business-type-registry'
import { useCurrentBusiness } from './use-current-business'
import type { BusinessType, NavGroup, NavItem, QuickLink } from '@/config/navigation.types'

function matchesBizType(
  item: { businessTypes?: BusinessType[] },
  bizType: BusinessType,
): boolean {
  return !item.businessTypes || item.businessTypes.includes(bizType)
}

/**
 * Returns the navigation config filtered for the current user's business type.
 */
export function useNavigation() {
  const { businessType, isLoading } = useCurrentBusiness()

  const { quickLinks, groups } = useMemo(() => {
    const businessConfig = getBusinessTypeConfig(businessType)
    const filteredQuickLinks: QuickLink[] = navigationConfig.quickLinks.filter((ql) =>
      matchesBizType(ql, businessType),
    )

    const filteredGroups: NavGroup[] = businessConfig.navigation
      .filter((group) => matchesBizType(group, businessType))
      .map((group) => {
        if (!group.children) return group
        const filteredChildren: NavItem[] = group.children.filter((child) =>
          matchesBizType(child, businessType),
        )
        return { ...group, children: filteredChildren }
      })
      .filter((group) => group.href || (group.children && group.children.length > 0))

    return { quickLinks: filteredQuickLinks, groups: filteredGroups }
  }, [businessType])

  return { quickLinks, groups, businessType, isLoading }
}
