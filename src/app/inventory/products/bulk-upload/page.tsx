'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Package,
  GraduationCap,
  Hotel,
  Calendar,
  Briefcase,
  X,
} from 'lucide-react'
import { useCreateProduct } from '@/hooks/use-products'
import toast from 'react-hot-toast'

// Product type configuration
const PRODUCT_TYPES = {
  physical_product: {
    label: 'Physical Product',
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    fields: ['name', 'description', 'category', 'price', 'cost_price', 'sku', 'stock_quantity', 'weight', 'dimensions']
  },
  course: {
    label: 'Course',
    icon: GraduationCap,
    color: 'bg-purple-100 text-purple-800',
    fields: ['name', 'description', 'category', 'price', 'duration', 'capacity', 'prerequisites', 'syllabus']
  },
  room: {
    label: 'Room/Accommodation',
    icon: Hotel,
    color: 'bg-green-100 text-green-800',
    fields: ['name', 'description', 'category', 'price', 'room_type', 'max_occupancy', 'amenities']
  },
  event: {
    label: 'Event',
    icon: Calendar,
    color: 'bg-orange-100 text-orange-800',
    fields: ['name', 'description', 'category', 'price', 'event_date', 'venue', 'capacity', 'ticket_types']
  },
  service: {
    label: 'Service',
    icon: Briefcase,
    color: 'bg-indigo-100 text-indigo-800',
    fields: ['name', 'description', 'category', 'price', 'service_type', 'service_duration', 'booking_slots']
  }
}

const BUSINESS_ID = '37689a7a-a45e-4c96-82ce-d695871d4e0c'
const TENANT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

interface ParsedProduct {
  row: number
  data: any
  errors: string[]
  warnings: string[]
}

export default function BulkUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const createProduct = useCreateProduct()

  // Generate CSV template based on product type
  const downloadTemplate = () => {
    if (!selectedType) {
      toast.error('Please select a product type first')
      return
    }

    const config = PRODUCT_TYPES[selectedType as keyof typeof PRODUCT_TYPES]
    const headers = config.fields.join(',')
    const exampleRow = config.fields.map(field => {
      switch (field) {
        case 'name': return 'Example Product Name'
        case 'description': return 'Product description here'
        case 'category': return 'Category'
        case 'price': return '99.99'
        case 'cost_price': return '50.00'
        case 'sku': return 'SKU001'
        case 'stock_quantity': return '100'
        case 'weight': return '1.5'
        case 'dimensions': return '30x20x10'
        case 'duration': return '6 weeks'
        case 'capacity': return '30'
        case 'prerequisites': return 'Basic knowledge required'
        case 'syllabus': return 'Week 1: Introduction...'
        case 'room_type': return 'Deluxe'
        case 'max_occupancy': return '2'
        case 'amenities': return 'WiFi,AC,TV'
        case 'event_date': return '2025-12-31T18:00'
        case 'venue': return 'Convention Center'
        case 'ticket_types': return 'VIP,Regular,Student'
        case 'service_type': return 'Consultation'
        case 'service_duration': return '1 hour'
        case 'booking_slots': return 'Mon-Fri 9AM-5PM'
        default: return ''
      }
    }).join(',')

    const csv = `${headers}\n${exampleRow}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedType}_template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Template downloaded successfully')
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  // Parse CSV file
  const parseFile = async (file: File) => {
    if (!selectedType) {
      toast.error('Please select a product type first')
      return
    }

    setIsProcessing(true)
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      toast.error('File is empty or invalid')
      setIsProcessing(false)
      return
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const config = PRODUCT_TYPES[selectedType as keyof typeof PRODUCT_TYPES]
    const parsed: ParsedProduct[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const product: any = {}
      const errors: string[] = []
      const warnings: string[] = []

      headers.forEach((header, index) => {
        product[header] = values[index] || ''
      })

      // Validation
      if (!product.name) {
        errors.push('Name is required')
      }
      if (!product.price || isNaN(parseFloat(product.price))) {
        errors.push('Valid price is required')
      }
      if (selectedType === 'physical_product' && product.stock_quantity && isNaN(parseInt(product.stock_quantity))) {
        errors.push('Stock quantity must be a number')
      }

      // Check for missing optional fields
      config.fields.forEach(field => {
        if (!product[field] && field !== 'name' && field !== 'price') {
          warnings.push(`${field} is empty`)
        }
      })

      parsed.push({
        row: i,
        data: product,
        errors,
        warnings
      })
    }

    setParsedData(parsed)
    setIsProcessing(false)
    toast.success(`Parsed ${parsed.length} products from file`)
  }

  // Upload products
  const handleUpload = async () => {
    if (!selectedType || parsedData.length === 0) {
      toast.error('No products to upload')
      return
    }

    // Check for errors
    const productsWithErrors = parsedData.filter(p => p.errors.length > 0)
    if (productsWithErrors.length > 0) {
      toast.error(`Cannot upload: ${productsWithErrors.length} products have errors`)
      return
    }

    setIsProcessing(true)
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < parsedData.length; i++) {
      const { data } = parsedData[i]

      try {
        const productData: any = {
          business_id: BUSINESS_ID,
          tenant_id: TENANT_ID,
          product_type: selectedType,
          name: data.name,
          description: data.description || null,
          category: data.category || null,
          price: parseFloat(data.price),
          cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
          is_active: true,
          track_inventory: selectedType === 'physical_product',
        }

        // Add type-specific fields
        const metadata: any = {}

        if (selectedType === 'physical_product') {
          productData.sku = data.sku || null
          productData.stock_quantity = data.stock_quantity ? parseInt(data.stock_quantity) : 0
          if (data.weight) metadata.weight = data.weight
          if (data.dimensions) metadata.dimensions = data.dimensions
        } else if (selectedType === 'course') {
          metadata.duration = data.duration
          metadata.capacity = data.capacity ? parseInt(data.capacity) : null
          metadata.prerequisites = data.prerequisites
          metadata.syllabus = data.syllabus
        } else if (selectedType === 'room') {
          metadata.room_type = data.room_type
          metadata.max_occupancy = data.max_occupancy ? parseInt(data.max_occupancy) : null
          if (data.amenities) {
            metadata.amenities = data.amenities.split(',').map((a: string) => a.trim())
          }
        } else if (selectedType === 'event') {
          metadata.event_date = data.event_date
          metadata.venue = data.venue
          metadata.capacity = data.capacity ? parseInt(data.capacity) : null
          if (data.ticket_types) {
            metadata.ticket_types = data.ticket_types.split(',').map((t: string) => t.trim())
          }
        } else if (selectedType === 'service') {
          metadata.service_type = data.service_type
          metadata.service_duration = data.service_duration
          metadata.booking_slots = data.booking_slots
        }

        if (Object.keys(metadata).length > 0) {
          productData.metadata = metadata
        }

        await createProduct.mutateAsync(productData)
        successCount++
      } catch (error) {
        console.error(`Failed to create product at row ${parsedData[i].row}:`, error)
        failCount++
      }

      setUploadProgress(Math.round(((i + 1) / parsedData.length) * 100))
    }

    setIsProcessing(false)
    setUploadProgress(0)

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} products`)
      setTimeout(() => router.push('/inventory/products'), 2000)
    }
    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} products`)
    }
  }

  // Remove file
  const handleRemoveFile = () => {
    setFile(null)
    setParsedData([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validProducts = parsedData.filter(p => p.errors.length === 0)
  const invalidProducts = parsedData.filter(p => p.errors.length > 0)

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
              <h1 className="text-3xl font-bold tracking-tight">Bulk Upload Products</h1>
              <p className="text-muted-foreground">
                Upload multiple products at once using CSV files
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">How to bulk upload:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Select your product type</li>
              <li>Download the CSV template for that type</li>
              <li>Fill in your product data in the template</li>
              <li>Upload the completed CSV file</li>
              <li>Review and confirm the upload</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Step 1: Select Product Type */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Product Type</CardTitle>
            <CardDescription>
              Choose what type of products you want to upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {Object.entries(PRODUCT_TYPES).map(([key, config]) => {
                const Icon = config.icon
                const isSelected = selectedType === key

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedType(key)
                      handleRemoveFile() // Clear any previous file
                    }}
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
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Download Template */}
        {selectedType && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Download Template</CardTitle>
              <CardDescription>
                Download the CSV template for {PRODUCT_TYPES[selectedType as keyof typeof PRODUCT_TYPES].label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="rounded-lg border-2 border-dashed border-border p-6 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium">CSV Template</p>
                      <p className="text-sm text-muted-foreground">
                        Contains {PRODUCT_TYPES[selectedType as keyof typeof PRODUCT_TYPES].fields.length} columns
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {PRODUCT_TYPES[selectedType as keyof typeof PRODUCT_TYPES].fields.map(field => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                  <Button onClick={downloadTemplate} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Upload File */}
        {selectedType && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Upload CSV File</CardTitle>
              <CardDescription>
                Upload your completed CSV file with product data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Click to upload CSV file</p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop your file here
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border-2 border-primary rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {parsedData.length > 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{parsedData.length}</p>
                          <p className="text-sm text-muted-foreground">Total Products</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{validProducts.length}</p>
                          <p className="text-sm text-muted-foreground">Valid</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">{invalidProducts.length}</p>
                          <p className="text-sm text-muted-foreground">Errors</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Upload */}
        {parsedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Review & Upload</CardTitle>
              <CardDescription>
                Review the parsed data and upload to your inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Products */}
              {invalidProducts.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">
                      {invalidProducts.length} products have errors and will not be uploaded:
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {invalidProducts.slice(0, 5).map(product => (
                        <p key={product.row} className="text-sm">
                          Row {product.row}: {product.errors.join(', ')}
                        </p>
                      ))}
                      {invalidProducts.length > 5 && (
                        <p className="text-sm font-medium">
                          ...and {invalidProducts.length - 5} more
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Products Preview */}
              {validProducts.length > 0 && (
                <div>
                  <p className="font-medium mb-3">
                    Preview of valid products ({validProducts.length}):
                  </p>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr className="text-left text-sm">
                          <th className="p-3">Row</th>
                          <th className="p-3">Name</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validProducts.slice(0, 10).map(product => (
                          <tr key={product.row} className="border-t">
                            <td className="p-3 text-sm">{product.row}</td>
                            <td className="p-3 text-sm font-medium">{product.data.name}</td>
                            <td className="p-3 text-sm">${product.data.price}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Ready
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validProducts.length > 10 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t">
                        ...and {validProducts.length - 10} more products
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isProcessing && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading products...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/inventory/products')}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={validProducts.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {validProducts.length} Products
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
