"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-gradient">Student Community</h1>
      <EmptyState
        icon={MessageSquare}
        title="Community Coming Soon"
        description="Phase 7 will introduce realtime chat, study groups, and department announcements."
      />
    </div>
  );
}
