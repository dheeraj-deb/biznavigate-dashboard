'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
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

function getStoredBusinessType() {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem('biznavigate_business_type') || undefined
}

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
  const { user, setUser } = useAuthStore()
  const userBusinessId = user?.business_id
  const userBusinessType = user?.business_type
  const userTenantId = user?.tenant_id
  const userSubscriptionTier = user?.subscription_tier
  const userRole = user?.role
  const [businessFromApi, setBusinessFromApi] = useState<BusinessSummary | null>(null)
  const [storedBusinessType, setStoredBusinessType] = useState<string | undefined>(undefined)
  const [isFetchingBusiness, setIsFetchingBusiness] = useState(false)

  useEffect(() => {
    setStoredBusinessType(getStoredBusinessType())
  }, [])

  const refreshBusinesses = useCallback(async () => {
    if (!userBusinessId) {
      setBusinessFromApi(null)
      return
    }

    setIsFetchingBusiness(true)
    try {
      const response = await apiClient.get('/businesses/settings')
      const raw = (response as any).data?.data ?? (response as any).data ?? response
      const summary = toBusinessSummary(raw)
      setBusinessFromApi(summary)

      if (summary) {
        if (user && (user.business_type !== summary.business_type || user.tenant_id !== summary.tenant_id)) {
          setUser({ ...user, business_type: summary.business_type, tenant_id: summary.tenant_id ?? user.tenant_id })
        }
        localStorage.setItem('biznavigate_business_type', summary.business_type)
        setStoredBusinessType(summary.business_type)
      }
    } catch (error) {
      console.warn('Could not refresh business details for navigation', error)
    } finally {
      setIsFetchingBusiness(false)
    }
  }, [setUser, user, userBusinessId])

  useEffect(() => {
    refreshBusinesses()
  }, [refreshBusinesses])

  const fallbackBusiness = useMemo(() => {
    if (!userBusinessId) return null
    return toBusinessSummary({
      business_id: userBusinessId,
      tenant_id: userTenantId,
      business_name: 'Business',
      business_type: userBusinessType ?? storedBusinessType,
      subscription_tier: userSubscriptionTier,
      role: userRole,
    })
  }, [storedBusinessType, userBusinessId, userBusinessType, userRole, userSubscriptionTier, userTenantId])

  const currentBusiness = businessFromApi ?? fallbackBusiness

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('biznavigate_current_business_id')
    if (currentBusiness) {
      localStorage.setItem('biznavigate_business_type', currentBusiness.business_type)
    }
  }, [currentBusiness])

  const setCurrentBusinessId = useCallback((_businessId: string) => {}, [])
  const businesses = currentBusiness ? [currentBusiness] : []

  const value: BusinessContextValue = {
    businesses,
    currentBusiness: currentBusiness ?? null,
    currentBusinessId: currentBusiness?.business_id ?? null,
    businessType: currentBusiness?.business_type ?? DEFAULT_BUSINESS_TYPE,
    isLoading: isFetchingBusiness,
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
