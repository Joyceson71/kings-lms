'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/lib/hooks/use-user';
import {
  Users, BookOpen, CheckCircle, Clock, ArrowUpRight, TrendingUp,
  Zap, Calendar, ClipboardList, GraduationCap, AlertTriangle, Star,
} from 'lucide-react';
import dynamic from 'next/dynamic';
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });

/* ─── Faculty / Admin stats ─────────────────────── */
const facultyStats = [
  { name: 'Total Students', value: '1,024', icon: Users, change: '+12%', changeType: 'positive' as const, color: 'from-violet-600 to-fuchsia-500', glow: 'oklch(0.65 0.26 285 / 0.3)', bgIcon: 'bg-violet-500/10', iconColor: 'text-violet-400' },
  { name: 'Active Courses', value: '42', icon: BookOpen, change: '+4 this sem', changeType: 'positive' as const, color: 'from-sky-500 to-cyan-400', glow: 'oklch(0.65 0.2 220 / 0.3)', bgIcon: 'bg-sky-500/10', iconColor: 'text-sky-400' },
  { name: 'Avg. Attendance', value: '89%', icon: CheckCircle, change: '+2.1% this week', changeType: 'positive' as const, color: 'from-emerald-500 to-teal-400', glow: 'oklch(0.70 0.20 165 / 0.3)', bgIcon: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
  { name: 'Live Sessions', value: '8', icon: Clock, change: 'Running now', changeType: 'neutral' as const, color: 'from-amber-500 to-orange-400', glow: 'oklch(0.75 0.16 85 / 0.3)', bgIcon: 'bg-amber-500/10', iconColor: 'text-amber-400' },
];

/* ─── Student personal stats ─────────────────────── */
const studentStats = [
  { name: 'My Attendance', value: '87%', icon: CheckCircle, change: '↑ Above 75% min', changeType: 'positive' as const, color: 'from-emerald-500 to-teal-400', glow: 'oklch(0.70 0.20 165 / 0.3)', bgIcon: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
  { name: 'Enrolled Courses', value: '6', icon: BookOpen, change: 'This semester', changeType: 'neutral' as const, color: 'from-sky-500 to-cyan-400', glow: 'oklch(0.65 0.2 220 / 0.3)', bgIcon: 'bg-sky-500/10', iconColor: 'text-sky-400' },
  { name: 'Pending Tasks', value: '3', icon: ClipboardList, change: 'Due this week', changeType: 'neutral' as const, color: 'from-amber-500 to-orange-400', glow: 'oklch(0.75 0.16 85 / 0.3)', bgIcon: 'bg-amber-500/10', iconColor: 'text-amber-400' },
  { name: 'CGPA', value: '8.4', icon: Star, change: 'Last semester', changeType: 'positive' as const, color: 'from-violet-600 to-fuchsia-500', glow: 'oklch(0.65 0.26 285 / 0.3)', bgIcon: 'bg-violet-500/10', iconColor: 'text-violet-400' },
];

const attendanceData = [
  { day: 'Mon', attendance: 72, target: 80 },
  { day: 'Tue', attendance: 85, target: 80 },
  { day: 'Wed', attendance: 91, target: 80 },
  { day: 'Thu', attendance: 78, target: 80 },
  { day: 'Fri', attendance: 95, target: 80 },
  { day: 'Sat', attendance: 88, target: 80 },
  { day: 'Sun', attendance: 60, target: 80 },
];

const upcomingSessions = [
  { course: 'Signals and Systems', code: 'EC-301', faculty: 'Dr. Smith', time: '10:00 AM', room: 'Room 402', status: 'upcoming' },
  { course: 'Digital Signal Processing', code: 'EC-302', faculty: 'Prof. Meera', time: '11:30 AM', room: 'Room 205', status: 'live' },
  { course: 'Network Analysis', code: 'EC-101', faculty: 'Dr. Kumar', time: '2:00 PM', room: 'Room 301', status: 'upcoming' },
];

const topCourses = [
  { name: 'Signals and Systems', attendance: 94, color: 'emerald' as const },
  { name: 'Digital Signal Processing', attendance: 88, color: 'violet' as const },
  { name: 'Network Analysis', attendance: 76, color: 'gold' as const },
  { name: 'Analog Circuits', attendance: 65, color: 'red' as const },
];

// Student: per-course attendance
const studentCourses = [
  { name: 'EC-301 Signals and Systems', attendance: 94, color: 'emerald' as const, status: 'safe' },
  { name: 'EC-302 Digital Signal Processing', attendance: 88, color: 'emerald' as const, status: 'safe' },
  { name: 'EC-101 Network Analysis', attendance: 74, color: 'gold' as const, status: 'watch' },
  { name: 'EC-303 Analog Circuits', attendance: 62, color: 'red' as const, status: 'danger' },
  { name: 'EC-201 Electromagnetic Fields', attendance: 82, color: 'emerald' as const, status: 'safe' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl p-3 border border-border/60 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground">{payload[0]?.value}% attendance</p>
      </div>
    );
  }
  return null;
};

/* ─── Skeleton card ─────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-secondary" />
        <div className="h-4 w-4 rounded bg-secondary" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded-full bg-secondary" />
        <div className="h-8 w-16 rounded bg-secondary" />
        <div className="h-3 w-24 rounded-full bg-secondary" />
      </div>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────── */
export default function DashboardPage() {
  const { loading, displayName, role, isStudent } = useUser();
  const stats = isStudent ? studentStats : facultyStats;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">
              {loading ? 'Dashboard' : isStudent ? 'My Dashboard' : 'Dashboard Overview'}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            {loading
              ? 'Loading your dashboard…'
              : `Welcome back, ${displayName.split(' ')[0]}! Here's what's happening today.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isStudent && <Badge variant="active" dot>Live</Badge>}
          {isStudent && <Badge variant="student" dot>Student</Badge>}
          <span className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-fade-in opacity-0" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}>
                <SkeletonCard />
              </div>
            ))
          : stats.map((stat, i) => (
              <div
                key={stat.name}
                className="animate-slide-in-up opacity-0"
                style={{ animationDelay: `${(i + 1) * 80}ms`, animationFillMode: 'forwards' }}
              >
                <TiltCard intensity={10}>
                  <div
                    className="glass-card rounded-2xl p-5 relative overflow-hidden"
                    style={{ boxShadow: `0 4px 24px ${stat.glow}, 0 1px 0 oklch(1 0 0 / 0.06) inset` }}
                  >
                    <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${stat.color} opacity-60`} />
                    <div className="absolute -right-4 -top-4 opacity-5">
                      <stat.icon className="h-24 w-24" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-10 w-10 rounded-xl ${stat.bgIcon} flex items-center justify-center`}>
                        <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.name}</p>
                      <p className="text-3xl font-black text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        <AnimatedCounter target={stat.value} duration={1200} />
                      </p>
                      <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${stat.changeType === 'positive' ? 'text-emerald-400' : 'text-muted-foreground/60'}`}>
                        {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              </div>
            ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 animate-slide-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        {/* Attendance chart */}
        <div className="lg:col-span-2">
          <TiltCard intensity={4} glareEffect={false}>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {isStudent ? 'My Attendance Trend' : 'Attendance Trend'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isStudent ? 'Your attendance over the past 7 days' : 'Last 7 days across all courses'}
                  </p>
                </div>
                <Badge variant="success" dot>This Week</Badge>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.26 285)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="oklch(0.65 0.26 285)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'oklch(0.60 0.03 265)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: 'oklch(0.60 0.03 265)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="attendance" stroke="oklch(0.65 0.26 285)" strokeWidth={2.5} fill="url(#attendanceGrad)"
                      dot={{ fill: 'oklch(0.65 0.26 285)', r: 4, strokeWidth: 2, stroke: 'oklch(0.08 0.015 265)' }}
                      activeDot={{ r: 6, fill: 'oklch(0.65 0.26 285)', stroke: 'oklch(0.08 0.015 265)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Courses attendance */}
        <TiltCard intensity={6}>
          <div className="glass-card rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {isStudent ? 'My Courses' : 'Course Attendance'}
              </h2>
            </div>
            <div className="space-y-4">
              {(isStudent ? studentCourses : topCourses).map((course) => (
                <div key={course.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 mr-2 min-w-0">
                      {isStudent && 'status' in course && course.status === 'danger' && (
                        <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium text-foreground truncate">{course.name}</p>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${
                      course.attendance >= 80 ? 'text-emerald-400' :
                      course.attendance >= 75 ? 'text-amber-400' : 'text-red-400'
                    }`}>{course.attendance}%</span>
                  </div>
                  <Progress value={course.attendance} variant={course.color} size="sm" />
                </div>
              ))}
            </div>

            {/* Student: shortage warning */}
            {isStudent && (
              <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400 font-medium">EC-303 attendance is below 75% minimum!</p>
                </div>
              </div>
            )}
          </div>
        </TiltCard>
      </div>

      {/* Today's sessions */}
      <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
        <TiltCard intensity={3} glareEffect={false}>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Today&apos;s Sessions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Classes scheduled for today</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingSessions.map((session, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-2.5 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                    session.status === 'live'
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                      : 'border-border/40 bg-background/20 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-muted-foreground">{session.code}</span>
                    {session.status === 'live' ? (
                      <Badge variant="active" dot className="text-[10px] px-1.5">Live</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5">Soon</Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{session.course}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {!isStudent && <p>{session.faculty}</p>}
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground/80">{session.time}</span>
                      <span>{session.room}</span>
                    </div>
                  </div>
                  {isStudent && session.status === 'live' && (
                    <div className="mt-1">
                      <button className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Mark attendance →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
