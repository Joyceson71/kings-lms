"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-gradient">Admin Analytics</h1>
      <EmptyState
        icon={BarChart3}
        title="Analytics Coming Soon"
        description="Phase 8 will provide real-time heatmaps, activity timelines, and downloadable reports."
      />
    </div>
  );
}
