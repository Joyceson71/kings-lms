import React from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';
import { TrendPoint } from './types';

const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export function AttendanceTrendChart({ data }: { data: TrendPoint[] }) {
  const hasData = data.some(d => d.total > 0);

  if (!hasData) {
    return (
      <div className="h-52 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/5">
        <TrendingUp className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-[12px] font-medium text-muted-foreground">Not enough data yet</p>
        <p className="text-[10px] text-muted-foreground mt-1">Attendance trend will appear once sessions start</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: '#0c0c20',
            border: '1px solid #1a1a2e',
            borderRadius: '10px',
            fontSize: '11px',
            color: '#e8eaf6',
          }}
          formatter={(value: any) => [`${value}%`, 'Rate']}
          labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="#818cf8"
          strokeWidth={2}
          fill="url(#attendanceGrad)"
          dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#818cf8', stroke: '#04040c', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
