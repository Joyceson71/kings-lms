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
      <TiltCard className="h-full clip-corner" glareEnable={true}>
        <div className="p-5 h-full relative flex flex-col overflow-hidden group transition-all duration-300 neo-raised"
          style={{
            background: '#111120',
            border: '2px solid #252545',
            boxShadow: '4px 4px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex items-start justify-between mb-4">
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
          <p className="text-[10px] font-black tracking-widest text-muted-foreground/70 uppercase mb-1 brutalist-stripe group-hover:text-primary transition-colors">{stat.name}</p>
          <p className="text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-none mb-3 drop-shadow-sm uppercase glitch-text" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <AnimatedCounter target={stat.value} duration={1000} />
          </p>
          <div className="inline-flex">
            <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 border ${stat.changeType === 'positive' ? 'text-[#39FF14] bg-[#39FF14]/10 border-[#39FF14]/30' :
                stat.changeType === 'danger' ? 'text-[#FF006E] bg-[#FF006E]/10 border-[#FF006E]/30' : 'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/30'
              }`}>
              {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
              {stat.changeType === 'danger' && <AlertTriangle className="h-3 w-3" />}
              {stat.change}
            </p>
          </div>
        </div>
        {/* Accent Bar at the very bottom edge */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[3px] energy-bar-thin opacity-80 group-hover:opacity-100 transition-opacity" 
          style={{ background: stat.accentGrad }} 
        />
        </div>
      </TiltCard>
    </div>
  );
});
