'use client'

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  DEFAULT_BUSINESS_TYPE,
  type BusinessSummary,
  normalizeBusinessType,
} from '@/business-types/business-type.types'
import { getBusinessTypeConfig } from '@/business-types/business-type-registry'

interface BusinessContextValue {
  businesses: BusinessSummary[]
  currentBusiness: BusinessSummary | null
  currentBusinessId: string | null
  businessType: BusinessSummary['business_type']
  isLoading: boolean
  setCurrentBusinessId: (businessId: string) => void
  refreshBusinesses: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined)

function toBusinessSummary(raw: any): BusinessSummary | null {
  const businessId = raw?.business_id ?? raw?.id
  if (!businessId) return null
  const businessType = normalizeBusinessType(raw?.business_type)
  const config = getBusinessTypeConfig(businessType)

  return {
    business_id: businessId,
    tenant_id: raw?.tenant_id,
    business_name: raw?.business_name ?? raw?.name ?? 'Business',
    business_type: businessType,
    subscription_tier: raw?.subscription_tier,
    modules: raw?.modules?.length ? raw.modules : config.modules,
    role: raw?.role,
    permissions: raw?.permissions ?? [],
  }
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const userBusinessId = user?.business_id
  const userBusinessType = user?.business_type
  const userTenantId = user?.tenant_id
  const userSubscriptionTier = user?.subscription_tier
  const userRole = user?.role

  const currentBusiness = useMemo(() => {
    if (!userBusinessId) return null
    return toBusinessSummary({
      business_id: userBusinessId,
      tenant_id: userTenantId,
      business_name: 'Business',
      business_type: userBusinessType,
      subscription_tier: userSubscriptionTier,
      role: userRole,
    })
  }, [userBusinessId, userBusinessType, userRole, userSubscriptionTier, userTenantId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('biznavigate_current_business_id')
    if (currentBusiness) {
      localStorage.setItem('biznavigate_business_type', currentBusiness.business_type)
    }
  }, [currentBusiness])

  const refreshBusinesses = useCallback(async () => {}, [])
  const setCurrentBusinessId = useCallback((_businessId: string) => {}, [])
  const businesses = currentBusiness ? [currentBusiness] : []

  const value: BusinessContextValue = {
    businesses,
    currentBusiness: currentBusiness ?? null,
    currentBusinessId: currentBusiness?.business_id ?? null,
    businessType: currentBusiness?.business_type ?? DEFAULT_BUSINESS_TYPE,
    isLoading: false,
    setCurrentBusinessId,
    refreshBusinesses,
  }

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}

export function useBusinessContext() {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusinessContext must be used within BusinessProvider')
  }
  return context
}
