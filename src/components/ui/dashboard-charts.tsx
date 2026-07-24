'use client';

import dynamic from 'next/dynamic';

const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
import { memo } from 'react';

// ── Shared tooltip styles ──
const tooltipBoxStyle = {
  background: '#0c0c20',
  border: '1px solid #1a1a3a',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgb(0 0 0 / 0.6)',
  padding: '10px 14px',
};

const AttendanceTooltip = memo(function AttendanceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBoxStyle}>
      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
      <p className="text-[14px] font-bold text-white">{payload[0]?.value}%</p>
    </div>
  );
});

const PerformanceTooltip = memo(function PerformanceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBoxStyle}>
      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
      <p className="text-[14px] font-bold text-white">{payload[0]?.value}% avg</p>
    </div>
  );
});

// ── Area Chart ──
const AreaChartView = memo(function AreaChartView({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3a" vertical={false} />
        <XAxis dataKey="day"        tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
        <YAxis domain={[50, 100]}   tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<AttendanceTooltip />} cursor={{ stroke: '#2d2d5e', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="attendance"
          stroke="#818cf8"
          strokeWidth={2}
          fill="url(#areaGrad)"
          activeDot={{ r: 5, fill: '#818cf8', stroke: '#0c0c20', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// ── Bar Chart ──
const BarChartView = memo(function BarChartView({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={28}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#818cf8" stopOpacity={1} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3a" vertical={false} />
        <XAxis dataKey="subject"  tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<PerformanceTooltip />} cursor={{ fill: 'rgb(129 140 248 / 0.05)', radius: 8 } as any} />
        <Bar dataKey="score" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

// ── Donut Chart ──
const DonutChartView = memo(function DonutChartView({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              style={{ filter: `drop-shadow(0 0 6px ${entry.color}80)` }}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={tooltipBoxStyle}>
                <p className="text-[13px] font-bold" style={{ color: payload[0].payload.color }}>
                  {payload[0].name}: {payload[0].value}
                </p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

// ── Unified export ──
interface DashboardChartsProps {
  type: 'area' | 'bar' | 'donut';
  data: any[];
}

export default memo(function DashboardCharts({ type, data }: DashboardChartsProps) {
  if (type === 'area')   return <AreaChartView data={data} />;
  if (type === 'bar')    return <BarChartView data={data} />;
  if (type === 'donut')  return <DonutChartView data={data} />;
  return null;
});
