import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-slide-in-up max-w-2xl">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 bg-card/80" />
        <Skeleton className="h-4 w-72 bg-card/80" />
      </div>

      {/* Settings sections */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
          <Skeleton className="h-5 w-32 bg-muted" />
          <div className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40 bg-muted" />
                  <Skeleton className="h-3 w-56 bg-muted" />
                </div>
                <Skeleton className="h-8 w-16 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
        <Skeleton className="h-5 w-24 bg-muted" />
        <Skeleton className="h-10 w-full bg-muted rounded-lg" />
        <Skeleton className="h-10 w-full bg-muted rounded-lg" />
        <Skeleton className="h-10 w-32 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
