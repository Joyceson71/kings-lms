"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";

export default function LMSPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-gradient">Learning Management System</h1>
      <EmptyState
        icon={BookOpen}
        title="LMS Coming Soon"
        description="Phase 4 will bring course modules, digital notes, and the integrated campus library."
      />
    </div>
  );
}
