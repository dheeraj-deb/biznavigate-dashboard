'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Loader2,
  Package,
  GraduationCap,
  Hotel,
  Calendar,
  Briefcase,
  Sparkles,
} from 'lucide-react'
import { useCreateProduct } from '@/hooks/use-products'
import { useAuthStore } from '@/store/auth-store'

// Product type configuration (matching backend validation)
const PRODUCT_TYPES = {
  physical: {
    label: 'Physical Product',
    icon: Package,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
    description: 'Physical goods with inventory tracking'
  },
  course: {
    label: 'Course',
    icon: GraduationCap,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400',
    description: 'Educational courses and programs'
  },
  event: {
    label: 'Event',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
    description: 'Events, conferences, shows'
  },
  service: {
    label: 'Service',
    icon: Briefcase,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400',
    description: 'Professional services'
  }
}

// Fallback IDs from seed data
const FALLBACK_BUSINESS_ID = 'dd8ae5a1-cab4-4041-849d-e108d74490d3'
const FALLBACK_TENANT_ID = '99aff970-f498-478d-939a-a9a2fb459902'

// Form schema
const productSchema = z.object({
  product_type: z.string().min(1, 'Product type is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  cost_price: z.string().optional(),
  sku: z.string().optional(),
  stock_quantity: z.string().optional(),
  track_inventory: z.boolean().default(true),
  is_active: z.boolean().default(true),

  // Course specific
  duration: z.string().optional(),
  capacity: z.string().optional(),
  prerequisites: z.string().optional(),
  syllabus: z.string().optional(),

  // Event specific
  event_date: z.string().optional(),
  venue: z.string().optional(),
  ticket_types: z.string().optional(),

  // Service specific
  service_duration: z.string().optional(),
  booking_slots: z.string().optional(),
  service_type: z.string().optional(),

  // Physical product specific
  weight: z.string().optional(),
  dimensions: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const createProduct = useCreateProduct()
  const [selectedType, setSelectedType] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      track_inventory: true,
      is_active: true,
    },
  })

  const productType = watch('product_type')
  const trackInventory = watch('track_inventory')
  const isActive = watch('is_active')

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Get business_id and tenant_id from authenticated user or use fallback
      const businessId = user?.business_id || FALLBACK_BUSINESS_ID
      const tenantId = user?.tenant_id || FALLBACK_TENANT_ID

      // Prepare product data
      const productData: any = {
        business_id: businessId,
        tenant_id: tenantId,
        product_type: data.product_type,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        price: parseFloat(data.price),
        cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
        sku: data.sku || null,
        track_inventory: data.track_inventory,
        is_active: data.is_active,
      }

      // Add inventory fields if tracking
      if (data.track_inventory) {
        productData.stock_quantity = data.stock_quantity ? parseInt(data.stock_quantity) : 0
      }

      // Add type-specific fields as JSON in metadata or additional_info
      const typeSpecificData: any = {}

      if (data.product_type === 'course') {
        typeSpecificData.duration = data.duration
        typeSpecificData.capacity = data.capacity ? parseInt(data.capacity) : null
        typeSpecificData.prerequisites = data.prerequisites
        typeSpecificData.syllabus = data.syllabus
      } else if (data.product_type === 'event') {
        typeSpecificData.event_date = data.event_date
        typeSpecificData.venue = data.venue
        typeSpecificData.ticket_types = data.ticket_types?.split(',').map(t => t.trim())
        typeSpecificData.capacity = data.capacity ? parseInt(data.capacity) : null
      } else if (data.product_type === 'service') {
        typeSpecificData.service_duration = data.service_duration
        typeSpecificData.booking_slots = data.booking_slots
        typeSpecificData.service_type = data.service_type
      } else if (data.product_type === 'physical') {
        typeSpecificData.weight = data.weight
        typeSpecificData.dimensions = data.dimensions
      }

      // Store type-specific data in metadata
      if (Object.keys(typeSpecificData).length > 0) {
        productData.metadata = typeSpecificData
      }

      await createProduct.mutateAsync(productData)
      router.push('/inventory/products')
    } catch (error) {
      console.error('Failed to create product:', error)
    }
  }

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    setValue('product_type', type)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/inventory/products')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
              <p className="text-muted-foreground">
                Create a new product, course, service, or other offering
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Product Type</CardTitle>
              <CardDescription>
                Select what type of product you want to add. The form will adapt based on your selection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(PRODUCT_TYPES).map(([key, config]) => {
                  const Icon = config.icon
                  const isSelected = productType === key

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTypeChange(key)}
                      className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-all hover:border-primary ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className={`rounded-full p-3 ${config.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {config.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {errors.product_type && (
                <p className="mt-2 text-sm text-destructive">{errors.product_type.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Show form only after type is selected */}
          {productType && (
            <>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Essential details about your {PRODUCT_TYPES[productType as keyof typeof PRODUCT_TYPES]?.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder={`Enter ${PRODUCT_TYPES[productType as keyof typeof PRODUCT_TYPES]?.label.toLowerCase()} name`}
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="e.g., Electronics, Education, etc."
                        {...register('category')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Detailed description..."
                      rows={4}
                      {...register('description')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="price">
                        Price <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register('price')}
                      />
                      {errors.price && (
                        <p className="text-sm text-destructive">{errors.price.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cost_price">Cost Price</Label>
                      <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register('cost_price')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Physical Product Fields */}
              {productType === 'physical' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory & Physical Details</CardTitle>
                    <CardDescription>
                      Manage stock and physical specifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                          id="sku"
                          placeholder="Product SKU"
                          {...register('sku')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock_quantity">Stock Quantity</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          placeholder="0"
                          disabled={!trackInventory}
                          {...register('stock_quantity')}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          placeholder="e.g., 1.5"
                          {...register('weight')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dimensions">Dimensions (L x W x H cm)</Label>
                        <Input
                          id="dimensions"
                          placeholder="e.g., 30 x 20 x 10"
                          {...register('dimensions')}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Track Inventory</Label>
                        <p className="text-sm text-muted-foreground">
                          Monitor stock levels for this product
                        </p>
                      </div>
                      <Switch
                        checked={trackInventory}
                        onCheckedChange={(checked) => setValue('track_inventory', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Course Fields */}
              {productType === 'course' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                    <CardDescription>
                      Educational program information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                          id="duration"
                          placeholder="e.g., 6 weeks, 3 months"
                          {...register('duration')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          placeholder="Maximum students"
                          {...register('capacity')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prerequisites">Prerequisites</Label>
                      <Textarea
                        id="prerequisites"
                        placeholder="Required knowledge or skills..."
                        rows={3}
                        {...register('prerequisites')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="syllabus">Syllabus</Label>
                      <Textarea
                        id="syllabus"
                        placeholder="Course outline and topics covered..."
                        rows={6}
                        {...register('syllabus')}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Event Fields */}
              {productType === 'event' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                    <CardDescription>
                      Conference, show, or event information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="event_date">Event Date</Label>
                        <Input
                          id="event_date"
                          type="datetime-local"
                          {...register('event_date')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          placeholder="Maximum attendees"
                          {...register('capacity')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        id="venue"
                        placeholder="Event location"
                        {...register('venue')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ticket_types">Ticket Types</Label>
                      <Input
                        id="ticket_types"
                        placeholder="VIP, Regular, Early Bird (comma separated)"
                        {...register('ticket_types')}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate ticket types with commas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Fields */}
              {productType === 'service' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Service Details</CardTitle>
                    <CardDescription>
                      Professional service information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="service_type">Service Type</Label>
                        <Input
                          id="service_type"
                          placeholder="e.g., Consultation, Maintenance"
                          {...register('service_type')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service_duration">Duration</Label>
                        <Input
                          id="service_duration"
                          placeholder="e.g., 1 hour, 30 minutes"
                          {...register('service_duration')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="booking_slots">Booking Slots</Label>
                      <Textarea
                        id="booking_slots"
                        placeholder="Available time slots..."
                        rows={3}
                        {...register('booking_slots')}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>
                    Product availability and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Make this product available for sale
                      </p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => setValue('is_active', checked)}
                    />
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex gap-3">
                      <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">AI Enhancement Available</p>
                        <p className="text-sm text-blue-700 mt-1">
                          After creating this product, you can use AI to enhance descriptions, generate tags, and optimize categorization.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/inventory/products')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Product
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </DashboardLayout>
  )
}
