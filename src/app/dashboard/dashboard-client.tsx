'use client';

import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/lib/hooks/use-user';
import {
  Users, BookOpen, CheckCircle, Clock, ArrowUpRight, TrendingUp,
  Calendar, ClipboardList, GraduationCap, AlertTriangle, Star, Megaphone, Zap
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });

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

const studentCourses = [
  { name: 'EC-301 Signals and Systems', attendance: 94, color: 'emerald' as const, status: 'safe' },
  { name: 'EC-302 Digital Signal Processing', attendance: 88, color: 'emerald' as const, status: 'safe' },
  { name: 'EC-101 Network Analysis', attendance: 74, color: 'gold' as const, status: 'watch' },
  { name: 'EC-303 Analog Circuits', attendance: 62, color: 'red' as const, status: 'danger' },
  { name: 'EC-201 Electromagnetic Fields', attendance: 82, color: 'emerald' as const, status: 'safe' },
];

const recentAnnouncements = [
  { title: 'System Maintenance Scheduled', type: 'Global', date: 'Today', isGlobal: true },
  { title: 'Midterm Exam Schedule Released', type: 'Course', date: 'Yesterday', isGlobal: false }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg p-2.5 shadow-xl" style={{ background: '#111113', border: '1px solid #1f1f23' }}>
        <p className="text-[11px] text-zinc-500 mb-0.5">{label}</p>
        <p className="text-[13px] font-semibold text-white">{payload[0]?.value}% attendance</p>
      </div>
    );
  }
  return null;
};

function SkeletonCard() {
  return (
    <div className="rounded-xl p-4" style={{ background: '#111113', border: '1px solid #1f1f23' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-8 rounded-lg skeleton" />
        <div className="h-4 w-4 rounded skeleton" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-20 rounded skeleton" />
        <div className="h-8 w-16 rounded skeleton" />
        <div className="h-2.5 w-24 rounded skeleton" />
      </div>
    </div>
  );
}

export default function DashboardClient({ stats, profile }: { stats: any; profile: any }) {
  const { loading, displayName } = useUser();
  const isStudent = profile?.role === 'student' || !profile?.role;

  const displayStats = isStudent ? [
    { name: 'My Attendance', value: `${stats.attendanceRate}%`, icon: CheckCircle, change: '↑ Above 75% minimum', changeType: 'positive' as const, iconColor: 'text-emerald-400', bgIcon: 'bg-emerald-500/10', glowColor: 'rgb(16 185 129 / 0.15)' },
    { name: 'Enrolled Courses', value: stats.totalCourses.toString(), icon: BookOpen, change: 'This semester', changeType: 'neutral' as const, iconColor: 'text-indigo-400', bgIcon: 'bg-indigo-500/10', glowColor: 'rgb(99 102 241 / 0.15)' },
    { name: 'Pending Tasks', value: stats.pendingAssignments.toString(), icon: ClipboardList, change: 'Due this week', changeType: 'neutral' as const, iconColor: 'text-amber-400', bgIcon: 'bg-amber-500/10', glowColor: 'rgb(245 158 11 / 0.15)' },
    { name: 'CGPA', value: '8.4', icon: Star, change: 'Last semester', changeType: 'positive' as const, iconColor: 'text-violet-400', bgIcon: 'bg-violet-500/10', glowColor: 'rgb(139 92 246 / 0.15)' },
  ] : [
    { name: 'Total Students', value: stats.totalStudents.toString(), icon: Users, change: 'Total enrolled', changeType: 'positive' as const, iconColor: 'text-indigo-400', bgIcon: 'bg-indigo-500/10', glowColor: 'rgb(99 102 241 / 0.15)' },
    { name: 'Total Courses', value: stats.totalCourses.toString(), icon: BookOpen, change: 'Offered this sem', changeType: 'positive' as const, iconColor: 'text-emerald-400', bgIcon: 'bg-emerald-500/10', glowColor: 'rgb(16 185 129 / 0.15)' },
    { name: 'Avg. Attendance', value: `${stats.attendanceRate}%`, icon: CheckCircle, change: 'Across all courses', changeType: 'positive' as const, iconColor: 'text-emerald-400', bgIcon: 'bg-emerald-500/10', glowColor: 'rgb(16 185 129 / 0.15)' },
    { name: 'Submissions to Grade', value: stats.pendingAssignments.toString(), icon: Clock, change: 'Pending review', changeType: 'neutral' as const, iconColor: 'text-amber-400', bgIcon: 'bg-amber-500/10', glowColor: 'rgb(245 158 11 / 0.15)' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1
            className="text-xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {loading ? 'Dashboard' : isStudent ? 'My Dashboard' : 'Dashboard Overview'}
          </h1>
          <p className="text-zinc-400 mt-1 text-[13px]">
            {loading
              ? 'Loading your dashboard…'
              : `Welcome back, ${displayName.split(' ')[0]}. Here's what's happening.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isStudent && <Badge variant="active" dot>Live</Badge>}
          {isStudent && <Badge variant="student" dot>Student</Badge>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}>
                <SkeletonCard />
              </div>
            ))
          : displayStats.map((stat, i) => (
              <div
                key={stat.name}
                className="group rounded-xl p-4 animate-slide-in-up opacity-0 cursor-default transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: '#111113',
                  border: '1px solid #1f1f23',
                  animationDelay: `${(i + 1) * 60}ms`,
                  animationFillMode: 'forwards',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${stat.glowColor}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#1f1f23';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-9 w-9 rounded-lg ${stat.bgIcon} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-zinc-500 mb-0.5">{stat.name}</p>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    <AnimatedCounter target={stat.value} duration={800} />
                  </p>
                  <p className={`text-[11px] mt-2 font-medium flex items-center gap-1 ${stat.changeType === 'positive' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
                    {stat.change}
                  </p>
                </div>
              </div>
            ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>

        {/* Attendance chart */}
        <div className="lg:col-span-2">
          <div className="rounded-xl p-5 h-full" style={{ background: '#111113', border: '1px solid #1f1f23' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[14px] font-semibold text-white">
                  {isStudent ? 'Attendance Trend' : 'Overall Attendance'}
                </h2>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  {isStudent ? 'Your attendance over the past 7 days' : 'Last 7 days across all courses'}
                </p>
              </div>
              <Badge variant="secondary">7 days</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a2a2e', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#attendanceGrad)"
                    activeDot={{ r: 5, fill: '#6366f1', stroke: '#111113', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Courses attendance */}
        <div className="rounded-xl p-5 h-full" style={{ background: '#111113', border: '1px solid #1f1f23' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-white">
              {isStudent ? 'My Courses' : 'Course Performance'}
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
                    <p className="text-[13px] font-medium text-white truncate">{course.name}</p>
                  </div>
                  <span className={`text-[12px] font-semibold flex-shrink-0 ${
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
            <div className="mt-5 p-3 rounded-lg" style={{ background: 'rgb(239 68 68 / 0.08)', border: '1px solid rgb(239 68 68 / 0.2)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-[12px] text-red-400 font-medium">EC-303 is below 75% minimum!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcements and Today's sessions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-slide-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>

        {/* Recent Announcements Widget */}
        <div className="lg:col-span-1 rounded-xl p-5 flex flex-col" style={{ background: '#111113', border: '1px solid #1f1f23' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-white">Updates</h2>
            <Megaphone className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="space-y-4 flex-1">
            {recentAnnouncements.map((ann, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={ann.isGlobal ? 'active' : 'secondary'} className="text-[9px] px-1.5">
                    {ann.type}
                  </Badge>
                  <span className="text-[10px] text-zinc-500">{ann.date}</span>
                </div>
                <p className="text-[13px] font-medium text-white group-hover:text-indigo-400 transition-colors leading-snug">
                  {ann.title}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #1a1a1d' }}>
            <Link href="/dashboard/announcements" className="text-[12px] font-medium text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1 w-full">
              View all updates
            </Link>
          </div>
        </div>

        {/* Today's sessions */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: '#111113', border: '1px solid #1f1f23' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-white">Today&apos;s Sessions</h2>
            <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingSessions.map((session, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                  session.status === 'live'
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-[#2a2a2e] hover:border-indigo-500/30'
                }`}
                style={{
                  background: session.status === 'live'
                    ? 'rgb(16 185 129 / 0.07)'
                    : '#161618',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">{session.code}</span>
                  {session.status === 'live' ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-status-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5">Soon</Badge>
                  )}
                </div>
                <p className="text-[13px] font-semibold text-white leading-tight group-hover:text-white transition-colors">{session.course}</p>
                <div className="text-[12px] text-zinc-500 space-y-0.5 mt-auto pt-2" style={{ borderTop: '1px solid #1f1f23' }}>
                  {!isStudent && <p className="text-zinc-400">{session.faculty}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">{session.time}</span>
                    <span>{session.room}</span>
                  </div>
                </div>
                {isStudent && session.status === 'live' && (
                  <button className="mt-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 w-full">
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
