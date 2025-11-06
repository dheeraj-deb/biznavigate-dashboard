'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { ProfileCompletionModal } from '@/components/profile/ProfileCompletionModal'

export function ProfileCompletionCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Check if profile is completed when user logs in
    if (user && user.profile_completed === false) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setShowModal(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [user])

  const handleCloseModal = () => {
    setShowModal(false)
  }

  return (
    <>
      {children}
      <ProfileCompletionModal open={showModal} onClose={handleCloseModal} />
    </>
  )
}
