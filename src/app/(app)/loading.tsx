export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex-1 animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-3 w-16 bg-foreground/5 rounded animate-pulse" />
        <span className="text-foreground/20">/</span>
        <div className="h-3 w-24 bg-foreground/5 rounded animate-pulse" />
      </div>
      <div className="h-8 w-3/4 bg-foreground/5 rounded animate-pulse mb-4" />
      <div className="flex gap-3 mb-6">
        <div className="h-3 w-20 bg-foreground/5 rounded animate-pulse" />
        <div className="h-3 w-20 bg-foreground/5 rounded animate-pulse" />
        <div className="h-3 w-16 bg-foreground/5 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-foreground/5 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-foreground/5 rounded animate-pulse" />
        <div className="h-4 w-full bg-foreground/5 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-foreground/5 rounded animate-pulse" />
      </div>
    </div>
  );
}
