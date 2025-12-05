import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Product, PaginatedResponse } from '@/types'
import toast from 'react-hot-toast'

export function useProducts(page = 1, pageSize = 10, business_id?: string) {
  return useQuery({
    queryKey: ['products', page, pageSize, business_id],
    queryFn: async () => {
      const params: any = { page, limit: pageSize }
      if (business_id) params.business_id = business_id

      const response = await apiClient.get(`/products`, { params })
      console.log('Products API response:', response.data)
      return {
        data: response.data || [],
        total: response.pagination?.total || 0,
        page: response.pagination?.page || page,
        limit: response.pagination?.limit || pageSize,
      }
    },
    retry: 1,
    retryDelay: 1000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${id}`)
      return response.data.data || response.data
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const response = await apiClient.post('/products', data)
      return response.data.data || response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create product')
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const response = await apiClient.put(`/products/${id}`, data)
      return response.data.data || response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
      toast.success('Product updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update product')
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete product')
    },
  })
}
