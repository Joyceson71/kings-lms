"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Sparkles } from "lucide-react";

export default function AIPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-gradient">AI Learning Assistant</h1>
      <EmptyState
        icon={Sparkles}
        title="AI Assistant Coming Soon"
        description="Phase 10 will bring study recommendations, weak topic detection, and the AI chat assistant."
      />
    </div>
  );
}
