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
      <TiltCard className="p-5" glareEnable={true}>
        <div className="flex items-start justify-between mb-4">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{ background: stat.iconBg }}
          >
            {/* @ts-expect-error dynamic component type mismatch */}
            <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">{stat.name}</p>
          <p className="text-3xl font-black text-foreground tracking-tight leading-none mb-2">
            <AnimatedCounter target={stat.value} duration={900} />
          </p>
          <p className={`text-[11px] font-medium flex items-center gap-1 ${
            stat.changeType === 'positive' ? 'text-emerald-400' :
            stat.changeType === 'danger' ? 'text-red-400' : 'text-muted-foreground'
          }`}>
            {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
            {stat.changeType === 'danger' && <AlertTriangle className="h-3 w-3" />}
            {stat.change}
          </p>
        </div>
        <div className="mt-4 h-[2px] rounded-full" style={{ background: stat.accentGrad }} />
      </TiltCard>
    </div>
  );
});
