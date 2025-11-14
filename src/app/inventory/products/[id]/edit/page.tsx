'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { useProduct, useUpdateProduct } from '@/hooks/use-products'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

// Product type configuration
const PRODUCT_TYPES = {
  physical_product: {
    label: 'Physical Product',
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    description: 'Physical goods with inventory tracking'
  },
  course: {
    label: 'Course',
    icon: GraduationCap,
    color: 'bg-purple-100 text-purple-800',
    description: 'Educational courses and programs'
  },
  room: {
    label: 'Room/Accommodation',
    icon: Hotel,
    color: 'bg-green-100 text-green-800',
    description: 'Hotel rooms, resorts, stays'
  },
  event: {
    label: 'Event',
    icon: Calendar,
    color: 'bg-orange-100 text-orange-800',
    description: 'Events, conferences, shows'
  },
  service: {
    label: 'Service',
    icon: Briefcase,
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Professional services'
  }
}

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

  // Room specific
  room_type: z.string().optional(),
  amenities: z.string().optional(),
  max_occupancy: z.string().optional(),

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

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const { data: product, isLoading, error } = useProduct(productId)
  const updateProduct = useUpdateProduct()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const productType = watch('product_type')
  const trackInventory = watch('track_inventory')
  const isActive = watch('is_active')

  // Load product data when available
  useEffect(() => {
    if (product) {
      const metadata = product.metadata as any || {}

      reset({
        product_type: product.product_type,
        name: product.name,
        description: product.description || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        sku: product.sku || '',
        stock_quantity: product.stock_quantity?.toString() || '0',
        track_inventory: product.track_inventory ?? true,
        is_active: product.is_active ?? true,

        // Load type-specific data from metadata
        duration: metadata.duration || '',
        capacity: metadata.capacity?.toString() || '',
        prerequisites: metadata.prerequisites || '',
        syllabus: metadata.syllabus || '',
        room_type: metadata.room_type || '',
        amenities: Array.isArray(metadata.amenities) ? metadata.amenities.join(', ') : '',
        max_occupancy: metadata.max_occupancy?.toString() || '',
        event_date: metadata.event_date || '',
        venue: metadata.venue || '',
        ticket_types: Array.isArray(metadata.ticket_types) ? metadata.ticket_types.join(', ') : '',
        service_duration: metadata.service_duration || '',
        booking_slots: metadata.booking_slots || '',
        service_type: metadata.service_type || '',
        weight: metadata.weight || '',
        dimensions: metadata.dimensions || '',
      })
    }
  }, [product, reset])

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Prepare product data
      const productData: any = {
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

      // Add type-specific fields as JSON in metadata
      const typeSpecificData: any = {}

      if (data.product_type === 'course') {
        typeSpecificData.duration = data.duration
        typeSpecificData.capacity = data.capacity ? parseInt(data.capacity) : null
        typeSpecificData.prerequisites = data.prerequisites
        typeSpecificData.syllabus = data.syllabus
      } else if (data.product_type === 'room') {
        typeSpecificData.room_type = data.room_type
        typeSpecificData.amenities = data.amenities?.split(',').map(a => a.trim())
        typeSpecificData.max_occupancy = data.max_occupancy ? parseInt(data.max_occupancy) : null
      } else if (data.product_type === 'event') {
        typeSpecificData.event_date = data.event_date
        typeSpecificData.venue = data.venue
        typeSpecificData.ticket_types = data.ticket_types?.split(',').map(t => t.trim())
        typeSpecificData.capacity = data.capacity ? parseInt(data.capacity) : null
      } else if (data.product_type === 'service') {
        typeSpecificData.service_duration = data.service_duration
        typeSpecificData.booking_slots = data.booking_slots
        typeSpecificData.service_type = data.service_type
      } else if (data.product_type === 'physical_product') {
        typeSpecificData.weight = data.weight
        typeSpecificData.dimensions = data.dimensions
      }

      // Store type-specific data in metadata
      if (Object.keys(typeSpecificData).length > 0) {
        productData.metadata = typeSpecificData
      }

      await updateProduct.mutateAsync({ id: productId, data: productData })
      router.push('/inventory/products')
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/inventory/products')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load product. Please try again or go back to the product list.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/inventory/products')}>
            Back to Products
          </Button>
        </div>
      </DashboardLayout>
    )
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
              <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
              <p className="text-muted-foreground">
                Update product information
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Type Display (Not editable) */}
          <Card>
            <CardHeader>
              <CardTitle>Product Type</CardTitle>
              <CardDescription>
                Product type cannot be changed after creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productType && (
                <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-primary/5 p-4 w-fit">
                  {(() => {
                    const config = PRODUCT_TYPES[productType as keyof typeof PRODUCT_TYPES]
                    const Icon = config.icon
                    return (
                      <>
                        <div className={`rounded-full p-3 ${config.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
              <input type="hidden" {...register('product_type')} />
            </CardContent>
          </Card>

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
          {productType === 'physical_product' && (
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

          {/* Room/Accommodation Fields */}
          {productType === 'room' && (
            <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
                <CardDescription>
                  Accommodation specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="room_type">Room Type</Label>
                    <Input
                      id="room_type"
                      placeholder="e.g., Deluxe, Suite, Standard"
                      {...register('room_type')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_occupancy">Max Occupancy</Label>
                    <Input
                      id="max_occupancy"
                      type="number"
                      placeholder="Number of guests"
                      {...register('max_occupancy')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amenities">Amenities</Label>
                  <Input
                    id="amenities"
                    placeholder="WiFi, AC, TV, Mini Bar (comma separated)"
                    {...register('amenities')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate amenities with commas
                  </p>
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
                      You can use AI to enhance descriptions, generate tags, and optimize categorization.
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
              Update Product
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
