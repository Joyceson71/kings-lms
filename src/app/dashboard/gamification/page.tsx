"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Award } from "lucide-react";

export default function GamificationPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-gradient">Gamification</h1>
      <EmptyState
        icon={Award}
        title="Gamification Coming Soon"
        description="Phase 9 will introduce XP, levels, badges, streaks, and leaderboards."
      />
    </div>
  );
}
