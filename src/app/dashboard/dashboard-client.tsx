'use client';

import { memo, useMemo } from 'react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/lib/hooks/use-user';
import {
  Users, BookOpen, CheckCircle, Clock, ArrowUpRight, TrendingUp,
  Calendar, ClipboardList, AlertTriangle, Star, Megaphone, Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Single consolidated dynamic import block — reduces chunk overhead
const Charts = dynamic(() => import('@/components/ui/dashboard-charts'), { ssr: false });

const attendanceData = [
  { day: 'Mon', attendance: 72 },
  { day: 'Tue', attendance: 85 },
  { day: 'Wed', attendance: 91 },
  { day: 'Thu', attendance: 78 },
  { day: 'Fri', attendance: 95 },
  { day: 'Sat', attendance: 88 },
  { day: 'Sun', attendance: 60 },
];

const studentPerformanceData = [
  { subject: 'EC-301', score: 85 },
  { subject: 'EC-302', score: 78 },
  { subject: 'EC-101', score: 92 },
  { subject: 'EC-303', score: 68 },
  { subject: 'EC-201', score: 88 },
];

const facultyPerformanceData = [
  { subject: 'EC-301', score: 76 },
  { subject: 'EC-302', score: 81 },
];

const taskStatusData = [
  { name: 'Completed', value: 12, color: '#34d399' },
  { name: 'Pending',   value: 5,  color: '#fbbf24' },
  { name: 'Overdue',   value: 2,  color: '#f87171' },
];

const upcomingSessions = [
  { course: 'Signals and Systems',          code: 'EC-301', faculty: 'Dr. Smith',  time: '10:00 AM', room: 'Room 402', status: 'upcoming' },
  { course: 'Digital Signal Processing',    code: 'EC-302', faculty: 'Prof. Meera', time: '11:30 AM', room: 'Room 205', status: 'live' },
  { course: 'Network Analysis',             code: 'EC-101', faculty: 'Dr. Kumar',   time: '2:00 PM',  room: 'Room 301', status: 'upcoming' },
];

const topCourses = [
  { name: 'Signals and Systems',         attendance: 94, color: 'emerald' as const },
  { name: 'Digital Signal Processing',   attendance: 88, color: 'violet' as const },
  { name: 'Network Analysis',            attendance: 76, color: 'gold' as const },
  { name: 'Analog Circuits',             attendance: 65, color: 'red' as const },
];

const studentCourses = [
  { name: 'EC-301 Signals',              attendance: 94, color: 'emerald' as const, status: 'safe' },
  { name: 'EC-302 DSP',                  attendance: 88, color: 'emerald' as const, status: 'safe' },
  { name: 'EC-101 Network Analysis',     attendance: 74, color: 'gold' as const,    status: 'watch' },
  { name: 'EC-303 Analog Circuits',      attendance: 62, color: 'red' as const,     status: 'danger' },
  { name: 'EC-201 Electromagnetic',      attendance: 82, color: 'emerald' as const, status: 'safe' },
];

const recentAnnouncements = [
  { title: 'System Maintenance Scheduled', type: 'Global',  date: 'Today',     isGlobal: true },
  { title: 'Midterm Exam Schedule Released',type: 'Course',  date: 'Yesterday', isGlobal: false },
];

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="bento-card p-5 animate-pulse">
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

/* ─── Stat Card ─── */
const StatCard = memo(function StatCard({ stat, index }: {
  stat: {
    name: string; value: string; icon: React.ElementType;
    change: string; changeType: 'positive' | 'neutral';
    iconColor: string; iconBg: string; accentGrad: string;
  };
  index: number;
}) {
  return (
    <div
      className="bento-card p-5 animate-slide-in-up opacity-0 group cursor-default"
      style={{ animationDelay: `${(index + 1) * 60}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
          style={{ background: stat.iconBg }}
        >
          <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase mb-1">{stat.name}</p>
        <p className="text-3xl font-black text-white tracking-tight leading-none mb-2">
          <AnimatedCounter target={stat.value} duration={900} />
        </p>
        <p className={`text-[11px] font-medium flex items-center gap-1 ${stat.changeType === 'positive' ? 'text-emerald-400' : 'text-slate-500'}`}>
          {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
          {stat.change}
        </p>
      </div>
      {/* Bottom accent line */}
      <div className="mt-4 h-[2px] rounded-full" style={{ background: stat.accentGrad }} />
    </div>
  );
});

/* ─── Main Dashboard ─── */
export default function DashboardClient({ stats, profile }: { stats: any; profile: any }) {
  const { loading, displayName } = useUser();
  const isStudent = profile?.role === 'student' || !profile?.role;

  const displayStats = useMemo(() => isStudent ? [
    {
      name: 'Attendance',      value: `${stats.attendanceRate}%`,        icon: CheckCircle,
      change: '↑ Above 75%',  changeType: 'positive' as const,
      iconColor: 'text-emerald-400', iconBg: 'rgb(52 211 153 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #34d399, transparent)',
    },
    {
      name: 'Courses',         value: stats.totalCourses.toString(),      icon: BookOpen,
      change: 'This semester', changeType: 'neutral' as const,
      iconColor: 'text-indigo-300',  iconBg: 'rgb(129 140 248 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #818cf8, transparent)',
    },
    {
      name: 'Pending Tasks',   value: stats.pendingAssignments.toString(), icon: ClipboardList,
      change: 'Due this week', changeType: 'neutral' as const,
      iconColor: 'text-amber-300',  iconBg: 'rgb(251 191 36 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #fbbf24, transparent)',
    },
    {
      name: 'CGPA',            value: '8.4',                              icon: Star,
      change: 'Last semester', changeType: 'positive' as const,
      iconColor: 'text-cyan-300',   iconBg: 'rgb(34 211 238 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #22d3ee, transparent)',
    },
  ] : [
    {
      name: 'Total Students',  value: stats.totalStudents.toString(),     icon: Users,
      change: 'Total enrolled', changeType: 'positive' as const,
      iconColor: 'text-indigo-300',  iconBg: 'rgb(129 140 248 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #818cf8, transparent)',
    },
    {
      name: 'Total Courses',   value: stats.totalCourses.toString(),      icon: BookOpen,
      change: 'This semester', changeType: 'positive' as const,
      iconColor: 'text-emerald-400', iconBg: 'rgb(52 211 153 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #34d399, transparent)',
    },
    {
      name: 'Avg Attendance',  value: `${stats.attendanceRate}%`,         icon: CheckCircle,
      change: 'Across all courses', changeType: 'positive' as const,
      iconColor: 'text-emerald-400', iconBg: 'rgb(52 211 153 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #34d399, transparent)',
    },
    {
      name: 'To Grade',        value: stats.pendingAssignments.toString(), icon: Clock,
      change: 'Pending review', changeType: 'neutral' as const,
      iconColor: 'text-amber-300',  iconBg: 'rgb(251 191 36 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #fbbf24, transparent)',
    },
  ], [isStudent, stats]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* ── Page Header ── */}
      <div
        className="flex items-center justify-between animate-fade-in opacity-0"
        style={{ animationFillMode: 'forwards' }}
      >
        <div>
          <h1
            className="text-2xl font-black tracking-tight text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {loading ? 'Dashboard' : isStudent ? (
              <>Hey, <span className="gradient-text">{displayName.split(' ')[0]}</span> 👋</>
            ) : 'Dashboard Overview'}
          </h1>
          <p className="text-slate-500 mt-1 text-[13px]">
            {loading ? 'Loading…' : "Here's what's happening today."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isStudent && <Badge variant="active" dot>Live</Badge>}
          {isStudent && <Badge variant="student" dot>Student</Badge>}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : displayStats.map((stat, i) => (
              <StatCard key={stat.name} stat={stat} index={i} />
            ))}
      </div>

      {/* ── Charts Row ── */}
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0"
        style={{ animationDelay: '280ms', animationFillMode: 'forwards' }}
      >
        {/* Attendance Chart — 2/3 width */}
        <div className="lg:col-span-2 bento-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {isStudent ? 'Attendance Trend' : 'Overall Attendance'}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">Last 7 days</p>
            </div>
            <Badge variant="secondary">7 days</Badge>
          </div>
          <div className="h-52">
            <Charts type="area" data={attendanceData} />
          </div>
        </div>

        {/* Course performance — 1/3 width */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {isStudent ? 'My Courses' : 'Performance'}
            </h2>
          </div>
          <div className="space-y-3.5">
            {(isStudent ? studentCourses : topCourses).map((course) => (
              <div key={course.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 mr-2 min-w-0">
                    {isStudent && 'status' in course && course.status === 'danger' && (
                      <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                    )}
                    <p className="text-[12px] font-medium text-slate-300 truncate">{course.name}</p>
                  </div>
                  <span className={`text-[12px] font-bold flex-shrink-0 ${
                    course.attendance >= 80 ? 'text-emerald-400' :
                    course.attendance >= 75 ? 'text-amber-400' : 'text-red-400'
                  }`}>{course.attendance}%</span>
                </div>
                <Progress value={course.attendance} variant={course.color} size="sm" />
              </div>
            ))}
          </div>

          {isStudent && (
            <div
              className="mt-4 p-3 rounded-xl"
              style={{ background: 'rgb(248 113 113 / 0.08)', border: '1px solid rgb(248 113 113 / 0.2)' }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                <p className="text-[11px] text-red-400 font-semibold">EC-303 below 75% minimum!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Analytics Row ── */}
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0"
        style={{ animationDelay: '360ms', animationFillMode: 'forwards' }}
      >
        {/* Performance bar chart */}
        <div className="lg:col-span-2 bento-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {isStudent ? 'Academic Performance' : 'Class Averages'}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {isStudent ? 'Scores across enrolled courses' : 'Average scores per course'}
              </p>
            </div>
          </div>
          <div className="h-52">
            <Charts type="bar" data={isStudent ? studentPerformanceData : facultyPerformanceData} />
          </div>
        </div>

        {/* Tasks donut */}
        <div className="bento-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {isStudent ? 'Tasks' : 'Grading'}
            </h2>
          </div>
          <div className="flex-1 min-h-[200px] relative">
            <Charts type="donut" data={taskStatusData} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">19</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-2">
            {taskStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                <span className="text-[10px] text-slate-500">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Announcements + Sessions ── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-slide-in-up opacity-0"
        style={{ animationDelay: '440ms', animationFillMode: 'forwards' }}
      >
        {/* Announcements */}
        <div className="bento-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Updates</h2>
            <Megaphone className="h-4 w-4 text-slate-600" />
          </div>
          <div className="space-y-4 flex-1">
            {recentAnnouncements.map((ann, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant={ann.isGlobal ? 'active' : 'secondary'} className="text-[9px] px-1.5">
                    {ann.type}
                  </Badge>
                  <span className="text-[10px] text-slate-600">{ann.date}</span>
                </div>
                <p className="text-[13px] font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors leading-snug">
                  {ann.title}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #1a1a3a' }}>
            <Link href="/dashboard/announcements" className="text-[12px] font-semibold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1.5 w-full">
              View all updates
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Today's sessions */}
        <div className="lg:col-span-2 bento-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Today&apos;s Sessions
            </h2>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Horizontal scroll on mobile */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {upcomingSessions.map((session, i) => (
              <div
                key={i}
                className={`flex-shrink-0 w-64 md:w-auto snap-start flex flex-col gap-2.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                  session.status === 'live'
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-[#1a1a3a] hover:border-indigo-500/30'
                }`}
                style={{
                  background: session.status === 'live'
                    ? 'linear-gradient(135deg, rgb(52 211 153 / 0.08), rgb(16 185 129 / 0.04))'
                    : 'linear-gradient(135deg, #0c0c20, #08081c)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">{session.code}</span>
                  {session.status === 'live' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400"
                      style={{ textShadow: '0 0 8px #34d399' }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-status-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5">Soon</Badge>
                  )}
                </div>
                <p className="text-[13px] font-bold text-white leading-snug">{session.course}</p>
                <div className="text-[12px] text-slate-500 space-y-1 pt-2.5" style={{ borderTop: '1px solid #1a1a3a' }}>
                  {!isStudent && <p className="text-slate-400">{session.faculty}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-semibold">{session.time}</span>
                    <span className="text-slate-600">{session.room}</span>
                  </div>
                </div>
                {isStudent && session.status === 'live' && (
                  <button
                    className="mt-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 w-full"
                    style={{ textShadow: '0 0 8px #34d399' }}
                  >
                    <Zap className="h-3 w-3" />
                    Mark attendance
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
