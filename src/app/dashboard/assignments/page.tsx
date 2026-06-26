"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { FileEdit } from "lucide-react";

export default function AssignmentsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-gradient">Assignments</h1>
      <EmptyState
        icon={FileEdit}
        title="Assignments Coming Soon"
        description="Phase 6 will bring file submissions, rubrics, and automated grading analytics."
      />
    </div>
  );
}
