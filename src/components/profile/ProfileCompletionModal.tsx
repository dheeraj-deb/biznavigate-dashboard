'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import axios from 'axios'
import { Upload } from 'lucide-react'
import { WorkingHoursInput } from './WorkingHoursInput'

const profileSchema = z.object({
  whatsapp_number: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid WhatsApp number with country code (e.g., +1234567890)'),
  business_type: z.enum([
    'retail',
    'ecommerce',
    'education',
    'healthcare',
    'real_estate',
    'hospitality',
    'consulting',
    'technology',
    'manufacturing',
    'other',
  ], { errorMap: () => ({ message: 'Please select a business type' }) }),
  logo_url: z.string().optional(),
  working_hours: z.record(
    z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    })
  ),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileCompletionModalProps {
  open: boolean
  onClose?: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function ProfileCompletionModal({ open, onClose }: ProfileCompletionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const { user, setUser, token } = useAuthStore()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      working_hours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      let logoUrl = data.logo_url || ''

      // Upload logo if file is selected
      if (logoFile) {
        const formData = new FormData()
        formData.append('file', logoFile)

        // Upload to your file storage (you may need to implement this endpoint)
        try {
          const uploadResponse = await axios.post(`${API_BASE_URL}/upload/logo`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          })
          logoUrl = uploadResponse.data.data.url
        } catch (uploadError) {
          console.error('Logo upload failed:', uploadError)
          // Continue with base64 as fallback
          logoUrl = logoPreview
        }
      }

      // Update profile and mark as completed
      await axios.patch(
        `${API_BASE_URL}/users/profile`,
        {
          whatsapp_number: data.whatsapp_number,
          business_type: data.business_type,
          logo_url: logoUrl,
          working_hours: data.working_hours,
          profile_completed: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Update user in store
      if (user) {
        setUser({
          ...user,
          profile_completed: true,
        })
      }

      toast.success('Profile completed successfully!')
      onClose?.()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    try {
      // Just mark profile as completed without updating details
      await axios.patch(
        `${API_BASE_URL}/users/profile`,
        {
          profile_completed: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Update user in store
      if (user) {
        setUser({
          ...user,
          profile_completed: true,
        })
      }

      toast.success('Profile setup skipped')
      onClose?.()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to skip profile setup')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={(e) => e.stopPropagation()} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-xl mx-4">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Help us personalize your experience by completing your business profile.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* WhatsApp Number */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp Business Number *</Label>
            <Input
              id="whatsapp_number"
              placeholder="+1234567890"
              {...register('whatsapp_number')}
              disabled={isLoading}
              className="h-11"
            />
            {errors.whatsapp_number && (
              <p className="text-sm text-red-600">{errors.whatsapp_number.message}</p>
            )}
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label htmlFor="business_type">Business Type *</Label>
            <select
              id="business_type"
              {...register('business_type')}
              disabled={isLoading}
              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select business type</option>
              <option value="retail">Retail</option>
              <option value="ecommerce">E-commerce</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="real_estate">Real Estate</option>
              <option value="hospitality">Hospitality</option>
              <option value="consulting">Consulting</option>
              <option value="technology">Technology</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="other">Other</option>
            </select>
            {errors.business_type && (
              <p className="text-sm text-red-600">{errors.business_type.message}</p>
            )}
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Business Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="w-20 h-20 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                  <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <label
                  htmlFor="logo"
                  className="flex items-center justify-center gap-2 h-11 px-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {logoFile ? logoFile.name : 'Upload logo'}
                  </span>
                </label>
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={isLoading}
                  className="hidden"
                />
              </div>
            </div>
            {errors.logo_url && (
              <p className="text-sm text-red-600">{errors.logo_url.message}</p>
            )}
          </div>

          {/* Working Hours */}
          <div className="space-y-2">
            <Label>Working Hours *</Label>
            <Controller
              name="working_hours"
              control={control}
              render={({ field }) => (
                <WorkingHoursInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            {errors.working_hours && (
              <p className="text-sm text-red-600">{errors.working_hours.message as string}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full sm:w-auto h-11"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
