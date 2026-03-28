'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { BusinessType, BIZ_TYPE_MAP } from '@/config/navigation.types'

const VALID_TYPES: string[] = ['hospitality', 'events', 'products']

function normalize(raw: string): string {
  return BIZ_TYPE_MAP[raw] ?? raw
}

function isValid(t: string): t is BusinessType {
  return VALID_TYPES.includes(t)
}

/**
 * Resolves the current user's canonical BusinessType.
 *
 * Priority order (first valid value wins):
 * 1. localStorage key 'biznavigate_business_type' — written on onboarding/login
 * 2. user.business_type from Zustand auth store
 * 3. GET /inventory/config — fallback for legacy accounts
 */
export function useBusinessType() {
  const { user, setUser } = useAuthStore()

  function resolveFromLocal(): BusinessType | null {
    if (typeof window === 'undefined') return null
    const raw = normalize(localStorage.getItem('biznavigate_business_type') ?? '')
    return isValid(raw) ? (raw as BusinessType) : null
  }

  function resolveFromStore(): BusinessType | null {
    const raw = normalize(user?.business_type ?? '')
    return isValid(raw) ? (raw as BusinessType) : null
  }

  const immediate = resolveFromLocal() ?? resolveFromStore()

  const [businessType, setBusinessType] = useState<BusinessType>(immediate ?? 'hospitality')
  const [isLoading, setIsLoading] = useState(immediate === null)

  useEffect(() => {
    // Re-check on every render in case localStorage was just written
    const local = resolveFromLocal()
    if (local) {
      setBusinessType(local)
      setIsLoading(false)
      // Sync into auth store so future renders are instant
      if (user && user.business_type !== local) {
        setUser({ ...user, business_type: local })
      }
      return
    }

    const fromStore = resolveFromStore()
    if (fromStore) {
      setBusinessType(fromStore)
      setIsLoading(false)
      return
    }

    // Last resort: try businesses API first, then config API
    setIsLoading(true)

    const persist = (resolved: BusinessType) => {
      setBusinessType(resolved)
      if (typeof window !== 'undefined') {
        localStorage.setItem('biznavigate_business_type', resolved)
      }
      if (user) setUser({ ...user, business_type: resolved })
    }

    const tryBizAPI = user?.business_id
      ? apiClient.get(`/businesses/${user.business_id}`).then((res) => {
          const body = res.data as any
          const bt = (body?.data?.business_type ?? body?.business_type ?? '') as string
          return normalize(bt)
        })
      : Promise.resolve('')

    tryBizAPI
      .then((norm) => {
        if (isValid(norm)) { persist(norm as BusinessType); return }
        // Fall back to inventory config
        return apiClient.get('/inventory/config').then((res) => {
          const body = res.data as any
          const bt = (body?.data?.business_type ?? body?.business_type ?? '') as string
          const n = normalize(bt)
          if (isValid(n)) persist(n as BusinessType)
        })
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [user?.business_type])

  return { businessType, isLoading }
}
