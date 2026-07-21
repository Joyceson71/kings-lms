import { Skeleton } from "@/components/ui/skeleton";

export default function StudentsLoading() {
  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-[#111113]/80" />
          <Skeleton className="h-4 w-72 bg-[#111113]/80" />
        </div>
        <Skeleton className="h-10 w-full sm:w-64 bg-[#111113]/80" />
      </div>

      <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
        {/* Table Header */}
        <div className="bg-white/5 px-6 py-4 flex gap-4 border-b border-white/5">
          <Skeleton className="h-4 w-1/3 bg-[#1f1f23]" />
          <Skeleton className="h-4 w-1/4 bg-[#1f1f23] hidden sm:block" />
          <Skeleton className="h-4 w-1/4 bg-[#1f1f23] hidden md:block" />
          <Skeleton className="h-4 w-20 bg-[#1f1f23]" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-white/5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="w-1/3 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-[#1f1f23]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 bg-[#1f1f23]" />
                  <Skeleton className="h-3 w-1/2 bg-[#1f1f23]" />
                </div>
              </div>
              <Skeleton className="h-4 w-1/4 bg-[#1f1f23] hidden sm:block" />
              <div className="w-1/4 hidden md:block">
                <Skeleton className="h-4 w-1/2 bg-[#1f1f23]" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full bg-[#1f1f23]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
