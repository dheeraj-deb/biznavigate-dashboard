'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useCreateLead } from '@/hooks/use-leads'
import { useAuthStore } from '@/store/auth-store'

// Form validation schema matching backend DTO
const createLeadSchema = z.object({
  source: z.enum(['instagram_comment', 'instagram_dm', 'whatsapp', 'website_form'], {
    required_error: 'Source is required',
  }),
  first_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().max(100).optional().or(z.literal('')),
  phone: z.string()
    .regex(/^[0-9]{10}$/, 'Phone must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  pincode: z.string().max(10).optional().or(z.literal('')),
  lead_quality: z.enum(['hot', 'warm', 'cold']).optional(),
  estimated_value: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
})

type CreateLeadFormData = z.infer<typeof createLeadSchema>

interface CreateLeadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateLeadModal({ isOpen, onClose }: CreateLeadModalProps) {
  const { user } = useAuthStore()
  const createLead = useCreateLead()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      country: 'India',
    },
  })

  const selectedSource = watch('source')
  const selectedQuality = watch('lead_quality')

  const onSubmit = async (data: CreateLeadFormData) => {
    if (!user?.business_id) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare payload matching backend DTO
      const payload: any = {
        source: data.source,
        business_id: user.business_id,
      }

      // Add optional fields only if they have values
      if (data.first_name) payload.first_name = data.first_name
      if (data.last_name) payload.last_name = data.last_name
      if (data.phone) payload.phone = data.phone
      if (data.email) payload.email = data.email
      if (data.city) payload.city = data.city
      if (data.state) payload.state = data.state
      if (data.country) payload.country = data.country
      if (data.pincode) payload.pincode = data.pincode
      if (data.lead_quality) payload.lead_quality = data.lead_quality
      if (data.estimated_value) {
        payload.estimated_value = parseFloat(data.estimated_value)
      }
      if (data.tags) {
        // Convert comma-separated tags to array
        payload.tags = data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      }

      await createLead.mutateAsync(payload)
      reset()
      onClose()
    } catch {
      // Error handled by the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Create a new lead from various sources. Fill in the available information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Source - Required */}
          <div className="space-y-2">
            <Label htmlFor="source">
              Source <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedSource}
              onValueChange={(value) => setValue('source', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram_comment">Instagram Comment</SelectItem>
                <SelectItem value="instagram_dm">Instagram DM</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="website_form">Website Form</SelectItem>
              </SelectContent>
            </Select>
            {errors.source && (
              <p className="text-sm text-red-500">{errors.source.message}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                placeholder="John"
                {...register('first_name')}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="Doe"
                {...register('last_name')}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="9876543210"
                maxLength={10}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Mumbai"
                {...register('city')}
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Maharashtra"
                {...register('state')}
              />
              {errors.state && (
                <p className="text-sm text-red-500">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="India"
                defaultValue="India"
                {...register('country')}
              />
              {errors.country && (
                <p className="text-sm text-red-500">{errors.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                placeholder="400001"
                {...register('pincode')}
              />
              {errors.pincode && (
                <p className="text-sm text-red-500">{errors.pincode.message}</p>
              )}
            </div>
          </div>

          {/* Lead Quality & Estimated Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_quality">Lead Quality</Label>
              <Select
                value={selectedQuality}
                onValueChange={(value) => setValue('lead_quality', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              {errors.lead_quality && (
                <p className="text-sm text-red-500">{errors.lead_quality.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_value">Estimated Value</Label>
              <Input
                id="estimated_value"
                type="number"
                placeholder="50000"
                {...register('estimated_value')}
              />
              {errors.estimated_value && (
                <p className="text-sm text-red-500">{errors.estimated_value.message}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="vip, urgent, high-priority"
              {...register('tags')}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
            {errors.tags && (
              <p className="text-sm text-red-500">{errors.tags.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
