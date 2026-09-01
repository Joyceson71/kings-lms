export default function Loading() {
  return (
    <div className="p-8 space-y-6">
      <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
      <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-2xl"></div>
        ))}
      </div>
    </div>
  );
}
