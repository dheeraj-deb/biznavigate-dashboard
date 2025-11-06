import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiError, ApiResponse } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE_URL = `${API_URL}`

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('biznavigate_auth_token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as any

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Try to refresh the token
            const refreshToken = localStorage.getItem('biznavigate_refresh_token')
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refresh_token: refreshToken
              })

              // Backend wraps response in { success, data, message, meta }
              const responseData = response.data.data || response.data
              const { access_token, refresh_token: new_refresh_token } = responseData

              // Update tokens in localStorage
              localStorage.setItem('biznavigate_auth_token', access_token)
              localStorage.setItem('biznavigate_refresh_token', new_refresh_token)

              // Update the authorization header and retry the original request
              originalRequest.headers.Authorization = `Bearer ${access_token}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            if (typeof window !== 'undefined') {
              localStorage.removeItem('biznavigate_auth_token')
              localStorage.removeItem('biznavigate_refresh_token')
              window.location.href = '/auth/login'
            }
          }
        }

        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError<ApiError>): ApiError {
    if (error.response) {
      return {
        message: error.response.data.message || 'An error occurred',
        code: error.response.data.code,
        details: error.response.data.details,
      }
    } else if (error.request) {
      return {
        message: 'No response from server',
        code: 'NETWORK_ERROR',
      }
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      }
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()
