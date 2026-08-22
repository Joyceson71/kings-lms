import React, { memo } from 'react';
import { ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { TiltCard } from '@/components/ui/tilt-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export const StatCard = memo(function StatCard({ stat, index }: {
  stat: {
    name: string; value: string; icon: React.ElementType<any>;
    change: string; changeType: 'positive' | 'neutral' | 'danger';
    iconColor: string; iconBg: string; accentGrad: string; tooltip?: string;
  };
  index: number;
}) {
  return (
    <div
      className="bento-card animate-slide-in-up opacity-0 group cursor-default"
      style={{ animationDelay: `${(index + 1) * 60}ms`, animationFillMode: 'forwards' }}
      title={stat.tooltip}
    >
      <TiltCard className="p-6 h-full relative" glareEnable={true}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none rounded-2xl" />
        <div className="flex items-start justify-between mb-5">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
            style={{ background: stat.iconBg }}
          >
            {/* @ts-expect-error dynamic component type mismatch */}
            <stat.icon className={`h-6 w-6 ${stat.iconColor} drop-shadow-md`} />
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-foreground transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <div className="relative z-10">
          <p className="text-[12px] font-bold tracking-[0.1em] text-muted-foreground/80 uppercase mb-2">{stat.name}</p>
          <p className="text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-none mb-3 drop-shadow-sm">
            <AnimatedCounter target={stat.value} duration={1000} />
          </p>
          <p className={`text-[12px] font-semibold flex items-center gap-1.5 ${stat.changeType === 'positive' ? 'text-emerald-400' :
              stat.changeType === 'danger' ? 'text-red-400' : 'text-amber-400'
            }`}>
            {stat.changeType === 'positive' && <TrendingUp className="h-3.5 w-3.5" />}
            {stat.changeType === 'danger' && <AlertTriangle className="h-3.5 w-3.5" />}
            {stat.change}
          </p>
        </div>
        <div className="mt-5 h-[3px] rounded-full w-full opacity-80" style={{ background: stat.accentGrad }} />
      </TiltCard>
    </div>
  );
});
