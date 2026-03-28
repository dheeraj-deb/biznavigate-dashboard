'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppLogo } from '@/components/ui/app-logo'
import { Zap, Sparkles, Lock } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
      await login(data)
      const user = useAuthStore.getState().user
      toast.success('Login successful!', {
        icon: '🚀',
        style: {
          borderRadius: '10px',
          background: '#fff',
          color: '#18181b',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
        },
      })
      router.push(user?.profile_completed ? '/dashboard' : '/onboarding')
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Authentication failed. Please check your credentials.', {
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-row-reverse bg-slate-50 text-slate-900 selection:bg-blue-600/20 font-sans overflow-hidden">
      {/* Dynamic Cursor Glow (Subtle in Light Mode) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(37, 99, 235, 0.02), transparent 40%)`
        }}
      />

      {/* Premium Form Section (Now on the Right) */}
      <div className="relative flex w-full flex-col lg:w-1/2 z-10 border-l border-slate-200/60 bg-white/80 backdrop-blur-3xl shadow-[-10px_0_50px_-15px_rgba(0,0,0,0.05)] h-screen">
        {/* Subtle grid pattern for light theme */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />

        <div className="flex flex-col px-6 py-4 relative z-10 w-full h-full mx-auto justify-center items-center overflow-hidden">

          {/* Logo (Moved Outside Form Box) */}
          <div className="mb-6 flex-shrink-0 flex w-full max-w-[480px] justify-center lg:justify-start lg:pl-4 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
            <div className="group flex items-center gap-3 cursor-pointer">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 group-hover:shadow-[0_8px_30px_rgba(37,99,235,0.2)] group-hover:-translate-y-0.5">
                <AppLogo className="h-10 w-10 shadow-lg rounded-[12px]" />
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                BizNavigo
              </span>
            </div>
          </div>

          <div className="w-full max-w-[480px] bg-white/50 backdrop-blur-xl border border-slate-200/60 p-6 sm:p-8 rounded-3xl shadow-[0_8px_40px_-15px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            {/* Header */}
            <div className="space-y-1 mb-4 text-center lg:text-left">
              <h1 className="text-[22px] font-semibold tracking-tight text-[#4B4B4B]">
                Welcome back
              </h1>
              <p className="text-[13px] text-[#6E6E6E]">
                Enter your credentials to access your autonomous workspace.
              </p>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#4B4B4B]">
                  E-mail*
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@example.com"
                  className={`h-10 w-full bg-transparent text-[#4B4B4B] placeholder:text-[#989898] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.email
                    ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
                    : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'
                    }`}
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#4B4B4B]">
                    Password*
                  </label>
                  <Link href="/auth/forgot-password" className="text-[13px] font-bold text-[#4B4B4B] hover:text-[#0066FF] transition-colors underline decoration-[#4B4B4B] underline-offset-2">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`h-10 w-full bg-transparent text-[#4B4B4B] rounded-md focus-visible:ring-1 transition-colors shadow-none rounded-[4px] ${errors.password
                    ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
                    : 'border-[#989898] focus-visible:ring-[#0066FF] focus-visible:border-[#0066FF]'
                    }`}
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="showPassword"
                  className="h-3.5 w-3.5 border-[#989898] text-[#0066FF] focus:ring-[#0066FF] rounded-[2px]"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <label htmlFor="showPassword" className="text-[13px] text-[#4B4B4B] select-none cursor-pointer">
                  Show password
                </label>
              </div>

              <Button
                type="submit"
                className="h-10 px-8 bg-[#0066FF] text-white hover:bg-[#0052CC] rounded-full shadow-none w-auto mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="font-semibold text-sm">Sign in</span>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-[13px] text-[#4B4B4B]">
                Don't have an account?{' '}
                <Link href="/auth/register" className="font-bold underline decoration-[#4B4B4B] underline-offset-2 hover:text-[#0066FF] transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Ambient Animated Section (Light Theme) */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-white">
        {/* Complex Animated Background Orbs for Light Theme */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-blue-200/50 blur-[100px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite_alternate]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-slate-200/60 blur-[100px] mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite_alternate_reverse]" />
          <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-50/40 blur-[90px] mix-blend-multiply animate-[pulse_12s_ease-in-out_infinite_alternate]" />
          <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-blue-100/50 blur-[80px] mix-blend-multiply animate-[pulse_9s_ease-in-out_infinite_alternate_reverse]" />
        </div>

        {/* Glass overlay with subtle noise */}
        <div className="absolute inset-0 z-0 opacity-[0.03] bg-noise-filter" />

        <div className="relative z-10 flex w-full flex-col h-full justify-between p-12">
          {/* Top Badge */}
          <div className="flex justify-end animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/70 shadow-sm py-1.5 px-4 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-700">Systems Operational</span>
            </div>
          </div>

          {/* Center Showcase */}
          <div className="flex flex-col flex-1 items-center justify-center animate-in fade-in zoom-in-95 duration-1000 delay-300">
            {/* Holographic Element Representation */}
            <div className="relative w-80 h-80 flex items-center justify-center mb-12">
              <div className="absolute inset-0 rounded-full border border-slate-200 animate-[spin_30s_linear_infinite]" />
              <div className="absolute inset-6 rounded-full border border-dashed border-blue-300 animate-[spin_40s_linear_infinite_reverse]" />
              <div className="absolute inset-14 rounded-full border border-slate-100 backdrop-blur-sm bg-white/20 animate-[pulse_4s_ease-in-out_infinite_alternate]" />

              <div className="absolute shadow-[0_0_80px_20px_rgba(37,99,235,0.15)] rounded-full h-20 w-20" />

              <div className="relative z-10 bg-white/90 border border-slate-200/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 transform transition-transform hover:-translate-y-2 hover:shadow-2xl duration-500">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="text-slate-900 font-bold text-lg mb-1">Deep Analytics</div>
                  <div className="text-blue-600 font-medium text-xs">v4.0.0 Initiated</div>
                </div>
              </div>

              {/* Orbital badges */}
              <div className="absolute top-[10%] right-[10%] bg-white/90 backdrop-blur-md border border-slate-200/60 p-2.5 rounded-xl shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
                <Lock className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="absolute bottom-[20%] left-[5%] bg-white/90 backdrop-blur-md border border-slate-200/60 p-3 rounded-xl shadow-lg animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
            </div>

            <div className="max-w-md text-center space-y-3">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Get started with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">BizNavigo.</span>
              </h2>
              <p className="text-base font-medium text-slate-500 leading-relaxed">
                Unlock autonomous growth, unified metrics, and an ecosystem built for modern enterprises.
              </p>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}
