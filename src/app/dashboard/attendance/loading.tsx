export default function AttendanceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-xl bg-white/5" />
          <div className="h-4 w-72 rounded-lg bg-white/5" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-white/5" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/5" />
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-96 rounded-2xl bg-white/5" />
        <div className="h-96 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
