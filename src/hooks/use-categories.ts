/**
 * use-categories.ts — shim: /categories is removed.
 * Categories are now free-text strings on catalog items.
 * Read hooks derive unique categories from /catalog items.
 * Write hooks are no-ops.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export interface Category {
  id: string
  name: string
  slug?: string
  parent_id?: string | null
  children?: Category[]
}

// Returns categories as { id, name } objects derived from catalog item.category strings
export function useCategories(businessId?: string) {
  return useQuery({
    queryKey: ['categories', businessId],
    queryFn: async () => {
      const response = await apiClient.get('/catalog', { params: { businessId, limit: 200 } })
      const body = (response as any).data?.data ?? (response as any).data
      const items: any[] = Array.isArray(body) ? body : (body?.data ?? [])
      const names = Array.from(new Set(items.map((i: any) => i.category).filter(Boolean))) as string[]
      return names.sort().map(name => ({ id: name, name, slug: name.toLowerCase().replace(/\s+/g, '-') })) as Category[]
    },
    retry: 1,
    enabled: !!businessId,
  })
}

export function useCategoryTree(businessId?: string) {
  return useCategories(businessId)
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async (): Promise<Category> => ({ id, name: id }),
    enabled: !!id,
  })
}

export function useCategoryBySlug(slug: string, businessId?: string) {
  return useQuery({
    queryKey: ['category-slug', slug, businessId],
    queryFn: async (): Promise<Category> => ({ id: slug, name: slug }),
    enabled: !!slug && !!businessId,
  })
}

// Write mutations are no-ops — categories are just text on catalog items
export function useCreateCategory() {
  return useMutation({
    mutationFn: async (data: any) => ({ id: data.name, name: data.name }),
    onSuccess: () => toast.success('Category saved'),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => ({ id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_: any) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useMoveCategory() {
  return useMutation({
    mutationFn: async (_: any) => {},
  })
}
