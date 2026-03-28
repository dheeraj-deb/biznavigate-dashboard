'use client'

import { useMemo } from 'react'
import { useBusinessType } from './use-business-type'
import { navigationConfig } from '@/config/navigation.config'
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
  const { businessType, isLoading } = useBusinessType()

  const { quickLinks, groups } = useMemo(() => {
    const filteredQuickLinks: QuickLink[] = navigationConfig.quickLinks.filter((ql) =>
      matchesBizType(ql, businessType),
    )

    const filteredGroups: NavGroup[] = navigationConfig.groups
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
