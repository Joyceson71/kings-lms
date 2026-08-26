import { Skeleton } from "@/components/ui/skeleton";

export default function AssignmentsLoading() {
  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48 bg-card/80" />
          <Skeleton className="h-4 w-64 bg-card/80" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl bg-card/80" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full bg-muted" />
        ))}
      </div>

      {/* Assignment cards */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-card p-5 rounded-xl border border-white/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-xl bg-muted flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4 bg-muted" />
                  <Skeleton className="h-4 w-1/2 bg-muted" />
                  <Skeleton className="h-3 w-1/3 bg-muted" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-6 w-20 rounded-full bg-muted" />
                <Skeleton className="h-4 w-16 bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
