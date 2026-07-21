import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 bg-[#111113]/80" />
        <Skeleton className="h-4 w-96 bg-[#111113]/80" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-[#1f1f23]" />
              <Skeleton className="h-8 w-8 rounded-full bg-[#1f1f23]" />
            </div>
            <Skeleton className="h-8 w-20 bg-[#1f1f23]" />
            <Skeleton className="h-3 w-32 bg-[#1f1f23]" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 glass-card p-6 rounded-xl border border-white/5 space-y-4">
          <Skeleton className="h-6 w-48 bg-[#1f1f23]" />
          <Skeleton className="h-[300px] w-full bg-[#1f1f23]" />
        </div>
        <div className="md:col-span-3 glass-card p-6 rounded-xl border border-white/5 space-y-4">
          <Skeleton className="h-6 w-32 bg-[#1f1f23]" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-[#1f1f23]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 bg-[#1f1f23]" />
                  <Skeleton className="h-3 w-1/2 bg-[#1f1f23]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
