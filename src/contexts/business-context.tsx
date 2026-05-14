'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
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

function unwrapData<T>(body: any): T {
  return (body?.data ?? body) as T
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
  const queryClient = useQueryClient()
  const { user, setUser, isAuthenticated } = useAuthStore()
  const userBusinessId = user?.business_id
  const userBusinessType = user?.business_type
  const userTenantId = user?.tenant_id
  const userSubscriptionTier = user?.subscription_tier
  const userRole = user?.role
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([])
  const [currentBusinessId, setCurrentBusinessIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isRefreshingRef = useRef(false)

  const fallbackBusiness = useMemo(() => {
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

  const currentBusiness = useMemo(() => {
    return businesses.find((business) => business.business_id === currentBusinessId) ?? businesses[0] ?? fallbackBusiness
  }, [businesses, currentBusinessId, fallbackBusiness])

  const persistCurrentBusiness = useCallback(
    (business: BusinessSummary | null) => {
      if (!business || typeof window === 'undefined') return
      localStorage.setItem('biznavigate_current_business_id', business.business_id)
      localStorage.setItem('biznavigate_business_type', business.business_type)
      if (user) {
        const nextTenantId = business.tenant_id ?? user.tenant_id
        const nextSubscriptionTier = business.subscription_tier ?? user.subscription_tier
        const hasChanged =
          user.business_id !== business.business_id ||
          user.business_type !== business.business_type ||
          user.tenant_id !== nextTenantId ||
          user.subscription_tier !== nextSubscriptionTier

        if (hasChanged) {
          setUser({
            ...user,
            business_id: business.business_id,
            business_type: business.business_type,
            tenant_id: nextTenantId,
            subscription_tier: nextSubscriptionTier,
          })
        }
      }
    },
    [setUser, user],
  )

  const refreshBusinesses = useCallback(async () => {
    if (!isAuthenticated) return
    if (isRefreshingRef.current) return

    isRefreshingRef.current = true
    setIsLoading(true)
    try {
      const response = await apiClient.get('/businesses')
      const body = unwrapData<any>(response)
      const list = Array.isArray(body) ? body : Array.isArray(body?.businesses) ? body.businesses : []
      const summaries = list.map(toBusinessSummary).filter(Boolean) as BusinessSummary[]

      const resolved = summaries.length ? summaries : fallbackBusiness ? [fallbackBusiness] : []
      setBusinesses(resolved)

      const storedBusinessId =
        typeof window !== 'undefined' ? localStorage.getItem('biznavigate_current_business_id') : null
      const preferred =
        resolved.find((business) => business.business_id === storedBusinessId) ??
        resolved.find((business) => business.business_id === userBusinessId) ??
        resolved[0] ??
        null

      setCurrentBusinessIdState(preferred?.business_id ?? null)
      persistCurrentBusiness(preferred)
    } catch {
      const fallback = fallbackBusiness ? [fallbackBusiness] : []
      setBusinesses(fallback)
      setCurrentBusinessIdState(fallbackBusiness?.business_id ?? null)
      persistCurrentBusiness(fallbackBusiness)
    } finally {
      isRefreshingRef.current = false
      setIsLoading(false)
    }
  }, [fallbackBusiness, isAuthenticated, persistCurrentBusiness, userBusinessId])

  useEffect(() => {
    void refreshBusinesses()
  }, [refreshBusinesses])

  const setCurrentBusinessId = useCallback(
    (businessId: string) => {
      const next = businesses.find((business) => business.business_id === businessId)
      setCurrentBusinessIdState(businessId)
      persistCurrentBusiness(next ?? null)
      void queryClient.invalidateQueries()
    },
    [businesses, persistCurrentBusiness, queryClient],
  )

  const value: BusinessContextValue = {
    businesses,
    currentBusiness: currentBusiness ?? null,
    currentBusinessId: currentBusiness?.business_id ?? currentBusinessId,
    businessType: currentBusiness?.business_type ?? DEFAULT_BUSINESS_TYPE,
    isLoading,
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
