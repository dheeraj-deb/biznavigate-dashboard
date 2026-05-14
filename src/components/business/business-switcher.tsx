'use client'

import { Building2 } from 'lucide-react'
import { useCurrentBusiness } from '@/hooks/use-current-business'

export function BusinessSwitcher() {
  const { businesses, currentBusinessId, setCurrentBusinessId, isLoading } = useCurrentBusiness()

  if (isLoading || businesses.length <= 1) {
    return null
  }

  return (
    <label className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 lg:flex">
      <Building2 className="h-4 w-4 text-gray-500" />
      <select
        value={currentBusinessId ?? ''}
        onChange={(event) => setCurrentBusinessId(event.target.value)}
        className="max-w-44 bg-transparent text-sm font-medium text-gray-800 outline-none dark:text-gray-100"
        aria-label="Switch business"
      >
        {businesses.map((business) => (
          <option key={business.business_id} value={business.business_id}>
            {business.business_name}
          </option>
        ))}
      </select>
    </label>
  )
}
