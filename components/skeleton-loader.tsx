export function ProductCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-secondary"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-secondary rounded w-3/4"></div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-secondary rounded-full"></div>
          ))}
        </div>
        <div className="h-5 bg-secondary rounded w-1/2"></div>
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 bg-secondary rounded w-1/4"></div>
        <div className="h-6 bg-secondary rounded w-1/4"></div>
      </div>
      <div className="h-4 bg-secondary rounded w-1/2"></div>
      <div className="h-4 bg-secondary rounded w-3/4"></div>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full animate-spin"></div>
        <div className="absolute inset-1 bg-background rounded-full"></div>
      </div>
    </div>
  )
}
