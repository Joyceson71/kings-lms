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
      className="animate-slide-in-up opacity-0 h-full cursor-default"
      style={{ animationDelay: `${(index + 1) * 60}ms`, animationFillMode: 'forwards' }}
      title={stat.tooltip}
    >
      <TiltCard className="h-full" glareEnable={true}>
        <div className="bento-card p-6 h-full relative flex flex-col overflow-hidden group border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/10 transition-colors">
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

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
        <div className="relative z-10 flex-1 flex flex-col justify-end">
          <p className="text-[12px] font-bold tracking-[0.1em] text-muted-foreground/70 uppercase mb-2 group-hover:text-muted-foreground transition-colors">{stat.name}</p>
          <p className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none mb-4 drop-shadow-sm">
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
        {/* Accent Bar at the very bottom edge */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[4px] opacity-80" 
          style={{ background: stat.accentGrad }} 
        />
        </div>
      </TiltCard>
    </div>
  );
});
