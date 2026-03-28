'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { BusinessType, BIZ_TYPE_MAP } from '@/config/navigation.types'

const VALID_TYPES: string[] = ['hospitality', 'events', 'products']
const DEFAULT_TYPE: BusinessType = 'hospitality'

/**
 * Resolves the current user's canonical BusinessType.
 *
 * 1. Reads user.business_type from Zustand (set during onboarding)
 * 2. Normalizes via BIZ_TYPE_MAP (hotel→hospitality, retail→products, etc.)
 * 3. Falls back to GET /businesses/{business_id} for legacy accounts
 * 4. Last resort: 'hospitality'
 */
export function useBusinessType() {
  const { user } = useAuthStore()

  const [businessType, setBusinessType] = useState<BusinessType>(() => {
    const raw = user?.business_type ?? ''
    const normalized = BIZ_TYPE_MAP[raw] ?? raw
    return VALID_TYPES.includes(normalized) ? (normalized as BusinessType) : DEFAULT_TYPE
  })
  const [isLoading, setIsLoading] = useState(() => {
    const raw = user?.business_type ?? ''
    const normalized = BIZ_TYPE_MAP[raw] ?? raw
    return !VALID_TYPES.includes(normalized)
  })

  useEffect(() => {
    const raw = user?.business_type ?? ''
    const normalized = BIZ_TYPE_MAP[raw] ?? raw

    if (VALID_TYPES.includes(normalized)) {
      setBusinessType(normalized as BusinessType)
      setIsLoading(false)
      return
    }

    // Fallback: fetch from API for legacy accounts
    if (!user?.business_id) {
      setBusinessType(DEFAULT_TYPE)
      setIsLoading(false)
      return
    }

    apiClient
      .get(`/businesses/${user.business_id}`)
      .then((res) => {
        const body = res.data as any
        const bt = (body?.data?.business_type ?? body?.business_type ?? '') as string
        const norm = BIZ_TYPE_MAP[bt] ?? bt
        if (VALID_TYPES.includes(norm)) {
          setBusinessType(norm as BusinessType)
        } else {
          setBusinessType(DEFAULT_TYPE)
        }
      })
      .catch(() => {
        setBusinessType(DEFAULT_TYPE)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [user])

  return { businessType, isLoading }
}
