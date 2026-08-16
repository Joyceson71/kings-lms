import React from 'react';
import { CheckCircle } from 'lucide-react';
import { SpatialChart } from '@/components/3d/SpatialChart';
import { AssignmentBreakdown } from './types';

export function TasksDonut({ breakdown, isStudent }: { breakdown: AssignmentBreakdown; isStudent: boolean }) {
  const total = breakdown.pending + breakdown.submitted + breakdown.graded;

  if (total === 0) {
    return (
      <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/5">
        <CheckCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-[12px] font-medium text-muted-foreground">No assignments yet</p>
      </div>
    );
  }

  const chartData = [
    { label: 'Graded', value: breakdown.graded, color: '#34d399' },
    { label: 'Submitted', value: breakdown.submitted, color: '#818cf8' },
    { label: 'Pending', value: breakdown.pending, color: '#fbbf24' },
  ];
  
  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative overflow-hidden rounded-xl border border-border" style={{ height: 220, background: '#080814' }}>
        <SpatialChart data={chartData} maxValue={maxValue} />
      </div>
      <div className="mt-2 space-y-1.5">
        {[
          { label: isStudent ? 'Graded' : 'Graded', count: breakdown.graded, color: 'bg-emerald-400' },
          { label: 'Submitted', count: breakdown.submitted, color: 'bg-indigo-400' },
          { label: 'Pending', count: breakdown.pending, color: 'bg-amber-400' },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
            <span className="font-semibold text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
