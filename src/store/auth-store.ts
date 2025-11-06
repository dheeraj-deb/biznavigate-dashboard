import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState, LoginCredentials, RegisterData, AuthResponse } from '@/types'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface AuthStore extends AuthState {
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  refreshAccessToken: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setHasHydrated: (state) => {
        set({ hasHydrated: state })
      },

      login: async (credentials: LoginCredentials) => {
        try {
          // Debug: Log the URL being used
          console.log('API_BASE_URL:', API_BASE_URL)
          console.log('Login URL:', `${API_BASE_URL}/auth/login`)

          const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)

          // Backend wraps response in { success, data, message, meta }
          const responseData = response.data.data || response.data
          const { access_token, refresh_token, user: userData } = responseData

          // Transform backend user data to frontend User type
          const user: User = {
            id: userData.user_id,
            email: userData.email,
            name: userData.name,
            role: 'ADMIN', // You can map role_id to UserRole here if needed
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user_id: userData.user_id,
            business_id: userData.business_id,
            role_id: userData.role_id,
            profile_completed: userData.profile_completed,
          }

          // Store tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('biznavigate_auth_token', access_token)
            localStorage.setItem('biznavigate_refresh_token', refresh_token)
          }

          set({
            user,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
          })
        } catch (error: any) {
          if (error.response?.data?.message) {
            throw new Error(error.response.data.message)
          }
          throw new Error('Login failed. Please check your credentials.')
        }
      },

      register: async (data: RegisterData) => {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/signup`, data)

          // Backend wraps response in { success, data, message, meta }
          const responseData = response.data.data || response.data
          const { access_token, refresh_token, user: userData } = responseData

          // Transform backend user data to frontend User type
          const user: User = {
            id: userData.user_id,
            email: userData.email,
            name: userData.name,
            role: 'ADMIN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user_id: userData.user_id,
            business_id: userData.business_id,
            role_id: userData.role_id,
            profile_completed: userData.profile_completed,
          }

          // Store tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('biznavigate_auth_token', access_token)
            localStorage.setItem('biznavigate_refresh_token', refresh_token)
          }

          set({
            user,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
          })
        } catch (error: any) {
          if (error.response?.data?.message) {
            throw new Error(error.response.data.message)
          }
          throw new Error('Registration failed.')
        }
      },

      logout: async () => {
        try {
          const token = get().token
          if (token) {
            // Call backend logout endpoint
            await axios.post(
              `${API_BASE_URL}/auth/logout`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
          }
        } catch (error) {
          // Continue with logout even if backend call fails
          console.error('Logout error:', error)
        } finally {
          // Clear local storage and state
          if (typeof window !== 'undefined') {
            localStorage.removeItem('biznavigate_auth_token')
            localStorage.removeItem('biznavigate_refresh_token')
          }
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
        }
      },

      refreshAccessToken: async () => {
        try {
          const refreshToken = get().refreshToken
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          // Backend wraps response in { success, data, message, meta }
          const responseData = response.data.data || response.data
          const { access_token, refresh_token: new_refresh_token, user: userData } = responseData

          // Transform backend user data to frontend User type
          const user: User = {
            id: userData.user_id,
            email: userData.email,
            name: userData.name,
            role: 'ADMIN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user_id: userData.user_id,
            business_id: userData.business_id,
            role_id: userData.role_id,
            profile_completed: userData.profile_completed,
          }

          // Store new tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('biznavigate_auth_token', access_token)
            localStorage.setItem('biznavigate_refresh_token', new_refresh_token)
          }

          set({
            user,
            token: access_token,
            refreshToken: new_refresh_token,
            isAuthenticated: true,
          })
        } catch (error) {
          // If refresh fails, logout
          get().logout()
          throw new Error('Session expired. Please login again.')
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },

      setToken: (token: string | null) => {
        if (token) {
          localStorage.setItem('biznavigate_auth_token', token)
        } else {
          localStorage.removeItem('biznavigate_auth_token')
        }
        set({ token })
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
