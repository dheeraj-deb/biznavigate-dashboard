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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      console.log('Logging in with credentials:')

      await login(data)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-12">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-black">
                  <div className="grid h-5 w-5 grid-cols-2 gap-[2px]">
                    <div className="rounded-[1px] bg-white"></div>
                    <div className="rounded-[1px] bg-white"></div>
                    <div className="rounded-[1px] bg-white"></div>
                    <div className="rounded-[1px] bg-white"></div>
                  </div>
                </div>
                <span className="text-lg font-semibold">BizNavigate</span>
              </div>
            </div>

            {/* Sign In Form */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Sign in</h1>
                <p className="mt-2 text-gray-600">Enter your email and password to continue.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    className="h-12 border-gray-300"
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    className="h-12 border-gray-300"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-blue-600 font-medium text-white hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="text-center text-sm text-gray-600">
                Need an account?{' '}
                <Link href="/auth/register" className="font-medium text-gray-900 hover:underline">
                  Sign up here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual Content */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-400 via-blue-500 to-blue-800 lg:flex lg:w-1/2">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          {/* Curved shapes */}
          <div className="absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-blue-700/30 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/4 translate-y-1/4 rounded-full bg-blue-900/30 blur-3xl"></div>

          {/* Diagonal stripes effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-0 top-1/4 h-48 w-full -rotate-12 scale-150 transform bg-gradient-to-br from-blue-900 to-transparent"></div>
            <div className="absolute left-0 top-1/2 h-48 w-full -rotate-12 scale-150 transform bg-gradient-to-br from-blue-800 to-transparent"></div>
          </div>
        </div>

        {/* Content Showcase */}
        <div className="relative z-10 flex w-full flex-col items-center justify-between px-12 py-12">
          <div className="flex flex-1 flex-col items-center justify-center">
            {/* Integration Badge */}
            <div className="mb-8">
              <span className="inline-block rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                WHAT&apos;S NEW?
              </span>
            </div>

            {/* Main Content */}
            <div className="max-w-xl space-y-4 text-center text-white">
              <h2 className="text-4xl font-bold leading-tight">15 new integrations added</h2>
              <p className="text-lg text-white/90">
                You asked <span className="font-semibold">and we listened!</span> We&apos;ve added a
                bunch of new integrations to speed up your workflow.
              </p>
            </div>
          </div>

          {/* Carousel Indicators with Navigation Arrows */}
          <div className="flex items-center gap-6">
            <button className="flex h-10 w-10 items-center justify-center text-white/80 transition-colors hover:text-white">
              <ArrowLeft className="h-6 w-6" />
            </button>

            <div className="flex gap-2">
              <div className="h-1 w-12 rounded-full bg-white"></div>
              <div className="h-1 w-12 rounded-full bg-white/40"></div>
              <div className="h-1 w-12 rounded-full bg-white/40"></div>
            </div>

            <button className="flex h-10 w-10 items-center justify-center text-white/80 transition-colors hover:text-white">
              <ArrowLeft className="h-6 w-6 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
