import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ===== TYPES =====

export interface Review {
  review_id: string
  business_id: string
  tenant_id: string
  product_id: string
  customer_id: string
  order_id?: string
  rating: number
  title?: string
  comment?: string
  photo_urls?: string[]
  video_url?: string
  is_verified: boolean
  is_featured: boolean
  is_published: boolean
  helpful_count: number
  reported_count: number
  response_text?: string
  response_date?: string
  responded_by?: string
  created_at: string
  updated_at: string
  customer?: {
    customer_id: string
    name: string
    email: string
  }
  product?: {
    product_id: string
    name: string
    primary_image_url?: string
  }
}

export interface ReviewsAnalytics {
  totalReviews: number
  averageRating: number
  ratingDistribution: Record<string, number>
  verifiedReviews: number
  reviewsWithPhotos: number
  reviewsWithResponses: number
  responseRate: number
}

// ===== QUERY HOOKS =====

export function useReviews(filters: any) {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: async () => {
      const response = await apiClient.get('/reviews', {
        params: {
          ...filters,
          page: filters.page || 1,
          limit: filters.limit || 20,
        },
      })
      return response.data || response
    },
    enabled: !!filters.business_id,
    retry: 1,
  })
}

export function useReview(reviewId: string) {
  return useQuery({
    queryKey: ['reviews', reviewId],
    queryFn: async () => {
      const response = await apiClient.get(`/reviews/${reviewId}`)
      return response.data?.data as Review
    },
    enabled: !!reviewId,
  })
}

export function useReviewsAnalytics(business_id: string) {
  return useQuery({
    queryKey: ['reviews', 'analytics', business_id],
    queryFn: async () => {
      const response = await apiClient.get('/reviews/analytics', {
        params: { business_id },
      })
      return response.data?.data as ReviewsAnalytics
    },
    enabled: !!business_id,
    staleTime: 60000,
  })
}

// ===== MUTATION HOOKS =====

export function useRespondToReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reviewId, response_text, responded_by }: any) => {
      const response = await apiClient.post(`/reviews/${reviewId}/respond`, {
        response_text,
        responded_by,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Response posted successfully')
    },
    onError: () => {
      toast.error('Failed to post response')
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reviewId, ...data }: any) => {
      const response = await apiClient.put(`/reviews/${reviewId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review updated successfully')
    },
    onError: () => {
      toast.error('Failed to update review')
    },
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reviewId: string) => {
      await apiClient.delete(`/reviews/${reviewId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete review')
    },
  })
}

// ===== UTILITY FUNCTIONS =====

export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-green-600'
  if (rating >= 3) return 'text-yellow-600'
  return 'text-red-600'
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
