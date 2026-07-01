'use client';

import { useState } from 'react';
import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/use-user';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  BarChart2, Download, FileText, Calendar, Filter,
  TrendingUp, TrendingDown, CheckCircle, XCircle,
} from 'lucide-react';

const courseAttendanceData = [
  { course: 'EC-301', present: 94, absent: 6 },
  { course: 'EC-302', present: 88, absent: 12 },
  { course: 'EC-101', present: 76, absent: 24 },
  { course: 'EC-303', present: 65, absent: 35 },
  { course: 'EC-201', present: 82, absent: 18 },
  { course: 'EC-304', present: 90, absent: 10 },
];

// For student: personal per-session data
const studentSessionData = [
  { week: 'Wk 1', attended: 5, total: 6 },
  { week: 'Wk 2', attended: 6, total: 6 },
  { week: 'Wk 3', attended: 4, total: 6 },
  { week: 'Wk 4', attended: 5, total: 6 },
  { week: 'Wk 5', attended: 6, total: 6 },
  { week: 'Wk 6', attended: 3, total: 6 },
];

const pieData = [
  { name: 'Present', value: 82, color: 'oklch(0.70 0.20 165)' },
  { name: 'Absent', value: 12, color: 'oklch(0.50 0.20 25)' },
  { name: 'Late', value: 6, color: 'oklch(0.75 0.16 85)' },
];

const recentReports = [
  { name: 'Monthly Attendance Report — June 2026', date: 'Jul 1, 2026', size: '2.4 MB', type: 'PDF' },
  { name: 'Course-wise Attendance Summary — Sem 2', date: 'Jun 15, 2026', size: '1.8 MB', type: 'XLSX' },
  { name: 'Student Performance Report — Q2 2026', date: 'Jun 1, 2026', size: '3.1 MB', type: 'PDF' },
  { name: 'Faculty Attendance Log — May 2026', date: 'May 31, 2026', size: '0.9 MB', type: 'CSV' },
];

const dateRanges = ['This Week', 'This Month', 'This Semester', 'Custom'] as const;
type DateRange = typeof dateRanges[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl p-3 border border-border/60 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1 font-mono">{label}</p>
        {payload.map((p: { name: string; value: number; color: string }, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {p.value}%</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { isStudent } = useUser();
  const [dateRange, setDateRange] = useState<DateRange>('This Month');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isStudent ? 'Your personal attendance and performance reports.' : 'Attendance analytics and system-wide reports.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="export-pdf-btn"
            variant="outline"
            size="sm"
            className="border-border/40 rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
          <Button
            id="export-excel-btn"
            size="sm"
            className="bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 rounded-xl gap-1.5 text-xs font-semibold"
          >
            <FileText className="h-3.5 w-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-2 flex-wrap animate-slide-in-up opacity-0" style={{ animationDelay: '60ms', animationFillMode: 'forwards' }}>
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex gap-1.5 flex-wrap">
          {dateRanges.map((range) => (
            <button
              key={range}
              id={`date-range-${range.toLowerCase().replace(' ', '-')}`}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                dateRange === range
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{dateRange}</span>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-slide-in-up opacity-0" style={{ animationDelay: '140ms', animationFillMode: 'forwards' }}>
        {/* Main bar chart */}
        <div className="lg:col-span-2">
          <TiltCard intensity={3} glareEffect={false}>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {isStudent ? 'Weekly Sessions Attended' : 'Course-wise Attendance'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{dateRange}</p>
                </div>
                <Badge variant="success" dot>Live Data</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {isStudent ? (
                    <BarChart data={studentSessionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'oklch(0.60 0.03 265)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'oklch(0.60 0.03 265)' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<BarTooltip />} />
                      <Bar dataKey="attended" name="Attended" fill="oklch(0.65 0.26 285)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="total" name="Total" fill="oklch(0.65 0.26 285 / 0.15)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={courseAttendanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                      <XAxis dataKey="course" tick={{ fontSize: 11, fill: 'oklch(0.60 0.03 265)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'oklch(0.60 0.03 265)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<BarTooltip />} />
                      <Bar dataKey="present" name="Present" fill="oklch(0.70 0.20 165)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="absent" name="Absent" fill="oklch(0.50 0.20 25)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Pie chart */}
        <TiltCard intensity={5}>
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Overall Breakdown
            </h2>
            <div className="flex justify-center">
              <PieChart width={160} height={160}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="mt-4 space-y-2.5">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-sm text-foreground/80">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2">
                {82 >= 75 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <p className="text-xs text-emerald-400 font-medium">Attendance is above minimum (75%)</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-400" />
                    <p className="text-xs text-red-400 font-medium">Below 75% minimum requirement!</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-in-up opacity-0" style={{ animationDelay: '280ms', animationFillMode: 'forwards' }}>
        {[
          { label: 'Total Sessions', value: '54', icon: BarChart2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Attended', value: '47', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: 'up' },
          { label: 'Missed', value: '7', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', trend: 'down' },
          { label: 'On Time Rate', value: '94%', icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-500/10' },
        ].map((card) => (
          <TiltCard key={card.label} intensity={12}>
            <div className="glass-card rounded-2xl p-4">
              <div className={`h-9 w-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
              </div>
              <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{card.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {'trend' in card && card.trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                {'trend' in card && card.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>

      {/* Downloadable reports (faculty/admin only) */}
      {!isStudent && (
        <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '380ms', animationFillMode: 'forwards' }}>
          <TiltCard intensity={2} glareEffect={false}>
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Generated Reports
              </h2>
              <div className="divide-y divide-border/30">
                {recentReports.map((report, i) => (
                  <div key={i} className="flex items-center justify-between py-3.5 hover:bg-secondary/15 -mx-2 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{report.name}</p>
                        <p className="text-xs text-muted-foreground">{report.date} · {report.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{report.type}</Badge>
                      <button
                        id={`download-report-${i}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label={`Download ${report.name}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </div>
      )}
    </div>
  );
}
