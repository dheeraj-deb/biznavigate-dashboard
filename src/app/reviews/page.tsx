'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare, ThumbsUp, Image, Loader2, Eye } from 'lucide-react'
import { useReviews, useReviewsAnalytics, formatDate, getRatingColor } from '@/hooks/use-reviews'
import { useAuthStore } from '@/store/auth-store'

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const businessId = user?.business_id || ''

  const [filters, setFilters] = useState({
    business_id: businessId,
    page: 1,
    limit: 20,
  })

  const { data: reviewsData, isLoading } = useReviews(filters)
  const { data: analytics } = useReviewsAnalytics(businessId)

  const reviews = reviewsData?.data || []
  const meta = reviewsData?.meta

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">Manage customer reviews and ratings</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalReviews}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">With Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.reviewsWithPhotos}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((analytics.reviewsWithPhotos / analytics.totalReviews) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.responseRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No reviews found
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review: any) => (
                  <div key={review.review_id} className="border-b pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating)}
                          {review.is_verified && (
                            <Badge variant="outline" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                          {review.is_featured && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Featured
                            </Badge>
                          )}
                        </div>
                        {review.title && (
                          <h3 className="font-semibold">{review.title}</h3>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(review.created_at)}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      By {review.customer?.name || 'Anonymous'}
                      {review.product && ` · ${review.product.name}`}
                    </div>

                    {review.comment && (
                      <p className="text-sm mb-3">{review.comment}</p>
                    )}

                    {review.photo_urls && review.photo_urls.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.photo_urls.map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Review photo ${idx + 1}`}
                            className="h-20 w-20 rounded-md object-cover"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {review.helpful_count} helpful
                      </span>
                      {review.response_text && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          Responded
                        </span>
                      )}
                    </div>

                    {review.response_text && (
                      <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200">
                        <div className="font-semibold text-sm mb-1">Response from Business</div>
                        <p className="text-sm text-muted-foreground">{review.response_text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta && meta.total > 0 && (
              <div className="flex items-center justify-between border-t pt-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} reviews
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={meta.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={meta.page >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
