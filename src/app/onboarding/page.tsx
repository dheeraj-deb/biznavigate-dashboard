'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  Building2,
  Users,
  Zap,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Hotel,
  Calendar,
  Plus,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AppLogo } from '@/components/ui/app-logo'
import toast from 'react-hot-toast'

// Business type options
const businessTypes = [
  { value: 'retail', label: 'Retail / E-commerce', icon: Package, description: 'Sell physical products online or in-store' },
  { value: 'education', label: 'Education / Courses', icon: GraduationCap, description: 'Offer courses, training, or educational services' },
  { value: 'hospitality', label: 'Hotels / Resorts', icon: Hotel, description: 'Manage rooms, bookings, and accommodations' },
  { value: 'events', label: 'Events / Venues', icon: Calendar, description: 'Organize events, manage venues and tickets' },
]

// Role templates
const roleTemplates = [
  { name: 'Admin', permissions: ['all'], description: 'Full access to all features' },
  { name: 'Sales Manager', permissions: ['leads', 'customers', 'orders'], description: 'Manage sales and customers' },
  { name: 'Support Agent', permissions: ['leads', 'inbox'], description: 'Handle customer inquiries' },
  { name: 'Inventory Manager', permissions: ['products', 'inventory'], description: 'Manage products and stock' },
]

const INDIAN_CITIES = ['Agartala', 'Agra', 'Ahmedabad', 'Ahmednagar', 'Aizawl', 'Ajmer', 'Akola', 'Aligarh', 'Allahabad', 'Alwar', 'Ambala', 'Amravati', 'Amritsar', 'Anand', 'Anantapur', 'Asansol', 'Aurangabad', 'Avadi', 'Bally', 'Bangalore', 'Baranagar', 'Barasat', 'Bardhaman', 'Bareilly', 'Bathinda', 'Begusarai', 'Belgaum', 'Bellary', 'Berhampur', 'Bhagalpur', 'Bharatpur', 'Bhatpara', 'Bhavnagar', 'Bhilai', 'Bhilwara', 'Bhiwandi', 'Bhopal', 'Bhubaneswar', 'Bhuj', 'Bikaner', 'Bilaspur', 'Bokaro', 'Chandigarh', 'Chandrapur', 'Chennai', 'Coimbatore', 'Cuttack', 'Darbhanga', 'Davanagere', 'Dehradun', 'Delhi', 'Deoghar', 'Dhanbad', 'Dhule', 'Dindigul', 'Durg', 'Durgapur', 'Erode', 'Etawah', 'Faridabad', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gandhidham', 'Gandhinagar', 'Gangtok', 'Gaya', 'Ghaziabad', 'Gopalpur', 'Gorakhpur', 'Gulbarga', 'Guntur', 'Gurgaon', 'Guwahati', 'Gwalior', 'Haldia', 'Hapur', 'Haridwar', 'Hisar', 'Hoshiarpur', 'Howrah', 'Hubli', 'Hyderabad', 'Imphal', 'Indore', 'Jabalpur', 'Jaipur', 'Jalandhar', 'Jalgaon', 'Jalna', 'Jamalpur', 'Jammu', 'Jamnagar', 'Jamshedpur', 'Jhansi', 'Jodhpur', 'Junagadh', 'Kadapa', 'Kakinada', 'Kalyan', 'Kamarhati', 'Kanchipuram', 'Kannur', 'Kanpur', 'Karnal', 'Kharagpur', 'Kochi', 'Kolhapur', 'Kolkata', 'Kollam', 'Korba', 'Kota', 'Kottayam', 'Kozhikode', 'Kulti', 'Kurnool', 'Latur', 'Loni', 'Lucknow', 'Ludhiana', 'Madurai', 'Malappuram', 'Malegaon', 'Mangalore', 'Mango', 'Mathura', 'Mau', 'Meerut', 'Mira-Bhayandar', 'Mirzapur', 'Moradabad', 'Mumbai', 'Muzaffarnagar', 'Muzaffarpur', 'Mysore', 'Nadiad', 'Nagaon', 'Nagpur', 'Naihati', 'Nanded', 'Nashik', 'Navi Mumbai', 'Nellore', 'New Delhi', 'Nizamabad', 'Noida', 'Ozhukarai', 'Pali', 'Panihati', 'Panipat', 'Parbhani', 'Patiala', 'Patna', 'Phagwara', 'Pimpri-Chinchwad', 'Pondicherry', 'Pune', 'Purnia', 'Raebareli', 'Raichur', 'Raipur', 'Rajahmundry', 'Rajkot', 'Ramagundam', 'Rampur', 'Ranchi', 'Ratlam', 'Raurkela', 'Rewa', 'Rohtak', 'Rourkela', 'Sagar', 'Saharanpur', 'Salem', 'Sangli', 'Satna', 'Secunderabad', 'Shahjahanpur', 'Shimla', 'Shivamogga', 'Sikar', 'Siliguri', 'Solapur', 'Sonipat', 'South Dumdum', 'Sri Ganganagar', 'Srinagar', 'Surat', 'Thane', 'Thiruvananthapuram', 'Thoothukudi', 'Thrissur', 'Tiruchirappalli', 'Tirunelveli', 'Tirupati', 'Tiruppur', 'Tiruvottiyur', 'Tumkur', 'Udaipur', 'Ujjain', 'Ulhasnagar', 'Vadodara', 'Varanasi', 'Vasai-Virar', 'Vellore', 'Vijayanagaram', 'Vijayawada', 'Visakhapatnam', 'Warangal', 'Yamunanagar']

const PRODUCT_SUGGESTIONS: Record<string, string[]> = {
  retail: ['T-Shirts', 'Jeans', 'Sneakers', 'Accessories', 'Electronics'],
  education: ['Web Development', 'Digital Marketing', 'Data Science', 'Design', 'Language'],
  hospitality: ['Deluxe Room', 'Suite', 'Family Room', 'Standard Room', 'Villa'],
  events: ['Weddings', 'Corporate Events', 'Birthdays', 'Concerts', 'Exhibitions'],
  services: ['Consulting', 'Development', 'Design', 'Marketing', 'Support'],
  default: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']
}

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  retail: ['Clothing', 'Shoes', 'Electronics', 'Home & Garden'],
  education: ['Technology', 'Business', 'Arts', 'Science'],
  hospitality: ['Accommodation', 'Dining', 'Experiences', 'Spa'],
  events: ['Private', 'Corporate', 'Social', 'Public'],
  services: ['B2B', 'B2C', 'Retainer', 'One-off'],
  default: ['Category 1', 'Category 2', 'Category 3', 'Category 4']
}

const BUSINESS_DESCRIPTION_TEMPLATES: Record<string, string> = {
  retail: "We are a premium retail business specializing in [Products]. We pride ourselves on offering high-quality items and exceptional customer service to our community.",
  education: "We are an educational institution offering comprehensive courses in [Products]. Our goal is to empower students with practical skills and knowledge.",
  hospitality: "We are a top-tier hospitality provider offering comfortable stays in our [Products]. We ensure every guest experiences luxury, comfort, and outstanding service.",
  events: "We are a professional event management company specializing in [Products]. We turn visions into unforgettable experiences with meticulous planning.",
  services: "We provide expert [Products] services to our clients. We focus on delivering tailored solutions and achieving exceptional results.",
  default: "We are a dedicated business offering [Products]. We focus on quality, reliability, and ensuring the best possible experience for our customers."
}

const AUDIENCE_SUGGESTIONS: Record<string, string[]> = {
  retail: ['Fashion Enthusiasts', 'Bargain Hunters', 'Tech Savvy', 'Parents'],
  education: ['Students', 'Professionals', 'Career Changers', 'Lifelong Learners'],
  hospitality: ['Tourists', 'Business Travelers', 'Families', 'Couples'],
  events: ['Corporate Clients', 'Engaged Couples', 'Families', 'Music Fans'],
  services: ['Local Businesses', 'Startups', 'Homeowners', 'Enterprise'],
  default: ['Local Residents', 'Online Shoppers', 'General Public', 'B2B Clients']
}
export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [citySearch, setCitySearch] = useState('')
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

    // Step 2: Team Setup
    employees: [] as Array<{ name: string; email: string; role: string; phone: string }>,

    // Step 3: Initial Products
    initialProducts: '',
    productCategories: '',

    // Step 5: AI Configuration
    businessDescription: '',
    targetAudience: '',
    aiTone: 'professional',
  })

  const totalSteps = 5

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business Name is required'
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required'
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
      if (!formData.businessType) newErrors.businessType = 'Business Type is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
    } else if (step === 2) {
      if (formData.employees.length > 0) {
        if (!formData.employees[0].name.trim()) newErrors.employeeName = 'Employee name is required'
        if (!formData.employees[0].email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.employees[0].email)) newErrors.employeeEmail = 'Valid employee email is required'
      }
    } else if (step === 3) {
      if (!formData.productCategories.trim()) newErrors.productCategories = 'Please select at least one category'
      if (!formData.initialProducts.trim()) newErrors.initialProducts = 'Please enter or select at least one product'
    } else if (step === 4) {
      if (!formData.businessDescription.trim()) newErrors.businessDescription = 'Business description is required'
      if (!formData.targetAudience.trim()) newErrors.targetAudience = 'Target audience is required'
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

  const handleComplete = () => {
    // Submit onboarding data
    toast.success('Onboarding complete!', { icon: '🚀' })
    router.push('/')
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

  const toggleSelection = (field: 'initialProducts' | 'productCategories' | 'targetAudience', item: string) => {
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
    const products = formData.initialProducts ? formData.initialProducts : 'our core offerings'
    const finalDesc = template.replace('[Products]', products)
    setFormData({ ...formData, businessDescription: finalDesc })
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 selection:bg-blue-600/20 font-sans overflow-hidden relative flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
      <div className="container relative z-10 mx-auto px-4 py-6 max-w-4xl flex flex-col h-full flex-1 min-h-0">
        {/* Header */}
        <div className="text-center mb-4 flex-shrink-0">
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
        <div className="mb-4 flex-shrink-0">
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
        <Card className="border-slate-200/60 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-xl mb-4 relative z-20 flex-1 min-h-0 flex flex-col">
          <CardContent className="p-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
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

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#4B4B4B]">Business Type*</label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => { setFormData({ ...formData, businessType: e.target.value }); setErrors({ ...errors, businessType: '' }) }}
                    className={`h-10 w-full bg-transparent border text-[#4B4B4B] rounded-[4px] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 transition-colors shadow-none appearance-none bg-[length:10px_10px] bg-no-repeat bg-[position:right_12px_center] ${errors.businessType ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 bg-custom-chevron-error text-red-900 focus:ring-red-500 focus:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] bg-custom-chevron'}`}
                  >
                    <option value="" disabled hidden>Select Business Type</option>
                    {businessTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
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
                          <select
                            value={employee.role}
                            onChange={(e) => updateEmployee(index, 'role', e.target.value)}
                            className="h-10 w-full bg-transparent border border-[#989898] text-[#4B4B4B] rounded-[4px] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none appearance-none bg-custom-chevron bg-[length:10px_10px] bg-no-repeat bg-[position:right_12px_center]"
                          >
                            {roleTemplates.map((role) => (
                              <option key={role.name} value={role.name}>
                                {role.name}
                              </option>
                            ))}
                          </select>
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

            {/* Step 3: Initial Products/Services */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#4B4B4B]">
                      {formData.businessType === 'education' ? 'Initial Courses' :
                        formData.businessType === 'hospitality' ? 'Room Types' :
                          formData.businessType === 'events' ? 'Event Types' :
                            formData.businessType === 'services' ? 'Services Offered' : 'Initial Products'}
                    </h3>
                    <p className="text-[13px] text-[#6E6E6E]">Tell us what you offer (you can add more later)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5 border border-[#E5E5E5] p-4 rounded-[4px]">
                    <label className="text-[13px] font-bold text-[#4B4B4B] block mb-2">
                      {formData.businessType === 'education' ? 'What courses do you offer?' :
                        formData.businessType === 'hospitality' ? 'What room types do you have?' :
                          formData.businessType === 'events' ? 'What events do you organize?' :
                            formData.businessType === 'services' ? 'What services do you provide?' :
                              'What products do you sell?'}
                      <span className="text-xs font-normal ml-2 italic text-[#6E6E6E]">(Click suggestions or type custom)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(PRODUCT_SUGGESTIONS[formData.businessType || 'retail'] || PRODUCT_SUGGESTIONS['retail']).map(item => {
                        const isSelected = (formData.initialProducts || '').split(',').map(s => s.trim()).includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleSelection('initialProducts', item)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors border ${isSelected
                              ? 'bg-[#0066FF] text-white border-[#0066FF]'
                              : 'bg-transparent text-[#4B4B4B] border-[#E5E5E5] hover:border-[#0066FF] hover:text-[#0066FF]'
                              }`}
                          >
                            {item}
                          </button>
                        )
                      })}
                    </div>
                    <Input
                      value={formData.initialProducts}
                      onChange={(e) => { setFormData({ ...formData, initialProducts: e.target.value }); setErrors({ ...errors, initialProducts: '' }) }}
                      placeholder={
                        formData.businessType === 'education' ? 'Select from above or type comma separated...' :
                          formData.businessType === 'hospitality' ? 'Select from above or type comma separated...' :
                            formData.businessType === 'events' ? 'Select from above or type comma separated...' :
                              formData.businessType === 'services' ? 'Select from above or type comma separated...' :
                                'Select from above or type comma separated...'
                      }
                      className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.initialProducts ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                    />
                    {errors.initialProducts && <p className="mt-1 text-xs text-red-500 font-medium">{errors.initialProducts}</p>}
                  </div>

                  <div className="space-y-1.5 border border-[#E5E5E5] p-4 rounded-[4px]">
                    <label className="text-[13px] font-bold text-[#4B4B4B] block mb-2">Categories <span className="text-xs font-normal ml-2 italic text-[#6E6E6E]">(Click suggestions or type custom)</span></label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(CATEGORY_SUGGESTIONS[formData.businessType || 'retail'] || CATEGORY_SUGGESTIONS['retail']).map(item => {
                        const isSelected = (formData.productCategories || '').split(',').map(s => s.trim()).includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleSelection('productCategories', item)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors border ${isSelected
                              ? 'bg-[#0066FF] text-white border-[#0066FF]'
                              : 'bg-transparent text-[#4B4B4B] border-[#E5E5E5] hover:border-[#0066FF] hover:text-[#0066FF]'
                              }`}
                          >
                            {item}
                          </button>
                        )
                      })}
                    </div>
                    <Input
                      value={formData.productCategories}
                      onChange={(e) => { setFormData({ ...formData, productCategories: e.target.value }); setErrors({ ...errors, productCategories: '' }) }}
                      placeholder="Select from above or type comma separated..."
                      className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.productCategories ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                    />
                    {errors.productCategories && <p className="mt-1 text-xs text-red-500 font-medium">{errors.productCategories}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: AI Configuration */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                    <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#4B4B4B]">AI Assistant Setup</h3>
                    <p className="text-[13px] text-[#6E6E6E]">Configure your AI chatbot for customer interactions</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1.5 border border-[#E5E5E5] p-3 rounded-[4px]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[12px] font-bold text-[#4B4B4B]">Business Description</label>
                      <button
                        type="button"
                        onClick={injectDescriptionTemplate}
                        className="text-[11px] text-[#0066FF] hover:text-[#0052CC] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        ✨ Use smart template
                      </button>
                    </div>
                    <Textarea
                      value={formData.businessDescription}
                      onChange={(e) => { setFormData({ ...formData, businessDescription: e.target.value }); setErrors({ ...errors, businessDescription: '' }) }}
                      placeholder="Describe your business in a few sentences. This helps the AI understand your business better..."
                      className={`w-full bg-transparent text-[13px] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] resize-none ${errors.businessDescription ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                      rows={2}
                    />
                    {errors.businessDescription && <p className="mt-1 text-xs text-red-500 font-medium">{errors.businessDescription}</p>}
                  </div>

                  <div className="space-y-1.5 border border-[#E5E5E5] p-3 rounded-[4px]">
                    <label className="text-[12px] font-bold text-[#4B4B4B] block mb-1">Target Audience <span className="text-[11px] font-normal ml-2 italic text-[#6E6E6E]">(Click suggestions or type custom)</span></label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(AUDIENCE_SUGGESTIONS[formData.businessType || 'retail'] || AUDIENCE_SUGGESTIONS['retail']).map(item => {
                        const isSelected = (formData.targetAudience || '').split(',').map(s => s.trim()).includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleSelection('targetAudience', item)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors border ${isSelected
                              ? 'bg-[#0066FF] text-white border-[#0066FF]'
                              : 'bg-transparent text-[#4B4B4B] border-[#E5E5E5] hover:border-[#0066FF] hover:text-[#0066FF]'
                              }`}
                          >
                            {item}
                          </button>
                        )
                      })}
                    </div>
                    <Input
                      value={formData.targetAudience}
                      onChange={(e) => { setFormData({ ...formData, targetAudience: e.target.value }); setErrors({ ...errors, targetAudience: '' }) }}
                      placeholder="Select from above or type comma separated..."
                      className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.targetAudience ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                    />
                    {errors.targetAudience && <p className="mt-1 text-xs text-red-500 font-medium">{errors.targetAudience}</p>}
                  </div>

                  <div className="space-y-1.5 border border-[#E5E5E5] p-3 rounded-[4px]">

                    <div className="space-y-1">
                      <label className="text-[12px] font-bold text-[#4B4B4B]">AI Conversation Tone</label>
                      <select
                        value={formData.aiTone}
                        onChange={(e) => setFormData({ ...formData, aiTone: e.target.value })}
                        className="h-10 w-full bg-transparent border border-[#989898] text-[#4B4B4B] rounded-[4px] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none appearance-none bg-custom-chevron bg-[length:10px_10px] bg-no-repeat bg-[position:right_12px_center]"
                      >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="casual">Casual</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-2">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-[22px] font-semibold tracking-tight text-[#4B4B4B] mb-1">You're All Set!</h3>
                  <p className="text-[13px] text-[#6E6E6E]">Review your setup and start using BizNavigo</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="border border-[#E5E5E5] rounded-[4px] p-4 text-[13px]">
                    <div className="flex items-center gap-2 font-bold mb-2 text-[#4B4B4B]">
                      <Building2 className="h-4 w-4 text-blue-600" /> Business Details
                    </div>
                    <div className="space-y-1 text-[#6E6E6E]">
                      <div><strong>Name:</strong> {formData.businessName}</div>
                      <div><strong>Type:</strong> {businessTypes.find(t => t.value === formData.businessType)?.label}</div>
                      <div><strong>City:</strong> {formData.city}</div>
                    </div>
                  </div>

                  <div className="border border-[#E5E5E5] rounded-[4px] p-4 text-[13px]">
                    <div className="flex items-center gap-2 font-bold mb-2 text-[#4B4B4B]">
                      <Users className="h-4 w-4 text-green-600" /> Team Members
                    </div>
                    <div className="space-y-1 text-[#6E6E6E]">
                      <div><strong>Total:</strong> {formData.employees.length} team members</div>
                      {formData.employees.slice(0, 2).map((emp, i) => (
                        <div key={i}>{emp.name || `Member ${i + 1}`} - {emp.role}</div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-[#E5E5E5] rounded-[4px] p-4 text-[13px]">
                    <div className="flex items-center gap-2 font-bold mb-2 text-[#4B4B4B]">
                      <Zap className="h-4 w-4 text-indigo-600" /> AI Assistant
                    </div>
                    <div className="space-y-1 text-[#6E6E6E]">
                      <div><strong>Tone:</strong> {formData.aiTone}</div>
                      <div><strong>Status:</strong> Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between relative z-10 flex-shrink-0 mt-auto">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 border-[#E5E5E5] text-[#4B4B4B] rounded-full shadow-none px-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="bg-[#0066FF] hover:bg-[#0052CC] shadow-none flex items-center gap-2 rounded-full px-6 text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-[#2EB865] hover:bg-[#20944F] shadow-none flex items-center gap-2 rounded-full px-6 text-white"
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
