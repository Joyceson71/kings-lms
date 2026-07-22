'use client';

import { memo, useMemo } from 'react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/lib/hooks/use-user';
import {
  Users, BookOpen, CheckCircle, Clock, ArrowUpRight, TrendingUp,
  ClipboardList, AlertTriangle, Zap,
  ScanLine, Bell, ChevronRight, Flame,
} from 'lucide-react';
import Link from 'next/link';

// ─── Fallback mock data (used when real data has no results yet) ────────────
// (Removed to show fresh empty states for new users instead of fake data)

// ─── Types ──────────────────────────────────────────────────────────────────
type CourseWithAttendance = {
  id: string; title: string; code: string;
  total: number; attended: number; rate: number;
};
type ActiveSession = {
  id: string; course_id: string; room: string | null;
  qr_token: string; started_at: string;
  courses: { title: string; code: string } | null;
};
type PendingAssignment = { id: string; title: string; dueDate: string | null; course: string };
type Notification = { id: string; title: string; message: string; type: string; created_at: string };

interface StudentData {
  coursesWithAttendance: CourseWithAttendance[];
  activeSessions: ActiveSession[];
  pendingAssignments: PendingAssignment[];
  notifications: Notification[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAttendanceColor(rate: number): 'emerald' | 'gold' | 'red' | 'violet' {
  if (rate >= 80) return 'emerald';
  if (rate >= 75) return 'gold';
  return 'red';
}
function getAttendanceStatus(rate: number) {
  if (rate >= 80) return { label: 'Safe', cls: 'text-emerald-400' };
  if (rate >= 75) return { label: 'Watch', cls: 'text-amber-400' };
  return { label: 'Low', cls: 'text-red-400' };
}
function formatDueDate(iso: string | null) {
  if (!iso) return 'No deadline';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays}d`;
}
function isOverdue(iso: string | null) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({ stat, index }: {
  stat: {
    name: string; value: string; icon: React.ElementType;
    change: string; changeType: 'positive' | 'neutral' | 'danger';
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
        <p className={`text-[11px] font-medium flex items-center gap-1 ${
          stat.changeType === 'positive' ? 'text-emerald-400' :
          stat.changeType === 'danger' ? 'text-red-400' : 'text-slate-500'
        }`}>
          {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
          {stat.changeType === 'danger' && <AlertTriangle className="h-3 w-3" />}
          {stat.change}
        </p>
      </div>
      <div className="mt-4 h-[2px] rounded-full" style={{ background: stat.accentGrad }} />
    </div>
  );
});

// ─── Active Session Banner ────────────────────────────────────────────────────
function ActiveSessionBanner({ sessions }: { sessions: ActiveSession[] }) {
  if (sessions.length === 0) return null;
  const session = sessions[0];
  return (
    <Link
      href={`/dashboard/attendance?token=${session.qr_token}`}
      className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/8 hover:bg-emerald-500/12 transition-all duration-200 group animate-slide-in-up opacity-0"
      style={{ animationFillMode: 'forwards', background: 'linear-gradient(135deg, rgb(16 185 129 / 0.08), rgb(52 211 153 / 0.04))' }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <ScanLine className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#04040c] animate-status-pulse" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-300">Class is LIVE right now!</p>
          <p className="text-xs text-emerald-500/80">
            {session.courses?.title ?? 'Class'} • {session.room ?? 'Unknown room'} — tap to mark attendance
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-emerald-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
        <Zap className="h-4 w-4" />
        <span className="text-xs font-bold hidden sm:block">Mark Now</span>
      </div>
    </Link>
  );
}

// ─── Course Attendance Card ───────────────────────────────────────────────────
function CourseAttendanceCard({ course }: { course: CourseWithAttendance }) {
  const status = getAttendanceStatus(course.rate);
  const color = getAttendanceColor(course.rate);
  const isLow = course.rate < 75;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:border-white/10"
      style={{
        background: isLow ? 'rgb(239 68 68 / 0.04)' : 'transparent',
        borderColor: isLow ? 'rgb(239 68 68 / 0.2)' : '#1a1a2e',
      }}
    >
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
        color === 'emerald' ? 'bg-emerald-400' :
        color === 'gold' ? 'bg-amber-400' : 'bg-red-400'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-semibold text-slate-200 truncate">{course.title}</p>
          <span className={`text-[12px] font-bold flex-shrink-0 ml-2 ${status.cls}`}>
            {course.rate}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={course.rate} variant={color} size="sm" className="flex-1" />
          <span className="text-[9px] text-slate-600 flex-shrink-0">{course.attended}/{course.total}</span>
        </div>
      </div>
      {isLow && <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardClient({
  stats,
  profile,
  studentData,
}: {
  stats: any;
  profile: any;
  studentData: StudentData | null;
}) {
  const { loading, displayName } = useUser();
  const isStudent = profile?.role === 'student' || !profile?.role;

  const overallAttendance = stats.attendanceRate;
  const isAttendanceLow = overallAttendance < 75;

  const displayStats = useMemo(() => isStudent ? [
    {
      name: 'Attendance',
      value: `${overallAttendance}%`,
      icon: CheckCircle,
      change: isAttendanceLow ? 'Below 75% minimum!' : '↑ Above 75% minimum',
      changeType: isAttendanceLow ? 'danger' as const : 'positive' as const,
      iconColor: isAttendanceLow ? 'text-red-400' : 'text-emerald-400',
      iconBg: isAttendanceLow ? 'rgb(239 68 68 / 0.1)' : 'rgb(52 211 153 / 0.1)',
      accentGrad: isAttendanceLow ? 'linear-gradient(90deg, #f87171, transparent)' : 'linear-gradient(90deg, #34d399, transparent)',
    },
    {
      name: 'Courses',
      value: stats.totalCourses.toString(),
      icon: BookOpen,
      change: 'Enrolled this semester',
      changeType: 'neutral' as const,
      iconColor: 'text-indigo-300', iconBg: 'rgb(129 140 248 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #818cf8, transparent)',
    },
    {
      name: 'Pending Tasks',
      value: stats.pendingAssignments.toString(),
      icon: ClipboardList,
      change: stats.pendingAssignments > 0 ? 'Needs attention' : 'All caught up!',
      changeType: stats.pendingAssignments > 3 ? 'danger' as const : stats.pendingAssignments > 0 ? 'neutral' as const : 'positive' as const,
      iconColor: 'text-amber-300', iconBg: 'rgb(251 191 36 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #fbbf24, transparent)',
    },
    {
      name: 'Live Now',
      value: (studentData?.activeSessions.length ?? 0).toString(),
      icon: Zap,
      change: studentData?.activeSessions.length ? 'Class in progress!' : 'No active class',
      changeType: studentData?.activeSessions.length ? 'positive' as const : 'neutral' as const,
      iconColor: 'text-cyan-300', iconBg: 'rgb(34 211 238 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #22d3ee, transparent)',
    },
  ] : [
    {
      name: 'Total Students', value: stats.totalStudents.toString(), icon: Users,
      change: 'Total enrolled', changeType: 'positive' as const,
      iconColor: 'text-indigo-300', iconBg: 'rgb(129 140 248 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #818cf8, transparent)',
    },
    {
      name: 'Total Courses', value: stats.totalCourses.toString(), icon: BookOpen,
      change: 'This semester', changeType: 'positive' as const,
      iconColor: 'text-emerald-400', iconBg: 'rgb(52 211 153 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #34d399, transparent)',
    },
    {
      name: 'Avg Attendance', value: `${stats.attendanceRate}%`, icon: CheckCircle,
      change: 'Across all courses', changeType: 'positive' as const,
      iconColor: 'text-emerald-400', iconBg: 'rgb(52 211 153 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #34d399, transparent)',
    },
    {
      name: 'To Grade', value: stats.pendingAssignments.toString(), icon: Clock,
      change: 'Pending review', changeType: 'neutral' as const,
      iconColor: 'text-amber-300', iconBg: 'rgb(251 191 36 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #fbbf24, transparent)',
    },
  ], [isStudent, stats, studentData, overallAttendance, isAttendanceLow]);

  const coursesDisplay = studentData?.coursesWithAttendance.length
    ? studentData.coursesWithAttendance
    : null;

  const lowAttendanceCourses = coursesDisplay?.filter(c => c.rate < 75) ?? [];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {loading ? 'Dashboard' : isStudent ? (
              <>Hey, <span className="gradient-text">{displayName.split(' ')[0]}</span> 👋</>
            ) : 'Dashboard Overview'}
          </h1>
          <p className="text-slate-500 mt-1 text-[13px]">
            {loading ? 'Loading…' : isStudent
              ? new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
              : "Here's what's happening today."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isStudent && <Badge variant="active" dot>Live</Badge>}
          {isStudent && <Badge variant="student" dot>Student</Badge>}
        </div>
      </div>

      {/* ── Live Session Alert Banner (students only) ── */}
      {isStudent && studentData && (
        <ActiveSessionBanner sessions={studentData.activeSessions} />
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : displayStats.map((stat, i) => (
              <StatCard key={stat.name} stat={stat} index={i} />
            ))}
      </div>

      {/* ── Student-specific: Attendance + Deadlines Row ── */}
      {isStudent && (
        <div
          className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0"
          style={{ animationDelay: '280ms', animationFillMode: 'forwards' }}
        >
          {/* My Course Attendance — 2/3 width */}
          <div className="lg:col-span-2 bento-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  My Course Attendance
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {coursesDisplay ? `${coursesDisplay.length} enrolled courses` : 'No enrollments yet'}
                </p>
              </div>
              <Link href="/dashboard/attendance" className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                Details <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {coursesDisplay && coursesDisplay.length > 0 ? (
                coursesDisplay.map(course => (
                  <CourseAttendanceCard key={course.id} course={course} />
                ))
              ) : (
                <div className="flex flex-col items-center py-6 text-center border border-dashed border-border/50 rounded-xl bg-secondary/5">
                  <BookOpen className="h-8 w-8 text-slate-600/50 mb-2" />
                  <p className="text-[12px] font-medium text-slate-400">No courses enrolled yet</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Your attendance will appear here once enrolled.</p>
                </div>
              )}
            </div>

            {/* Critical alert if any course is low */}
            {lowAttendanceCourses.length > 0 && (
              <div
                className="mt-3 p-3 rounded-xl flex items-start gap-2"
                style={{ background: 'rgb(248 113 113 / 0.08)', border: '1px solid rgb(248 113 113 / 0.2)' }}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-400 font-medium leading-relaxed">
                  <span className="font-bold">{lowAttendanceCourses.map(c => c.code || c.title).join(', ')}</span>
                  {' '}— below 75% minimum. Risk of not being allowed to sit exams.
                </p>
              </div>
            )}
          </div>

          {/* Upcoming deadlines / Notifications — 1/3 width */}
          <div className="space-y-3">
            {/* Pending Assignments */}
            <div className="bento-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Deadlines
                </h2>
                <Link href="/dashboard/assignments" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5">
                  All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {studentData?.pendingAssignments.length ? (
                  studentData.pendingAssignments.slice(0, 4).map(a => {
                    const overdue = isOverdue(a.dueDate);
                    return (
                      <div key={a.id} className="flex items-start gap-2.5">
                        <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${overdue ? 'bg-red-400' : 'bg-amber-400'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-slate-200 truncate leading-snug">{a.title}</p>
                          <p className={`text-[10px] font-medium ${overdue ? 'text-red-400' : 'text-amber-400'}`}>
                            {formatDueDate(a.dueDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <CheckCircle className="h-8 w-8 text-emerald-500/30 mb-2" />
                    <p className="text-[11px] text-slate-500 font-medium">All caught up!</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">No pending assignments</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bento-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Updates
                </h2>
                <Bell className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <div className="space-y-2.5">
                {studentData?.notifications.length ? (
                  studentData.notifications.map(n => (
                    <div key={n.id} className="flex items-start gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        n.type === 'success' ? 'bg-emerald-400' :
                        n.type === 'warning' ? 'bg-amber-400' :
                        n.type === 'error' ? 'bg-red-400' : 'bg-indigo-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-200 leading-snug truncate">{n.title}</p>
                        <p className="text-[10px] text-slate-600">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-600 text-center py-2">No new notifications</p>
                )}
              </div>
              <Link href="/dashboard/announcements" className="mt-3 text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1 pt-3 border-t border-[#1a1a2e]">
                View all announcements <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Row (Faculty view or student analytics) ── */}
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0"
        style={{ animationDelay: '360ms', animationFillMode: 'forwards' }}
      >
        {/* Attendance trend chart — 2/3 width */}
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
          <div className="h-52 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/5">
            <TrendingUp className="h-8 w-8 text-slate-600/50 mb-2" />
            <p className="text-[12px] font-medium text-slate-400">Not enough data yet</p>
          </div>
        </div>

        {/* Tasks donut */}
        <div className="bento-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {isStudent ? 'Tasks' : 'Grading'}
            </h2>
          </div>
          <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/5">
            <CheckCircle className="h-8 w-8 text-slate-600/50 mb-2" />
            <p className="text-[12px] font-medium text-slate-400">No active tasks</p>
          </div>
        </div>
      </div>

      {/* ── Faculty: Performance + Sessions Row ── */}
      {!isStudent && (
        <div
          className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0"
          style={{ animationDelay: '440ms', animationFillMode: 'forwards' }}
        >
          <div className="lg:col-span-2 bento-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Class Averages</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Average scores per course</p>
              </div>
            </div>
            <div className="h-52 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/5">
              <BookOpen className="h-8 w-8 text-slate-600/50 mb-2" />
              <p className="text-[12px] font-medium text-slate-400">No courses assigned yet</p>
            </div>
          </div>

          <div className="bento-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Course Attendance</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/5 py-8">
              <Users className="h-8 w-8 text-slate-600/50 mb-2" />
              <p className="text-[12px] font-medium text-slate-400">No active students</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions (students only) ── */}
      {isStudent && (
        <div
          className="animate-slide-in-up opacity-0"
          style={{ animationDelay: '440ms', animationFillMode: 'forwards' }}
        >
          <div className="bento-card p-5">
            <h2 className="text-[15px] font-bold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Scan QR', icon: ScanLine, href: '/dashboard/attendance', color: 'text-emerald-400', bg: 'rgb(52 211 153 / 0.08)', border: 'rgb(52 211 153 / 0.2)' },
                { label: 'Assignments', icon: ClipboardList, href: '/dashboard/assignments', color: 'text-amber-400', bg: 'rgb(251 191 36 / 0.08)', border: 'rgb(251 191 36 / 0.2)' },
                { label: 'Courses', icon: BookOpen, href: '/dashboard/courses', color: 'text-indigo-400', bg: 'rgb(129 140 248 / 0.08)', border: 'rgb(129 140 248 / 0.2)' },
                { label: 'Leaderboard', icon: Flame, href: '/dashboard/leaderboard', color: 'text-rose-400', bg: 'rgb(244 63 94 / 0.08)', border: 'rgb(244 63 94 / 0.2)' },
              ].map(({ label, icon: Icon, href, color, bg, border }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:brightness-110 transition-all duration-200 active:scale-95 group"
                  style={{ background: bg, borderColor: border }}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{ background: bg }}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <span className="text-[12px] font-semibold text-slate-300">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
