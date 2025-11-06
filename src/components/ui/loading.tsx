import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export function Loading({ className, size = 'md', fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  }

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          {spinner}
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return spinner
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <LoadingSkeleton className="mb-4 h-6 w-1/3" />
      <LoadingSkeleton className="mb-2 h-4 w-full" />
      <LoadingSkeleton className="h-4 w-2/3" />
    </div>
  )
}
