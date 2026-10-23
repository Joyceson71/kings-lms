export default function SegmentLoading() {
  return (
    <div aria-label="Loading section" className="space-y-4 animate-pulse p-2">
      <div className="h-8 w-48 rounded-lg bg-secondary" />
      <div className="h-4 w-72 max-w-full rounded bg-secondary/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-36 rounded-2xl border border-border/50 bg-card/50" />
        <div className="h-36 rounded-2xl border border-border/50 bg-card/50" />
        <div className="h-36 rounded-2xl border border-border/50 bg-card/50" />
      </div>
    </div>
  );
}
