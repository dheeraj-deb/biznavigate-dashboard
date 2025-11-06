'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

const registerSchema = z
  .object({
    tenant_name: z.string().min(2, 'Business name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const register = useAuthStore((state) => state.register)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await register({
        tenant_name: data.tenant_name,
        email: data.email,
        password: data.password,
        phone_number: data.phone_number,
        name: data.name,
      })
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Side - Form */}
      <div className="flex w-full lg:w-1/2 flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-12">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-[2px] w-5 h-5">
                    <div className="bg-white rounded-[1px]"></div>
                    <div className="bg-white rounded-[1px]"></div>
                    <div className="bg-white rounded-[1px]"></div>
                    <div className="bg-white rounded-[1px]"></div>
                  </div>
                </div>
                <span className="text-lg font-semibold">BizNavigate</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Create your account</h1>
                <p className="mt-2 text-gray-600">
                  Start managing your business with BizNavigate.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Input
                    id="tenant_name"
                    type="text"
                    placeholder="Business Name"
                    className="h-12 border-gray-300"
                    {...registerField('tenant_name')}
                    disabled={isLoading}
                  />
                  {errors.tenant_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.tenant_name.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    className="h-12 border-gray-300"
                    {...registerField('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="Phone Number"
                    className="h-12 border-gray-300"
                    {...registerField('phone_number')}
                    disabled={isLoading}
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your Name (Optional)"
                    className="h-12 border-gray-300"
                    {...registerField('name')}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    className="h-12 border-gray-300"
                    {...registerField('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    className="h-12 border-gray-300"
                    {...registerField('confirmPassword')}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-gray-900 font-medium hover:underline">
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-400 via-blue-500 to-blue-800">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          {/* Curved shapes */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-700/30 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4"></div>

          {/* Diagonal stripes effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-0 w-full h-48 bg-gradient-to-br from-blue-900 to-transparent -rotate-12 transform scale-150"></div>
            <div className="absolute top-1/2 left-0 w-full h-48 bg-gradient-to-br from-blue-800 to-transparent -rotate-12 transform scale-150"></div>
          </div>
        </div>

        {/* Content Showcase */}
        <div className="relative z-10 flex flex-col items-center justify-between w-full px-12 py-12">
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Welcome Badge */}
            <div className="mb-8">
              <span className="inline-block px-3 py-1 text-xs font-medium text-white/90 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
                GET STARTED
              </span>
            </div>

            {/* Main Content */}
            <div className="text-center text-white space-y-4 max-w-xl">
              <h2 className="text-4xl font-bold leading-tight">
                Join thousands of businesses
              </h2>
              <p className="text-lg text-white/90">
                Streamline your operations with our all-in-one <span className="font-semibold">business management platform.</span>
              </p>
            </div>

            {/* Features List */}
            <div className="mt-12 space-y-4 text-white/90">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Complete CRM and lead management</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Inventory tracking and management</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Multi-channel integration</span>
              </div>
            </div>
          </div>

          {/* Carousel Indicators with Navigation Arrows */}
          <div className="flex items-center gap-6">
            <button className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="flex gap-2">
              <div className="w-12 h-1 bg-white/40 rounded-full"></div>
              <div className="w-12 h-1 bg-white rounded-full"></div>
              <div className="w-12 h-1 bg-white/40 rounded-full"></div>
            </div>

            <button className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
