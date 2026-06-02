'use client'

import { useState } from 'react'
import { useCompleteOnboarding, type OnboardingResult } from '@/hooks/use-onboarding'
import { useAuthStore } from '@/store/auth-store'
import { onboardingBusinessTypes } from '@/business-types/onboarding-business-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TypingText } from '@/components/ui/typing-text'
import { resolveIcon } from '@/lib/icon-resolver'

import {
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Bot,
  MessageCircle,
  Package,
  Shield,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AppLogo } from '@/components/ui/app-logo'
import toast from 'react-hot-toast'
import { SimpleWhatsAppConnect } from '@/components/whatsapp/simple-whatsapp-connect'

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
  products:    "[BusinessName] is a product business in [City], helping customers discover, ask about, and order quality products through fast WhatsApp support.",
  retail:      "[BusinessName] is a retail business in [City], helping customers discover and buy quality products with fast, helpful service.",
  healthcare:  "[BusinessName] is a healthcare practice in [City], helping patients get timely support, appointments, and follow-ups.",
  real_estate: "[BusinessName] is a real estate business in [City], helping buyers, renters, and property owners with trusted property guidance.",
  professional_services: "[BusinessName] is a professional services business in [City], helping clients solve important problems with reliable expertise.",
  crm_automation: "[BusinessName] is a CRM and automation workspace in [City], helping the team manage leads, campaigns, FAQs, workflows, and customer conversations.",
  education:   "[BusinessName] is an education business in [City], helping students learn, enroll, and succeed through structured programs.",
  default:     "[BusinessName] is a dedicated business in [City], focused on quality, reliability, and the best possible experience for our customers."
}

const AUDIENCE_SUGGESTIONS: Record<string, string[]> = {
  hospitality: ['Tourists', 'Business Travelers', 'Families', 'Couples'],
  events:      ['Corporate Clients', 'Engaged Couples', 'Families', 'Music Fans'],
  products:    ['Online Shoppers', 'Bargain Hunters', 'Local Residents', 'B2B Clients'],
  retail:      ['Online Shoppers', 'Local Customers', 'Repeat Buyers', 'B2B Clients'],
  healthcare:  ['Patients', 'Families', 'Returning Visitors', 'Local Residents'],
  real_estate: ['Home Buyers', 'Property Owners', 'Investors', 'Tenants'],
  professional_services: ['Clients', 'Business Owners', 'Local Residents', 'Teams'],
  crm_automation: ['Leads', 'Customers', 'Support Requests', 'Sales Teams'],
  education:   ['Students', 'Parents', 'Professionals', 'Learners'],
  default:     ['Local Residents', 'Online Shoppers', 'General Public', 'B2B Clients']
}

const WHATSAPP_USAGE_OPTIONS = [
  {
    value: 'business_app',
    label: 'WhatsApp Business App',
    description: 'I already use the green WhatsApp Business app on this phone number.',
    guidance: 'Use Meta popup only. Do not delete the app/account manually. Meta may allow app + API coexistence or ask for migration.',
  },
  {
    value: 'personal_whatsapp',
    label: 'Normal WhatsApp',
    description: 'I use the regular personal WhatsApp app for this number.',
    guidance: 'Use a business number when possible. Personal/family numbers are risky for automation and should not receive bulk campaigns.',
  },
  {
    value: 'new_number',
    label: 'New number',
    description: 'This number is not used on WhatsApp yet, or I will create a new setup.',
    guidance: 'Create/select the setup inside Meta popup. Catalogue import will be empty until products are added.',
  },
  {
    value: 'not_sure',
    label: 'Not sure',
    description: 'I am not sure how this WhatsApp number is currently used.',
    guidance: 'Continue safely. Meta popup will show available options. Do not delete any WhatsApp account manually.',
  },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const totalSteps = 5
  const [currentStep, setCurrentStep] = useState(1)
  const [citySearch, setCitySearch] = useState('')
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showWorkingHoursPopover, setShowWorkingHoursPopover] = useState(false)

  const filteredCities = INDIAN_CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
  const [formData, setFormData] = useState({
    // Step 1: Business Type
    businessName: '',
    businessType: '',
    industry: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: 'India',
    gstNumber: '',
    panNumber: '',
    whatsappUsage: 'not_sure' as 'business_app' | 'personal_whatsapp' | 'new_number' | 'not_sure',
    whatsappSafetyAcknowledged: false,

    // Step 3: Team Setup
    employees: [] as Array<{ name: string; email: string; role: string; phone: string }>,

    // Future AI Configuration
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
      if (!formData.businessType) newErrors.businessType = 'Business Type is required'
    } else if (step === 2) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business Name is required'
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required'
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
      if (formData.businessType === 'products' && !formData.whatsappSafetyAcknowledged) {
        newErrors.whatsappSafetyAcknowledged = 'Please confirm WhatsApp safety guidance'
      }
    } else if (step === 3 && formData.employees.length > 0) {
      formData.employees.forEach((employee, index) => {
        const hasAnyValue = Boolean(employee.name.trim() || employee.email.trim() || employee.phone.trim())
        if (!hasAnyValue) return
        if (!employee.name.trim()) newErrors[`employeeName${index}`] = 'Employee name is required'
        if (!employee.email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employee.email)) {
          newErrors[`employeeEmail${index}`] = 'Valid employee email is required'
        }
      })
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
      whatsapp_number: formData.whatsappNumber || formData.phone || undefined,
      whatsapp_current_usage: formData.whatsappUsage,
      whatsapp_safety_acknowledged: formData.whatsappSafetyAcknowledged,
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
        setCurrentStep(5)
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

  const selectedBusinessType = onboardingBusinessTypes.find((type) => type.value === formData.businessType) ?? onboardingBusinessTypes[0]
  const progressPercent = Math.round((currentStep / totalSteps) * 100)
  const isProductSeller = formData.businessType === 'products'
  const handleWhatsAppConnected = () => {
    router.push(isProductSeller ? '/inventory/products' : '/dashboard')
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 selection:bg-blue-600/20 font-sans overflow-hidden relative flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
      <div className="container relative z-10 mx-auto px-4 py-4 max-w-7xl flex flex-col h-full flex-1 min-h-0">
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

        <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-[60px_1fr]">
          <aside className="relative z-20 hidden min-h-0 flex-col rounded-[16px] border border-[#E8EEFF] bg-white/75 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur lg:flex">
            <div className="flex flex-col items-center space-y-2">
              {Array.from({ length: totalSteps }).map((_, index) => {
                const stepNumber = index + 1
                const isComplete = stepNumber < currentStep
                const isCurrent = stepNumber === currentStep
                return (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                        isComplete
                          ? 'bg-[#0066FF] text-white'
                          : isCurrent
                            ? 'border border-[#0066FF] bg-[#F5F8FF] text-[#0066FF]'
                            : 'border border-[#E5EAF5] bg-white text-[#989898]'
                      }`}
                    >
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* <div className="mt-auto rounded-[12px] bg-[#F5F8FF] p-3">
              <p className="text-[20px] font-bold leading-none text-[#0066FF]">{progressPercent}%</p>
              <p className="mt-1 text-[11px] font-semibold text-[#6E6E6E]">Complete</p>
            </div> */}
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between rounded-[12px] border border-[#E8EEFF] bg-white/75 px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur lg:hidden">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0066FF]">
                  Step {currentStep} of {totalSteps}
                </p>
              </div>
              <div className="rounded-full bg-[#F5F8FF] px-3 py-1 text-[12px] font-bold text-[#0066FF]">
                {progressPercent}%
              </div>
            </div>

            {/* Step Content */}
            <Card className="border-slate-200/60 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-xl mb-3 relative z-20 flex-1 min-h-0 flex flex-col">
              <CardContent className="p-5 flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {/* Step 1: Business Type Selection */}
            {currentStep === 1 && (
              <div className="grid gap-5 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px]">
                <div className="space-y-4">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0066FF]">Choose your workspace</p>
                    <h3 className="mt-1 text-[22px] font-semibold tracking-tight text-[#4B4B4B]">
                      What type of business are you setting up?
                    </h3>
                    <p className="mt-1 text-[13px] text-[#6E6E6E]">
                      We will tailor navigation, dashboard widgets, workflows, and labels around this choice.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {onboardingBusinessTypes.map((type) => {
                      const Icon = resolveIcon(type.icon)
                      const active = formData.businessType === type.value
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, businessType: type.value })
                            setErrors({ ...errors, businessType: '' })
                          }}
                          className={`group flex min-h-[104px] items-start gap-3 rounded-[12px] border p-4 text-left transition-all ${
                            active
                              ? 'border-[#0066FF] bg-[#0066FF]/5 shadow-[0_12px_30px_rgba(0,102,255,0.10)]'
                              : 'border-[#E5E5E5] bg-white hover:border-[#0066FF]/60 hover:bg-[#F7FAFF]'
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
                              active ? 'bg-[#0066FF] text-white' : 'bg-[#EEF3FF] text-[#0066FF]'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 text-[14px] font-bold text-[#4B4B4B]">
                              {type.label}
                              {active && <CheckCircle2 className="h-4 w-4 text-[#0066FF]" />}
                            </span>
                            <span className="mt-1 block text-[12px] leading-5 text-[#6E6E6E]">{type.description}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.businessType && <p className="text-xs font-medium text-red-500">{errors.businessType}</p>}
                </div>

                <div className="flex min-h-full w-full max-w-[400px] flex-col rounded-[14px] border border-[#E5E5E5] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] lg:justify-self-end">
                  <div className="mb-4 rounded-[12px] border border-[#E8EEFF] bg-[#F8FBFF] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEF3FF] text-[#0066FF]">
                        {(() => {
                          const Icon = resolveIcon(selectedBusinessType.icon)
                          return <Icon className="h-5 w-5" />
                        })()}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0066FF]">Recommended setup</p>
                        <h4 className="text-[18px] font-bold text-[#4B4B4B]">{selectedBusinessType.label}</h4>
                      </div>
                    </div>
                    <TypingText
                      key={selectedBusinessType.value}
                      text={selectedBusinessType.explanation}
                      className="mt-4 min-h-[120px] text-[13px] leading-6 text-[#4B4B4B]"
                    />
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#6E6E6E]">Features included</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBusinessType.features.map((feature) => (
                          <span key={feature} className="rounded-full border border-[#E5E5E5] bg-[#F9FAFB] px-3 py-1 text-[12px] font-semibold text-[#4B4B4B]">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#6E6E6E]">Commonly used by</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedBusinessType.industries.map((industry) => (
                          <div key={industry} className="rounded-[10px] border border-[#F0F0F0] bg-[#FCFCFC] px-3 py-2 text-[12px] font-medium text-[#4B4B4B]">
                            {industry}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <Building2 className="h-6 w-6 text-[#0066FF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#4B4B4B]">Business Details</h3>
                    <p className="text-[13px] text-[#6E6E6E]">Add the basic information we need to create your workspace.</p>
                  </div>
                </div>

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
                      onChange={(e) => {
                        const nextPhone = e.target.value
                        setFormData({
                          ...formData,
                          phone: nextPhone,
                          whatsappNumber: formData.whatsappNumber || nextPhone,
                        })
                        setErrors({ ...errors, phone: '' })
                      }}
                      placeholder="+91 98765 43210"
                      className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.phone ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">WhatsApp Number</label>
                    <Input
                      id="whatsappNumber"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="h-10 w-full bg-transparent border-[#989898] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none rounded-[4px]"
                    />
                    <p className="text-[11px] text-[#989898]">
                      {isProductSeller
                        ? 'Used for customer chat, product enquiries and AI replies.'
                        : 'Used for customer chat, booking links and AI replies.'}
                    </p>
                  </div>
                </div>

                {isProductSeller && (
                  <div className="rounded-[10px] border border-amber-200 bg-amber-50/70 p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-white text-amber-700">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#4B4B4B]">Where is this WhatsApp number used now?</p>
                        <p className="mt-0.5 text-[12px] text-[#6E6E6E]">
                          This helps us show the right Meta onboarding path and avoid unsafe number handling.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      {WHATSAPP_USAGE_OPTIONS.map((option) => {
                        const active = formData.whatsappUsage === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, whatsappUsage: option.value })
                              setErrors({ ...errors, whatsappSafetyAcknowledged: '' })
                            }}
                            className={`rounded-[8px] border bg-white px-3 py-3 text-left transition-all ${
                              active
                                ? 'border-amber-500 shadow-[0_8px_20px_rgba(245,158,11,0.12)]'
                                : 'border-[#E5E5E5] hover:border-amber-300'
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-bold text-[#4B4B4B]">{option.label}</span>
                              {active && <CheckCircle2 className="h-4 w-4 text-amber-600" />}
                            </span>
                            <span className="mt-1 block text-[12px] leading-5 text-[#6E6E6E]">{option.description}</span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-3 rounded-[8px] bg-white px-3 py-2 text-[12px] leading-5 text-[#4B4B4B]">
                      {WHATSAPP_USAGE_OPTIONS.find((option) => option.value === formData.whatsappUsage)?.guidance}
                    </div>

                    <label className="mt-3 flex items-start gap-2 text-[12px] text-[#4B4B4B]">
                      <input
                        type="checkbox"
                        checked={formData.whatsappSafetyAcknowledged}
                        onChange={(e) => {
                          setFormData({ ...formData, whatsappSafetyAcknowledged: e.target.checked })
                          setErrors({ ...errors, whatsappSafetyAcknowledged: '' })
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-[#989898]"
                      />
                      <span>
                        I understand that I should follow the Meta popup, avoid manual account deletion, use opted-in messaging, and avoid spam/bulk sending.
                      </span>
                    </label>
                    {errors.whatsappSafetyAcknowledged && (
                      <p className="mt-2 text-xs font-medium text-red-500">{errors.whatsappSafetyAcknowledged}</p>
                    )}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#4B4B4B]">Website <span className="text-[11px] font-normal text-[#6E6E6E]">(Optional)</span></label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourbusiness.com"
                      className="h-10 w-full bg-transparent border-[#989898] text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF] transition-colors shadow-none rounded-[4px]"
                    />
                  </div>

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
                    {onboardingBusinessTypes.filter((t) => ['hospitality', 'events', 'products'].includes(t.value)).map((t) => {
                      const Icon = resolveIcon(t.icon)
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
                    <label className="text-[13px] font-bold text-[#4B4B4B]">Address</label>
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

            {/* Step 3: Team Setup */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#4B4B4B]">Team Access</h3>
                    <p className="text-[13px] text-[#6E6E6E]">Optional. Add staff now or skip and invite them later.</p>
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
                            onChange={(e) => { updateEmployee(index, 'name', e.target.value); setErrors({ ...errors, [`employeeName${index}`]: '' }) }}
                            placeholder="Employee name"
                            className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors[`employeeName${index}`] ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                          />
                          {errors[`employeeName${index}`] && <p className="mt-1 text-xs text-red-500 font-medium">{errors[`employeeName${index}`]}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-bold text-[#4B4B4B]">Email</label>
                          <Input
                            type="email"
                            value={employee.email}
                            onChange={(e) => { updateEmployee(index, 'email', e.target.value); setErrors({ ...errors, [`employeeEmail${index}`]: '' }) }}
                            placeholder="email@example.com"
                            className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors[`employeeEmail${index}`] ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'}`}
                          />
                          {errors[`employeeEmail${index}`] && <p className="mt-1 text-xs text-red-500 font-medium">{errors[`employeeEmail${index}`]}</p>}
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
            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-4">
                {!onboardingResult ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 mb-2">
                        <CheckCircle2 className="h-7 w-7 text-[#0066FF]" />
                      </div>
                      <h3 className="text-[19px] font-semibold tracking-tight text-[#4B4B4B] mb-1">Review & Launch Setup</h3>
                      <p className="text-[13px] text-[#6E6E6E]">
                        {isProductSeller
                          ? 'Confirm the basics. Next, connect WhatsApp and import your existing product catalogue.'
                          : 'Confirm the basics. Next, the dashboard will guide WhatsApp, inventory and booking setup.'}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="border border-[#E5E5E5] rounded-[4px] p-4 text-[13px]">
                        <div className="flex items-center gap-2 font-bold mb-2 text-[#4B4B4B]">
                          <Building2 className="h-4 w-4 text-blue-600" /> Business Details
                        </div>
                        <div className="space-y-1 text-[#6E6E6E]">
                          <div><strong>Name:</strong> {formData.businessName}</div>
                          <div><strong>Type:</strong> {onboardingBusinessTypes.find(t => t.value === formData.businessType)?.label ?? formData.businessType}</div>
                          <div><strong>City:</strong> {formData.city}</div>
                          <div><strong>Email:</strong> {formData.email}</div>
                          <div><strong>WhatsApp:</strong> {formData.whatsappNumber || formData.phone}</div>
                          {formData.gstNumber && <div><strong>GST:</strong> {formData.gstNumber}</div>}
                        </div>
                      </div>

                      <div className="border border-[#E5E5E5] rounded-[4px] p-4 text-[13px]">
                        <div className="flex items-center gap-2 font-bold mb-2 text-[#4B4B4B]">
                          <Users className="h-4 w-4 text-green-600" /> Team Members
                        </div>
                        <div className="space-y-1 text-[#6E6E6E]">
                          <div><strong>Total:</strong> {formData.employees.length} member{formData.employees.length !== 1 ? 's' : ''}</div>
                          {formData.employees.length === 0 ? (
                            <div>You can invite staff later from settings.</div>
                          ) : formData.employees.map((emp, i) => (
                            <div key={i}>{emp.name || `Member ${i + 1}`} - {emp.role}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[8px] border border-blue-100 bg-[#F7FAFF] p-4">
                      <div className="mb-3 flex items-center gap-2 font-bold text-[#4B4B4B]">
                        <Bot className="h-4 w-4 text-[#0066FF]" />
                        What happens after setup
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-md bg-white p-3">
                          <MessageCircle className="mb-2 h-4 w-4 text-green-600" />
                          <p className="text-[13px] font-bold text-[#4B4B4B]">Connect WhatsApp</p>
                          <p className="mt-1 text-[12px] text-[#6E6E6E]">
                            {isProductSeller ? 'Receive product enquiries and order chats.' : 'Receive enquiries and AI replies.'}
                          </p>
                        </div>
                        <div className="rounded-md bg-white p-3">
                          <Package className="mb-2 h-4 w-4 text-blue-600" />
                          <p className="text-[13px] font-bold text-[#4B4B4B]">
                            {formData.businessType === 'hospitality'
                              ? 'Add rooms & villas'
                              : isProductSeller
                                ? 'Import catalogue'
                                : 'Add inventory'}
                          </p>
                          <p className="mt-1 text-[12px] text-[#6E6E6E]">
                            {isProductSeller
                              ? 'Bring WhatsApp products into BizNavigo or add manually.'
                              : 'Set what customers can book or buy.'}
                          </p>
                        </div>
                        <div className="rounded-md bg-white p-3">
                          <CheckCircle2 className="mb-2 h-4 w-4 text-amber-600" />
                          <p className="text-[13px] font-bold text-[#4B4B4B]">
                            {isProductSeller ? 'Review orders' : 'Review AI work'}
                          </p>
                          <p className="mt-1 text-[12px] text-[#6E6E6E]">
                            {isProductSeller
                              ? 'Track payments, stock issues and follow-ups.'
                              : 'See replies, follow-ups and approvals.'}
                          </p>
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
            {/* Step 5: WhatsApp Connection */}
            {currentStep === 5 && onboardingResult && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-[19px] font-semibold tracking-tight text-[#4B4B4B] mb-1">
                    {isProductSeller ? 'Connect WhatsApp and import products' : 'Connect WhatsApp'}
                  </h3>
                  <p className="text-[13px] text-[#6E6E6E]">
                    {isProductSeller
                      ? 'After connection, you will go to Products to import your existing WhatsApp catalogue.'
                      : 'Link your WhatsApp Business account to start messaging customers'}
                  </p>
                </div>
                <SimpleWhatsAppConnect
                  businessId={onboardingResult.business.business_id}
                  businessType={formData.businessType}
                  onComplete={handleWhatsAppConnected}
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
            disabled={currentStep === 1 || currentStep === 5}
            className="flex items-center gap-2 border-[#E5E5E5] text-[#4B4B4B] rounded-full shadow-none px-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 4 && (
              <Button
                onClick={handleNext}
                className="bg-[#0066FF] hover:bg-[#0052CC] shadow-none flex items-center gap-2 rounded-full px-6 text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {currentStep === 4 && (
              onboardingResult ? (
                <Button
                  onClick={() => setCurrentStep(5)}
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
            {currentStep === 5 && (
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
      </div>
    </div>
  )
}
