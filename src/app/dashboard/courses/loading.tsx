import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 bg-[#111113]/80" />
        <Skeleton className="h-4 w-72 bg-[#111113]/80" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
            <Skeleton className="h-40 w-full rounded-lg bg-[#1f1f23]" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4 bg-[#1f1f23]" />
              <Skeleton className="h-4 w-1/2 bg-[#1f1f23]" />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full bg-[#1f1f23]" />
                <Skeleton className="h-4 w-20 bg-[#1f1f23]" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md bg-[#1f1f23]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
