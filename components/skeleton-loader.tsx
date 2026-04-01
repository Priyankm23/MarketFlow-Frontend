export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="aspect-[3/4] bg-zinc-100 rounded-none"></div>
      <div className="mt-4 px-1 space-y-2">
        <div className="h-4 bg-zinc-100 rounded-none w-1/2"></div>
        <div className="h-3 bg-zinc-100 rounded-none w-3/4"></div>
        <div className="h-4 bg-zinc-100 rounded-none w-1/3"></div>
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
