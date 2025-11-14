'use client'

import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
  GraduationCap,
  Hotel,
  Calendar,
  Briefcase,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Box,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { useProduct, useDeleteProduct } from '@/hooks/use-products'
import { formatCurrency, formatDate } from '@/lib/utils'

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

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const { data: product, isLoading, error } = useProduct(productId)
  const deleteProduct = useDeleteProduct()

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await deleteProduct.mutateAsync(productId)
        router.push('/inventory/products')
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-muted-foreground">Loading product details...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Product Details</h1>
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

  const typeConfig = PRODUCT_TYPES[product.product_type as keyof typeof PRODUCT_TYPES]
  const Icon = typeConfig?.icon || Package
  const metadata = (product.metadata as any) || {}
  const isLowStock = product.track_inventory && (product.stock_quantity || 0) < 10
  const isOutOfStock = product.track_inventory && (product.stock_quantity || 0) === 0

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
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  {product.is_active ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
                {product.sku && product.category && <span className="mx-2">•</span>}
                {product.category && <span>{product.category}</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/inventory/products/${productId}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>

        {/* Stock Warning */}
        {isOutOfStock && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This product is out of stock. Please restock to continue selling.
            </AlertDescription>
          </Alert>
        )}

        {isLowStock && !isOutOfStock && (
          <Alert>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Low stock alert: Only {product.stock_quantity} units remaining.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Product Type & Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Product Type</Label>
                  <div className="mt-2">
                    <Badge variant="outline" className={`${typeConfig?.color} text-base py-2 px-4`}>
                      <Icon className="mr-2 h-4 w-4" />
                      {typeConfig?.label}
                    </Badge>
                  </div>
                </div>

                {product.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.ai_enhanced_description && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      AI-Enhanced Description
                    </Label>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {product.ai_enhanced_description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Type-Specific Details */}
            {product.product_type === 'course' && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metadata.duration && (
                    <div>
                      <Label>Duration</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.duration}</p>
                    </div>
                  )}
                  {metadata.capacity && (
                    <div>
                      <Label>Capacity</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.capacity} students</p>
                    </div>
                  )}
                  {metadata.prerequisites && (
                    <div>
                      <Label>Prerequisites</Label>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{metadata.prerequisites}</p>
                    </div>
                  )}
                  {metadata.syllabus && (
                    <div>
                      <Label>Syllabus</Label>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{metadata.syllabus}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {product.product_type === 'room' && (
              <Card>
                <CardHeader>
                  <CardTitle>Room Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metadata.room_type && (
                    <div>
                      <Label>Room Type</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.room_type}</p>
                    </div>
                  )}
                  {metadata.max_occupancy && (
                    <div>
                      <Label>Maximum Occupancy</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.max_occupancy} guests</p>
                    </div>
                  )}
                  {metadata.amenities && Array.isArray(metadata.amenities) && (
                    <div>
                      <Label>Amenities</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {metadata.amenities.map((amenity: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {product.product_type === 'event' && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metadata.event_date && (
                    <div>
                      <Label>Event Date</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(metadata.event_date).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {metadata.venue && (
                    <div>
                      <Label>Venue</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.venue}</p>
                    </div>
                  )}
                  {metadata.capacity && (
                    <div>
                      <Label>Capacity</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.capacity} attendees</p>
                    </div>
                  )}
                  {metadata.ticket_types && Array.isArray(metadata.ticket_types) && (
                    <div>
                      <Label>Ticket Types</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {metadata.ticket_types.map((ticket: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {ticket}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {product.product_type === 'service' && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metadata.service_type && (
                    <div>
                      <Label>Service Type</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.service_type}</p>
                    </div>
                  )}
                  {metadata.service_duration && (
                    <div>
                      <Label>Duration</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.service_duration}</p>
                    </div>
                  )}
                  {metadata.booking_slots && (
                    <div>
                      <Label>Booking Slots</Label>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{metadata.booking_slots}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {product.product_type === 'physical_product' && (
              <Card>
                <CardHeader>
                  <CardTitle>Physical Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metadata.weight && (
                    <div>
                      <Label>Weight</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.weight} kg</p>
                    </div>
                  )}
                  {metadata.dimensions && (
                    <div>
                      <Label>Dimensions</Label>
                      <p className="text-sm text-muted-foreground mt-1">{metadata.dimensions} cm</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Selling Price</Label>
                  <p className="text-2xl font-bold">
                    {product.price ? formatCurrency(Number(product.price)) : 'N/A'}
                  </p>
                </div>
                {product.cost_price && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Cost Price</Label>
                    <p className="text-lg font-semibold">
                      {formatCurrency(Number(product.cost_price))}
                    </p>
                  </div>
                )}
                {product.price && product.cost_price && (
                  <div className="pt-3 border-t">
                    <Label className="text-xs text-muted-foreground">Profit Margin</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(Number(product.price) - Number(product.cost_price))}
                      <span className="text-sm ml-1">
                        ({(((Number(product.price) - Number(product.cost_price)) / Number(product.price)) * 100).toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory Card (for physical products) */}
            {product.track_inventory && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Stock Level</Label>
                    <p className={`text-2xl font-bold ${
                      isOutOfStock ? 'text-red-600' :
                      isLowStock ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {product.stock_quantity || 0}
                      {isLowStock && <AlertTriangle className="inline ml-2 h-5 w-5" />}
                    </p>
                  </div>
                  {product.reserved_stock !== null && product.reserved_stock !== undefined && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Reserved</Label>
                      <p className="text-lg font-semibold">{product.reserved_stock}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Available</Label>
                    <p className="text-lg font-semibold">
                      {(product.stock_quantity || 0) - (product.reserved_stock || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="mt-1">{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Updated</Label>
                  <p className="mt-1">{formatDate(product.updated_at)}</p>
                </div>
                {product.ai_generated_tags && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-blue-600" />
                      AI Generated Tags
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.isArray(product.ai_generated_tags) ? (
                        product.ai_generated_tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No tags</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Helper component
function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-medium ${className}`}>{children}</p>
}
