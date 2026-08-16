import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 animate-pulse min-w-0">
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl skeleton" />
        <div className="h-4 w-4 rounded skeleton" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-16 rounded skeleton" />
        <div className="h-8 w-20 rounded skeleton" />
        <div className="h-2 w-24 rounded skeleton" />
      </div>
    </div>
  );
}
