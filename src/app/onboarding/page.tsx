'use client'

import { useState } from 'react'
import { useCompleteOnboarding, type OnboardingResult } from '@/hooks/use-onboarding'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Hotel,
  Calendar,
  Plus,
  Trash2,
  Store,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AppLogo } from '@/components/ui/app-logo'
import toast from 'react-hot-toast'
import { SimpleWhatsAppConnect } from '@/components/whatsapp/simple-whatsapp-connect'

// Business type options
const businessTypes = [
  { value: 'hospitality', label: 'Hospitality',  icon: Hotel,    description: 'Hotels, resorts, villas, camps & accommodation' },
  { value: 'events',      label: 'Events',        icon: Calendar, description: 'Events, venues, workshops & banquet halls' },
  { value: 'products',    label: 'Products',      icon: Store,    description: 'Retail, e-commerce & product-based businesses' },
]

// Role templates
const roleTemplates = [
  { name: 'Admin', permissions: ['all'], description: 'Full access to all features' },
  { name: 'Sales Manager', permissions: ['leads', 'customers', 'orders'], description: 'Manage sales and customers' },
  { name: 'Support Agent', permissions: ['leads', 'inbox'], description: 'Handle customer inquiries' },
  { name: 'Inventory Manager', permissions: ['products', 'inventory'], description: 'Manage products and stock' },
]

const INDIAN_CITIES = ['Agartala', 'Agra', 'Ahmedabad', 'Ahmednagar', 'Aizawl', 'Ajmer', 'Akola', 'Aligarh', 'Allahabad', 'Alwar', 'Ambala', 'Amravati', 'Amritsar', 'Anand', 'Anantapur', 'Asansol', 'Aurangabad', 'Avadi', 'Bally', 'Bangalore', 'Baranagar', 'Barasat', 'Bardhaman', 'Bareilly', 'Bathinda', 'Begusarai', 'Belgaum', 'Bellary', 'Berhampur', 'Bhagalpur', 'Bharatpur', 'Bhatpara', 'Bhavnagar', 'Bhilai', 'Bhilwara', 'Bhiwandi', 'Bhopal', 'Bhubaneswar', 'Bhuj', 'Bikaner', 'Bilaspur', 'Bokaro', 'Chandigarh', 'Chandrapur', 'Chennai', 'Coimbatore', 'Cuttack', 'Darbhanga', 'Davanagere', 'Dehradun', 'Delhi', 'Deoghar', 'Dhanbad', 'Dhule', 'Dindigul', 'Durg', 'Durgapur', 'Erode', 'Etawah', 'Faridabad', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gandhidham', 'Gandhinagar', 'Gangtok', 'Gaya', 'Ghaziabad', 'Gopalpur', 'Gorakhpur', 'Gulbarga', 'Guntur', 'Gurgaon', 'Guwahati', 'Gwalior', 'Haldia', 'Hapur', 'Haridwar', 'Hisar', 'Hoshiarpur', 'Howrah', 'Hubli', 'Hyderabad', 'Imphal', 'Indore', 'Jabalpur', 'Jaipur', 'Jalandhar', 'Jalgaon', 'Jalna', 'Jamalpur', 'Jammu', 'Jamnagar', 'Jamshedpur', 'Jhansi', 'Jodhpur', 'Junagadh', 'Kadapa', 'Kakinada', 'Kalyan', 'Kamarhati', 'Kanchipuram', 'Kannur', 'Kanpur', 'Karnal', 'Kharagpur', 'Kochi', 'Kolhapur', 'Kolkata', 'Kollam', 'Korba', 'Kota', 'Kottayam', 'Kozhikode', 'Kulti', 'Kurnool', 'Latur', 'Loni', 'Lucknow', 'Ludhiana', 'Madurai', 'Malappuram', 'Malegaon', 'Mangalore', 'Mango', 'Mathura', 'Mau', 'Meerut', 'Mira-Bhayandar', 'Mirzapur', 'Moradabad', 'Mumbai', 'Muzaffarnagar', 'Muzaffarpur', 'Mysore', 'Nadiad', 'Nagaon', 'Nagpur', 'Naihati', 'Nanded', 'Nashik', 'Navi Mumbai', 'Nellore', 'New Delhi', 'Nizamabad', 'Noida', 'Ozhukarai', 'Pali', 'Panihati', 'Panipat', 'Parbhani', 'Patiala', 'Patna', 'Phagwara', 'Pimpri-Chinchwad', 'Pondicherry', 'Pune', 'Purnia', 'Raebareli', 'Raichur', 'Raipur', 'Rajahmundry', 'Rajkot', 'Ramagundam', 'Rampur', 'Ranchi', 'Ratlam', 'Raurkela', 'Rewa', 'Rohtak', 'Rourkela', 'Sagar', 'Saharanpur', 'Salem', 'Sangli', 'Satna', 'Secunderabad', 'Shahjahanpur', 'Shimla', 'Shivamogga', 'Sikar', 'Siliguri', 'Solapur', 'Sonipat', 'South Dumdum', 'Sri Ganganagar', 'Srinagar', 'Surat', 'Thane', 'Thiruvananthapuram', 'Thoothukudi', 'Thrissur', 'Tiruchirappalli', 'Tirunelveli', 'Tirupati', 'Tiruppur', 'Tiruvottiyur', 'Tumkur', 'Udaipur', 'Ujjain', 'Ulhasnagar', 'Vadodara', 'Varanasi', 'Vasai-Virar', 'Vellore', 'Vijayanagaram', 'Vijayawada', 'Visakhapatnam', 'Warangal', 'Yamunanagar']

const BUSINESS_DESCRIPTION_TEMPLATES: Record<string, string> = {
  hospitality: "[BusinessName] is a premier hospitality business in [City], offering exceptional stays, world-class amenities, and memorable experiences to every guest.",
  events:      "[BusinessName] is a professional event management company in [City], turning visions into unforgettable experiences.",
  products:    "[BusinessName] is a premium retail business in [City], offering high-quality products and exceptional customer service.",
  default:     "[BusinessName] is a dedicated business in [City], focused on quality, reliability, and the best possible experience for our customers."
}

const AUDIENCE_SUGGESTIONS: Record<string, string[]> = {
  hospitality: ['Tourists', 'Business Travelers', 'Families', 'Couples'],
  events:      ['Corporate Clients', 'Engaged Couples', 'Families', 'Music Fans'],
  products:    ['Online Shoppers', 'Bargain Hunters', 'Local Residents', 'B2B Clients'],
  default:     ['Local Residents', 'Online Shoppers', 'General Public', 'B2B Clients']
}
export default function OnboardingPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const totalSteps = 4
  const [currentStep, setCurrentStep] = useState(1)
  const [citySearch, setCitySearch] = useState('')
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showWorkingHoursPopover, setShowWorkingHoursPopover] = useState(false)

  const filteredCities = INDIAN_CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
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
    gstNumber: '',
    panNumber: '',

    // Step 2: Team Setup
    employees: [] as Array<{ name: string; email: string; role: string; phone: string }>,

    // Step 3: AI Configuration
    businessDescription: '',
    targetAudience: '',
    aiTone: 'professional',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  })

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business Name is required'
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required'
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
      if (!formData.businessType) newErrors.businessType = 'Business Type is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
    } else if (step === 2) {
      if (!formData.employees[0].name.trim()) newErrors.employeeName = 'Employee name is required'
      if (!formData.employees[0].email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.employees[0].email)) newErrors.employeeEmail = 'Valid employee email is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      toast('Please complete all required fields', {
        id: 'validation-error-toast',
        icon: '⚠️',
        position: 'top-center',
        style: {
          borderRadius: '12px',
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          fontSize: '13px',
          fontWeight: 500,
        },
      })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({}) // clear errors on back
    }
  }

  const { mutate: completeOnboarding, isPending: isSubmitting } = useCompleteOnboarding()
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null)

  const handleComplete = () => {
    const BIZ_TYPE_MAP: Record<string, string> = {
      hotel: 'hospitality', resort: 'hospitality', camping: 'hospitality',
    }
    const mappedType = BIZ_TYPE_MAP[formData.businessType] ?? formData.businessType
    const payload = {
      business_name: formData.businessName,
      business_type: mappedType,
      email: formData.email,
      phone: formData.phone,
      website: formData.website || undefined,
      city: formData.city,
      address: formData.address || undefined,
      country: formData.country,
      gst_number: formData.gstNumber || undefined,
      pan_number: formData.panNumber || undefined,
      whatsapp_number: formData.phone || undefined,
      employees: formData.employees
        .filter(e => e.name.trim() && e.email.trim())
        .map(e => ({
          name: e.name,
          email: e.email,
          phone: e.phone || undefined,
          role: e.role,
        })),
    }
    completeOnboarding(payload, {
      onSuccess: (data) => {
        setOnboardingResult(data)
        const resolvedType = data?.business?.business_type ?? mappedType
        // Persist business type immediately so all pages can read it synchronously
        if (typeof window !== 'undefined') {
          localStorage.setItem('biznavigate_business_type', resolvedType)
        }
        if (user) {
          setUser({
            ...user,
            business_type: resolvedType,
            tenant_id: data?.business?.tenant_id ?? user.tenant_id,
            business_id: data?.business?.business_id ?? user.business_id,
          })
        }
        setCurrentStep(4)
      },
    })
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

  const toggleSelection = (field: 'targetAudience', item: string) => {
    const currentStr = formData[field] || ''
    const currentItems = currentStr.split(',').map(s => s.trim()).filter(Boolean)

    if (currentItems.includes(item)) {
      setFormData({ ...formData, [field]: currentItems.filter(i => i !== item).join(', ') })
      setErrors({ ...errors, [field]: '' })
    } else {
      setFormData({ ...formData, [field]: [...currentItems, item].join(', ') })
      setErrors({ ...errors, [field]: '' })
    }
  }

  const injectDescriptionTemplate = () => {
    const template = BUSINESS_DESCRIPTION_TEMPLATES[formData.businessType || 'default'] || BUSINESS_DESCRIPTION_TEMPLATES['default']
    const finalDesc = template
      .replace('[BusinessName]', formData.businessName || 'Our Business')
      .replace('[City]', formData.city || 'your city')
    setFormData({ ...formData, businessDescription: finalDesc })
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 selection:bg-blue-600/20 font-sans overflow-hidden relative flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
      <div className="container relative z-10 mx-auto px-4 py-4 max-w-4xl flex flex-col h-full flex-1 min-h-0">
        {/* Header */}
        <div className="text-center mb-3 flex-shrink-0">
          <div className="mb-3 flex w-full justify-center animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
            <div className="group flex items-center gap-3 cursor-pointer">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 group-hover:shadow-[0_8px_30px_rgba(37,99,235,0.2)] group-hover:-translate-y-0.5">
                <AppLogo className="h-10 w-10 shadow-lg rounded-[12px]" />
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                BizNavigo
              </span>
            </div>
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight text-[#4B4B4B] mb-1">
            Welcome! Let's set up your business
          </h2>
          <p className="text-[13px] text-[#6E6E6E]">
            This will only take a few minutes. We'll help you get started quickly.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#4B4B4B]">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-[13px] text-[#6E6E6E]">
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
        <Card className="border-slate-200/60 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-xl mb-3 relative z-20 flex-1 min-h-0 flex flex-col">
          <CardContent className="p-5 flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">Business Name*</label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => { setFormData({ ...formData, businessName: e.target.value }); setErrors({ ...errors, businessName: '' }) }}
                      placeholder="Enter your business name"
                      className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.businessName ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                    />
                    {errors.businessName && <p className="mt-1 text-xs text-red-500 font-medium">{errors.businessName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">Business Email*</label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
                      placeholder="contact@business.com"
                      className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.email ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">Business Phone*</label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setErrors({ ...errors, phone: '' }) }}
                      placeholder="+91 98765 43210"
                      className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.phone ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">Website (Optional)</label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourbusiness.com"
                      className="h-10 w-full bg-transparent border-[#989898] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none rounded-[4px]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">GSTIN <span className="text-[11px] font-normal text-[#6E6E6E]">(Optional)</span></label>
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className="h-10 w-full bg-transparent border-[#989898] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none rounded-[4px] uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">PAN <span className="text-[11px] font-normal text-[#6E6E6E]">(Optional)</span></label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="h-10 w-full bg-transparent border-[#989898] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none rounded-[4px] uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#4B4B4B]">Business Type*</label>
                  <div className="grid grid-cols-3 gap-2">
                    {businessTypes.map((t) => {
                      const Icon = t.icon
                      const active = formData.businessType === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => { setFormData({ ...formData, businessType: t.value }); setErrors({ ...errors, businessType: '' }) }}
                          className={`flex flex-col items-center gap-1.5 rounded-[8px] border px-2 py-3 text-center transition-all ${
                            active
                              ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                              : 'border-[#E5E5E5] bg-white text-[#6E6E6E] hover:border-[#0066FF] hover:text-[#0066FF]'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-[12px] font-semibold leading-tight">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.businessType && <p className="mt-1 text-xs text-red-500 font-medium">{errors.businessType}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 relative">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">City*</label>
                    <Input
                      id="city"
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value)
                        setFormData({ ...formData, city: e.target.value })
                        setIsCityDropdownOpen(true)
                        setErrors({ ...errors, city: '' })
                      }}
                      onFocus={() => setIsCityDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsCityDropdownOpen(false), 200)}
                      placeholder="Search city e.g. Mumbai"
                      className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.city ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                    />
                    {errors.city && <p className="mt-1 text-xs text-red-500 font-medium">{errors.city}</p>}
                    {isCityDropdownOpen && (
                      <div className="absolute top-[60px] w-full left-0 z-[100] max-h-48 overflow-y-auto bg-white border border-[#989898] rounded-[4px] shadow-lg custom-scrollbar">
                        {filteredCities.length > 0 ? filteredCities.map((city) => (
                          <div
                            key={city}
                            className="px-4 py-2 cursor-pointer hover:bg-slate-100 text-[13px] text-[#4B4B4B]"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setCitySearch(city)
                              setFormData({ ...formData, city: city })
                              setIsCityDropdownOpen(false)
                            }}
                          >
                            {city}
                          </div>
                        )) : (
                          <div className="px-4 py-2 text-[13px] text-[#989898]">No cities found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">Address Workspace</label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter specific address line"
                      className="h-10 w-full bg-transparent border-[#989898] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none rounded-[4px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Team Setup */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#4B4B4B]">Team Setup</h3>
                    <p className="text-[13px] text-[#6E6E6E]">Add your team members and assign roles</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.employees.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-[#E5E5E5] rounded-xl bg-white/50 backdrop-blur-sm">
                      <p className="text-[13px] text-[#4B4B4B] font-medium mb-1">No team members added yet.</p>
                      <p className="text-[12px] text-[#6E6E6E]">You (the Business Owner) will be the default Admin.</p>
                    </div>
                  )}

                  {formData.employees.map((employee, index) => (
                    <div key={index} className="flex items-start gap-4 pb-3 border-b border-[#E5E5E5] last:border-0 pt-3 first:pt-0">
                      <div className="flex-1 grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-bold text-[#4B4B4B]">Name</label>
                          <Input
                            value={employee.name}
                            onChange={(e) => { updateEmployee(index, 'name', e.target.value); if (index === 0) setErrors({ ...errors, employeeName: '' }) }}
                            placeholder="Employee name"
                            className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${(index === 0 && errors.employeeName) ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                          />
                          {index === 0 && errors.employeeName && <p className="mt-1 text-xs text-red-500 font-medium">{errors.employeeName}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-bold text-[#4B4B4B]">Email</label>
                          <Input
                            type="email"
                            value={employee.email}
                            onChange={(e) => { updateEmployee(index, 'email', e.target.value); if (index === 0) setErrors({ ...errors, employeeEmail: '' }) }}
                            placeholder="email@example.com"
                            className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${(index === 0 && errors.employeeEmail) ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                          />
                          {index === 0 && errors.employeeEmail && <p className="mt-1 text-xs text-red-500 font-medium">{errors.employeeEmail}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-bold text-[#4B4B4B]">Phone</label>
                          <Input
                            value={employee.phone}
                            onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                            placeholder="+91 98765 43210"
                            className="h-10 w-full bg-transparent border-[#989898] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none rounded-[4px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-bold text-[#4B4B4B]">Role</label>
                          {roleTemplates.some(r => r.name === employee.role) || employee.role === '' ? (
                            <select
                              value={employee.role || ''}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  updateEmployee(index, 'role', '__typing__')
                                } else {
                                  updateEmployee(index, 'role', e.target.value)
                                }
                              }}
                              className="h-10 w-full bg-transparent border border-[#989898] text-[#4B4B4B] rounded-[4px] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none appearance-none bg-custom-chevron bg-[length:10px_10px] bg-no-repeat bg-[position:right_12px_center]"
                            >
                              <option value="" disabled hidden>Select a role</option>
                              {roleTemplates.map((role) => (
                                <option key={role.name} value={role.name}>{role.name}</option>
                              ))}
                              <option value="__custom__">+ Create new role...</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Input
                                autoFocus
                                value={employee.role === '__typing__' ? '' : employee.role}
                                onChange={(e) => updateEmployee(index, 'role', e.target.value)}
                                placeholder="Type custom role name"
                                className="h-10 flex-1 bg-transparent border-[#0066FF] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none rounded-[4px] text-[13px]"
                              />
                              <button
                                type="button"
                                onClick={() => updateEmployee(index, 'role', 'Sales Manager')}
                                className="text-[11px] text-[#989898] hover:text-[#4B4B4B] whitespace-nowrap cursor-pointer"
                              >
                                ← Back
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-7">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmployee(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={addEmployee}
                    className="w-full border-dashed border-[#989898] text-[#4B4B4B] hover:border-[#0066FF] hover:text-[#0066FF] hover:bg-transparent shadow-none"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                </div>
              </div>
            )}
            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {!onboardingResult ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 mb-2">
                        <CheckCircle2 className="h-7 w-7 text-[#0066FF]" />
                      </div>
                      <h3 className="text-[19px] font-semibold tracking-tight text-[#4B4B4B] mb-1">Review & Complete</h3>
                      <p className="text-[13px] text-[#6E6E6E]">Confirm your setup before finalising</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="border border-[#E5E5E5] rounded-[4px] p-4 text-[13px]">
                        <div className="flex items-center gap-2 font-bold mb-2 text-[#4B4B4B]">
                          <Building2 className="h-4 w-4 text-blue-600" /> Business Details
                        </div>
                        <div className="space-y-1 text-[#6E6E6E]">
                          <div><strong>Name:</strong> {formData.businessName}</div>
                          <div><strong>Type:</strong> {businessTypes.find(t => t.value === formData.businessType)?.label ?? formData.businessType}</div>
                          <div><strong>City:</strong> {formData.city}</div>
                          <div><strong>Email:</strong> {formData.email}</div>
                          {formData.gstNumber && <div><strong>GST:</strong> {formData.gstNumber}</div>}
                        </div>
                      </div>

                      <div className="border border-[#E5E5E5] rounded-[4px] p-4 text-[13px]">
                        <div className="flex items-center gap-2 font-bold mb-2 text-[#4B4B4B]">
                          <Users className="h-4 w-4 text-green-600" /> Team Members
                        </div>
                        <div className="space-y-1 text-[#6E6E6E]">
                          <div><strong>Total:</strong> {formData.employees.length} member{formData.employees.length !== 1 ? 's' : ''}</div>
                          {formData.employees.map((emp, i) => (
                            <div key={i}>{emp.name || `Member ${i + 1}`} — {emp.role}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-2">
                        <CheckCircle2 className="h-7 w-7 text-green-600" />
                      </div>
                      <h3 className="text-[19px] font-semibold text-[#4B4B4B] mb-1">🎉 Setup Complete!</h3>
                      <p className="text-[13px] text-[#6E6E6E]">
                        <strong>{onboardingResult.business?.business_name ?? formData.businessName}</strong> is ready. Share these temporary passwords with your team.
                      </p>
                    </div>

                    {onboardingResult?.employees_created?.length > 0 && (
                      <div className="border border-[#E5E5E5] rounded-[4px] overflow-hidden">
                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
                          <span className="text-amber-700 text-[12px] font-bold">⚠️ Temporary Passwords — share securely with each employee</span>
                        </div>
                        <table className="w-full text-[12px]">
                          <thead className="bg-[#F9F9F9]">
                            <tr>
                              <th className="text-left px-3 py-2 text-[#4B4B4B] font-bold">Name</th>
                              <th className="text-left px-3 py-2 text-[#4B4B4B] font-bold">Email</th>
                              <th className="text-left px-3 py-2 text-[#4B4B4B] font-bold">Role</th>
                              <th className="text-left px-3 py-2 text-[#4B4B4B] font-bold">Temp Password</th>
                            </tr>
                          </thead>
                          <tbody>
                            {onboardingResult.employees_created.map((emp, i) => (
                              <tr key={i} className="border-t border-[#E5E5E5]">
                                <td className="px-3 py-2 text-[#4B4B4B]">{emp.name}</td>
                                <td className="px-3 py-2 text-[#6E6E6E]">{emp.email}</td>
                                <td className="px-3 py-2 text-[#6E6E6E]">{emp.role}</td>
                                <td className="px-3 py-2 font-mono text-[#0066FF] select-all">{emp.temp_password}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {/* Step 4: WhatsApp Connection */}
            {currentStep === 4 && onboardingResult && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-[19px] font-semibold tracking-tight text-[#4B4B4B] mb-1">Connect WhatsApp</h3>
                  <p className="text-[13px] text-[#6E6E6E]">Link your WhatsApp Business account to start messaging customers</p>
                </div>
                <SimpleWhatsAppConnect
                  businessId={onboardingResult.business.business_id}
                  onComplete={() => router.push('/dashboard')}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between relative z-10 flex-shrink-0 mt-auto">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || currentStep === 4}
            className="flex items-center gap-2 border-[#E5E5E5] text-[#4B4B4B] rounded-full shadow-none px-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 3 && (
              <Button
                onClick={handleNext}
                className="bg-[#0066FF] hover:bg-[#0052CC] shadow-none flex items-center gap-2 rounded-full px-6 text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {currentStep === 3 && (
              onboardingResult ? (
                <Button
                  onClick={() => setCurrentStep(4)}
                  className="bg-[#0066FF] hover:bg-[#0052CC] shadow-none flex items-center gap-2 rounded-full px-6 text-white"
                >
                  Connect WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="bg-[#2EB865] hover:bg-[#20944F] shadow-none flex items-center gap-2 rounded-full px-6 text-white disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )
            )}
            {currentStep === 4 && (
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="border-[#E5E5E5] text-[#4B4B4B] rounded-full shadow-none px-6"
              >
                Skip for now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
