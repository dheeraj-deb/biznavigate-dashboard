'use client'

import { useCurrentBusiness } from './use-current-business'

/**
 * Backward-compatible business type hook.
 *
 * New code should prefer useCurrentBusiness() when it needs business id,
 * modules, permissions, or switcher state.
 */
export function useBusinessType() {
  const { businessType, isLoading, currentBusiness } = useCurrentBusiness()
  return {
    businessType,
    isLoading,
    currentBusiness,
  }
}
