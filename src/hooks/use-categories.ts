import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// Category filters interface
interface CategoryFilters {
  business_id?: string
}

// Get all categories for a business
export function useCategories(businessId?: string) {
  return useQuery({
    queryKey: ['categories', businessId],
    queryFn: async () => {
      const params: any = {}
      if (businessId) params.business_id = businessId

      const response = await apiClient.get('/categories', { params })
      return response.data || []
    },
    retry: 1,
    retryDelay: 1000,
    enabled: !!businessId,
  })
}

// Get category tree (hierarchical structure)
export function useCategoryTree(businessId?: string) {
  return useQuery({
    queryKey: ['categories-tree', businessId],
    queryFn: async () => {
      const params: any = {}
      if (businessId) params.business_id = businessId

      const response = await apiClient.get('/categories/tree', { params })
      return response.data || []
    },
    retry: 1,
    retryDelay: 1000,
    enabled: !!businessId,
  })
}

// Get single category by ID
export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const response = await apiClient.get(`/categories/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// Get category by slug
export function useCategoryBySlug(slug: string, businessId?: string) {
  return useQuery({
    queryKey: ['category-slug', slug, businessId],
    queryFn: async () => {
      const params: any = {}
      if (businessId) params.business_id = businessId

      const response = await apiClient.get(`/categories/slug/${slug}`, { params })
      return response.data
    },
    enabled: !!slug && !!businessId,
  })
}

// Create new category
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/categories', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] })
      toast.success('Category created successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create category'
      toast.error(message)
    },
  })
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/categories/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] })
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] })
      toast.success('Category updated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update category'
      toast.error(message)
    },
  })
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, hard }: { id: string; hard?: boolean }) => {
      await apiClient.delete(`/categories/${id}`, { params: { hard: hard ? 'true' : 'false' } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] })
      toast.success('Category deleted successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete category'
      toast.error(message)
    },
  })
}

// Move category to a different parent
export function useMoveCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
      const response = await apiClient.put(`/categories/${id}/move`, { new_parent_id: newParentId })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] })
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] })
      toast.success('Category moved successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to move category'
      toast.error(message)
    },
  })
}
