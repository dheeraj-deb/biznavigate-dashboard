'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Users,
  Zap,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Instagram,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Hotel,
  Calendar,
  Utensils,
  Plus,
  Trash2,
  Globe,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Business type options
const businessTypes = [
  { value: 'retail', label: 'Retail / E-commerce', icon: Package, description: 'Sell physical products online or in-store' },
  { value: 'education', label: 'Education / Courses', icon: GraduationCap, description: 'Offer courses, training, or educational services' },
  { value: 'hospitality', label: 'Hotels / Resorts', icon: Hotel, description: 'Manage rooms, bookings, and accommodations' },
  { value: 'events', label: 'Events / Venues', icon: Calendar, description: 'Organize events, manage venues and tickets' },
  { value: 'food', label: 'Restaurant / Food Service', icon: Utensils, description: 'Food delivery, catering, or restaurant' },
  { value: 'services', label: 'Professional Services', icon: Briefcase, description: 'Consulting, freelancing, or service-based business' },
]

// Role templates
const roleTemplates = [
  { name: 'Admin', permissions: ['all'], description: 'Full access to all features' },
  { name: 'Sales Manager', permissions: ['leads', 'customers', 'orders'], description: 'Manage sales and customers' },
  { name: 'Support Agent', permissions: ['leads', 'inbox'], description: 'Handle customer inquiries' },
  { name: 'Inventory Manager', permissions: ['products', 'inventory'], description: 'Manage products and stock' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Business Info
    businessName: '',
    businessType: '',
    industry: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: 'India',

    // Step 2: Team Setup
    employees: [
      { name: '', email: '', role: 'Sales Manager', phone: '' }
    ],

    // Step 3: Platform Connections
    whatsappNumber: '',
    whatsappConnected: false,
    instagramUsername: '',
    instagramConnected: false,

    // Step 4: Initial Products
    initialProducts: '',
    productCategories: '',

    // Step 5: AI Configuration
    businessDescription: '',
    targetAudience: '',
    aiTone: 'professional',
  })

  const totalSteps = 6

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Submit onboarding data
    console.log('Onboarding data:', formData)
    router.push('/dashboard')
  }

  const addEmployee = () => {
    setFormData({
      ...formData,
      employees: [...formData.employees, { name: '', email: '', role: 'Sales Manager', phone: '' }]
    })
  }

  const removeEmployee = (index: number) => {
    setFormData({
      ...formData,
      employees: formData.employees.filter((_, i) => i !== index)
    })
  }

  const updateEmployee = (index: number, field: string, value: string) => {
    const updatedEmployees = [...formData.employees]
    updatedEmployees[index] = { ...updatedEmployees[index], [field]: value }
    setFormData({ ...formData, employees: updatedEmployees })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="rounded-lg bg-blue-600 p-2">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              BizNavigate
            </h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome! Let's set up your business
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This will only take a few minutes. We'll help you get started quickly.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-gray-200 dark:border-gray-800 shadow-lg mb-6">
          <CardContent className="p-8">
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Business Information</h3>
                    <p className="text-gray-600 dark:text-gray-400">Tell us about your business</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="Enter your business name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Business Type *</Label>
                    <div className="grid gap-3 md:grid-cols-2 mt-2">
                      {businessTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <Card
                            key={type.value}
                            className={`cursor-pointer transition-all ${
                              formData.businessType === type.value
                                ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                            onClick={() => setFormData({ ...formData, businessType: type.value })}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Icon className={`h-5 w-5 flex-shrink-0 ${
                                  formData.businessType === type.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600'
                                }`} />
                                <div>
                                  <div className="font-semibold text-sm">{type.label}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{type.description}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Business Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Business Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@business.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourbusiness.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Mumbai"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your business address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Team Setup */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Setup</h3>
                    <p className="text-gray-600 dark:text-gray-400">Add your team members and assign roles</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.employees.map((employee, index) => (
                    <Card key={index} className="border-gray-200 dark:border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 grid gap-4 md:grid-cols-2">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={employee.name}
                                onChange={(e) => updateEmployee(index, 'name', e.target.value)}
                                placeholder="Employee name"
                              />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={employee.email}
                                onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                                placeholder="email@example.com"
                              />
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <Input
                                value={employee.phone}
                                onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                                placeholder="+91 98765 43210"
                              />
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Select
                                value={employee.role}
                                onValueChange={(value) => updateEmployee(index, 'role', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleTemplates.map((role) => (
                                    <SelectItem key={role.name} value={role.name}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {formData.employees.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEmployee(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    onClick={addEmployee}
                    className="w-full border-dashed"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Available Roles</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {roleTemplates.map((role) => (
                      <Card key={role.name} className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-3">
                          <div className="font-semibold text-sm">{role.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{role.description}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Platform Connections */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950">
                    <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Connect Your Platforms</h3>
                    <p className="text-gray-600 dark:text-gray-400">Connect WhatsApp and Instagram to capture leads</p>
                  </div>
                </div>

                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                      <div>
                        <CardTitle>WhatsApp Business</CardTitle>
                        <CardDescription>Connect your WhatsApp Business account</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>WhatsApp Business Number</Label>
                      <Input
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Connect WhatsApp Business
                    </Button>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      You can also skip this and connect later from Settings
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Instagram className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      <div>
                        <CardTitle>Instagram Business</CardTitle>
                        <CardDescription>Connect your Instagram business profile</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Instagram Username</Label>
                      <Input
                        value={formData.instagramUsername}
                        onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })}
                        placeholder="@yourbusiness"
                      />
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <Instagram className="mr-2 h-4 w-4" />
                      Connect via Facebook
                    </Button>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Your Instagram must be connected to a Facebook Page
                    </p>
                  </CardContent>
                </Card>

                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  💡 Tip: Connecting these platforms now will help you capture leads automatically from day one!
                </p>
              </div>
            )}

            {/* Step 4: Initial Products/Services */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formData.businessType === 'education' ? 'Initial Courses' :
                       formData.businessType === 'hospitality' ? 'Room Types' :
                       formData.businessType === 'events' ? 'Event Types' :
                       formData.businessType === 'services' ? 'Services Offered' : 'Initial Products'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">Tell us what you offer (you can add more later)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>
                      {formData.businessType === 'education' ? 'What courses do you offer?' :
                       formData.businessType === 'hospitality' ? 'What room types do you have?' :
                       formData.businessType === 'events' ? 'What events do you organize?' :
                       formData.businessType === 'services' ? 'What services do you provide?' :
                       'What products do you sell?'}
                    </Label>
                    <Textarea
                      value={formData.initialProducts}
                      onChange={(e) => setFormData({ ...formData, initialProducts: e.target.value })}
                      placeholder={
                        formData.businessType === 'education' ? 'e.g., Web Development, Digital Marketing, Data Science' :
                        formData.businessType === 'hospitality' ? 'e.g., Deluxe Room, Suite, Family Room' :
                        formData.businessType === 'events' ? 'e.g., Weddings, Corporate Events, Birthday Parties' :
                        formData.businessType === 'services' ? 'e.g., Consulting, Design, Development' :
                        'e.g., T-Shirts, Shoes, Accessories'
                      }
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Separate each item with a comma
                    </p>
                  </div>

                  <div>
                    <Label>Categories</Label>
                    <Input
                      value={formData.productCategories}
                      onChange={(e) => setFormData({ ...formData, productCategories: e.target.value })}
                      placeholder="e.g., Electronics, Clothing, Food"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Separate categories with commas
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Don't worry!</strong> You can add detailed product information, pricing, and images later from the Products page.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: AI Configuration */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                    <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Assistant Setup</h3>
                    <p className="text-gray-600 dark:text-gray-400">Configure your AI chatbot for customer interactions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Business Description</Label>
                    <Textarea
                      value={formData.businessDescription}
                      onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                      placeholder="Describe your business in a few sentences. This helps the AI understand your business better..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Target Audience</Label>
                    <Input
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      placeholder="e.g., Young professionals, Students, Small business owners"
                    />
                  </div>

                  <div>
                    <Label>AI Conversation Tone</Label>
                    <Select
                      value={formData.aiTone}
                      onValueChange={(value) => setFormData({ ...formData, aiTone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional - Formal and business-like</SelectItem>
                        <SelectItem value="friendly">Friendly - Warm and conversational</SelectItem>
                        <SelectItem value="casual">Casual - Relaxed and informal</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic - Energetic and excited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">AI will help you:</p>
                      <ul className="space-y-1 text-indigo-700 dark:text-indigo-300">
                        <li>• Answer customer questions 24/7</li>
                        <li>• Qualify and capture leads automatically</li>
                        <li>• Provide product recommendations</li>
                        <li>• Handle common support queries</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">You're All Set!</h3>
                  <p className="text-gray-600 dark:text-gray-400">Review your setup and start using BizNavigate</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Business Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {formData.businessName}</div>
                      <div><strong>Type:</strong> {businessTypes.find(t => t.value === formData.businessType)?.label}</div>
                      <div><strong>City:</strong> {formData.city}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        Team Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Total:</strong> {formData.employees.length} team members</div>
                      {formData.employees.slice(0, 2).map((emp, i) => (
                        <div key={i}>{emp.name || `Member ${i + 1}`} - {emp.role}</div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        Platforms
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={formData.whatsappNumber ? "default" : "secondary"}>
                          WhatsApp {formData.whatsappNumber ? '✓' : '○'}
                        </Badge>
                        <Badge variant={formData.instagramUsername ? "default" : "secondary"}>
                          Instagram {formData.instagramUsername ? '✓' : '○'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-indigo-600" />
                        AI Assistant
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Tone:</strong> {formData.aiTone}</div>
                      <div><strong>Status:</strong> Ready to help customers</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 3 && (
              <Button variant="ghost" onClick={() => setCurrentStep(6)}>
                Skip to End
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
