import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Product, PaginatedResponse } from '@/types'
import toast from 'react-hot-toast'

export function useProducts(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['products', page, pageSize],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Product>>(
        `/products?page=${page}&pageSize=${pageSize}`
      )
      return response.data
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get<Product>(`/products/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const response = await apiClient.post<Product>('/products', data)
      return response.data
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
      const response = await apiClient.put<Product>(`/products/${id}`, data)
      return response.data
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
