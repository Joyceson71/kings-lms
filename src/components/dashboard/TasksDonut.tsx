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
    { label: 'Graded', value: breakdown.graded, color: '#39FF14' },
    { label: 'Submitted', value: breakdown.submitted, color: '#BF00FF' },
    { label: 'Pending', value: breakdown.pending, color: '#FF006E' },
  ];
  
  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative overflow-hidden rounded-none border-2 shadow-inner neo-inset clip-corner-sm" style={{ height: 220, background: '#111120', borderColor: '#252545' }}>
        <SpatialChart data={chartData} maxValue={maxValue} />
        {/* Cyberpunk radar overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,transparent_30%,#00F5FF_150%)]" />
        <div className="absolute inset-0 pointer-events-none bg-grid-sm opacity-30" />
      </div>
      <div className="mt-4 space-y-2 px-1">
        {[
          { label: isStudent ? 'Graded' : 'Graded', count: breakdown.graded, color: '#39FF14' },
          { label: 'Submitted', count: breakdown.submitted, color: '#BF00FF' },
          { label: 'Pending', count: breakdown.pending, color: '#FF006E' },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center justify-between text-[11px] p-2 rounded-md" style={{ border: '1px solid #252545', background: '#0D0D1E' }}>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 shadow-sm animate-pulse" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <span className="text-muted-foreground font-black tracking-widest uppercase">{label}</span>
            </div>
            <span className="font-black text-foreground text-[14px]" style={{ color }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
