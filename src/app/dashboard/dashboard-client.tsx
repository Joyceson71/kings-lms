'use client';

import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/lib/hooks/use-user';
import {
  Users, BookOpen, CheckCircle, Clock,
  ClipboardList, AlertTriangle, Zap,
  ScanLine, Bell, ChevronRight, Flame,
} from 'lucide-react';
import Link from 'next/link';
import { WelcomeSequence } from '@/components/3d/WelcomeSequence';
import { AnimatePresence } from 'framer-motion';

import { SkeletonCard } from '@/components/dashboard/SkeletonCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActiveSessionBanner } from '@/components/dashboard/ActiveSessionBanner';
import { CourseAttendanceCard } from '@/components/dashboard/CourseAttendanceCard';
import { AttendanceTrendChart } from '@/components/dashboard/AttendanceTrendChart';
import { TasksDonut } from '@/components/dashboard/TasksDonut';
import { StreakWidget } from '@/components/dashboard/StreakWidget';
import { StudentData, TrendPoint, AssignmentBreakdown } from '@/components/dashboard/types';
import { formatDueDate, isOverdue, timeAgo } from '@/components/dashboard/utils';

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardClient({
  stats,
  profile,
  studentData,
  attendanceTrend,
  assignmentBreakdown,
  streak,
  studyScore,
}: {
  stats: any;
  profile: any;
  studentData: StudentData | null;
  attendanceTrend: TrendPoint[];
  assignmentBreakdown: AssignmentBreakdown;
  streak: number;
  studyScore: number;
}) {
  const { loading, displayName } = useUser();
  const isStudent = profile?.role === 'student' || !profile?.role;

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('kings_welcome_played')) {
      setShowWelcome(true);
    }
  }, []);

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
      tooltip: 'Your average attendance percentage across all enrolled courses',
    },
    {
      name: 'Courses',
      value: stats.totalCourses.toString(),
      icon: BookOpen,
      change: 'Enrolled this semester',
      changeType: 'neutral' as const,
      iconColor: 'text-indigo-300', iconBg: 'rgb(129 140 248 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #818cf8, transparent)',
      tooltip: 'Total number of active courses you are currently taking',
    },
    {
      name: 'Pending Tasks',
      value: stats.pendingAssignments.toString(),
      icon: ClipboardList,
      change: stats.pendingAssignments > 0 ? 'Needs attention' : 'All caught up!',
      changeType: stats.pendingAssignments > 3 ? 'danger' as const : stats.pendingAssignments > 0 ? 'neutral' as const : 'positive' as const,
      iconColor: 'text-amber-300', iconBg: 'rgb(251 191 36 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #fbbf24, transparent)',
      tooltip: 'Total number of assignments awaiting your submission',
    },
    {
      name: 'Live Now',
      value: (studentData?.activeSessions.length ?? 0).toString(),
      icon: Zap,
      change: studentData?.activeSessions.length ? 'Class in progress!' : 'No active class',
      changeType: studentData?.activeSessions.length ? 'positive' as const : 'neutral' as const,
      iconColor: 'text-cyan-300', iconBg: 'rgb(34 211 238 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #22d3ee, transparent)',
      tooltip: 'Number of classes that are currently running live right now',
    },
  ] : [
    {
      name: 'Total Students', value: stats.totalStudents.toString(), icon: Users,
      change: 'Total enrolled', changeType: 'positive' as const,
      iconColor: 'text-indigo-300', iconBg: 'rgb(129 140 248 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #818cf8, transparent)',
      tooltip: 'Total number of unique students enrolled in the system',
    },
    {
      name: 'Total Courses', value: stats.totalCourses.toString(), icon: BookOpen,
      change: 'This semester', changeType: 'positive' as const,
      iconColor: 'text-emerald-400', iconBg: 'rgb(52 211 153 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #34d399, transparent)',
      tooltip: 'Total number of active courses being taught this semester',
    },
    {
      name: 'Avg Attendance', value: `${stats.attendanceRate}%`, icon: CheckCircle,
      change: 'Across all courses', changeType: 'positive' as const,
      iconColor: 'text-emerald-400', iconBg: 'rgb(52 211 153 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #34d399, transparent)',
      tooltip: 'Average attendance percentage calculated across all students and courses',
    },
    {
      name: 'To Grade', value: stats.pendingAssignments.toString(), icon: Clock,
      change: 'Pending review', changeType: 'neutral' as const,
      iconColor: 'text-amber-300', iconBg: 'rgb(251 191 36 / 0.1)',
      accentGrad: 'linear-gradient(90deg, #fbbf24, transparent)',
      tooltip: 'Number of submitted assignments awaiting faculty review and grading',
    },
  ], [isStudent, stats, studentData, overallAttendance, isAttendanceLow]);

  const coursesDisplay = studentData?.coursesWithAttendance.length
    ? studentData.coursesWithAttendance
    : null;

  const lowAttendanceCourses = coursesDisplay?.filter(c => c.rate < 75) ?? [];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <AnimatePresence>
        {showWelcome && (
          <WelcomeSequence onComplete={() => {
            sessionStorage.setItem('kings_welcome_played', 'true');
            setShowWelcome(false);
          }} />
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {loading ? 'Dashboard' : isStudent ? (
              <>Hey, <span className="gradient-text">{displayName.split(' ')[0]}</span> 👋</>
            ) : 'Dashboard Overview'}
          </h1>
          <p className="text-muted-foreground mt-1 text-[13px]">
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
          className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4 animate-slide-in-up opacity-0"
          style={{ animationDelay: '280ms', animationFillMode: 'forwards' }}
        >
          {/* My Course Attendance — 2/3 width */}
          <div className="lg:col-span-2 bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  My Course Attendance
                </h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
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
                  <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-[12px] font-medium text-muted-foreground">No courses enrolled yet</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Your attendance will appear here once enrolled.</p>
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
            <div className="bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
                          <p className="text-[12px] font-semibold text-muted-foreground truncate leading-snug">{a.title}</p>
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
                    <p className="text-[11px] text-muted-foreground font-medium">All caught up!</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">No pending assignments</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Updates
                </h2>
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
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
                        <p className="text-[12px] font-semibold text-muted-foreground leading-snug truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground text-center py-2">No new notifications</p>
                )}
              </div>
              <Link href="/dashboard/announcements" className="mt-3 text-[11px] text-muted-foreground hover:text-muted-foreground transition-colors flex items-center justify-center gap-1 pt-3 border-t border-border">
                View all announcements <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0"
        style={{ animationDelay: '360ms', animationFillMode: 'forwards' }}
      >
        {/* Attendance trend chart — 2/3 width */}
        <div className="lg:col-span-2 bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {isStudent ? 'Attendance Trend' : 'Overall Attendance'}
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Last 7 days</p>
            </div>
            <Badge variant="secondary">7 days</Badge>
          </div>
          <AttendanceTrendChart data={attendanceTrend} />

        </div>

        {/* Tasks donut — 1/3 width */}
        <div className="bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {isStudent ? 'Tasks' : 'Grading'}
            </h2>
            <Link href="/dashboard/assignments" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5">
              View <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <TasksDonut breakdown={assignmentBreakdown} isStudent={isStudent} />
        </div>
      </div>

      {/* ── Student: Streak Widget + Quick Actions row ── */}
      {isStudent && (
        <div
          className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0"
          style={{ animationDelay: '440ms', animationFillMode: 'forwards' }}
        >
          {/* Streak + Study Score */}
          <StreakWidget streak={streak} studyScore={studyScore} />

          {/* Quick Actions — 2/3 width */}
          <div className="lg:col-span-2 bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 min-w-0">
            <h2 className="text-[15px] font-bold text-foreground mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-white/30 backdrop-blur-md transition-all duration-300 active:scale-95 group hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: bg, borderColor: border }}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{ background: bg }}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <span className="text-[12px] font-semibold text-muted-foreground">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Faculty: Performance + Sessions Row ── */}
      {!isStudent && (
        <div
          className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-slide-in-up opacity-0"
          style={{ animationDelay: '440ms', animationFillMode: 'forwards' }}
        >
          <div className="lg:col-span-2 bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>Class Averages</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Average scores per course</p>
              </div>
            </div>
            <div className="h-52 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/5">
              <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-[12px] font-medium text-muted-foreground">No courses assigned yet</p>
            </div>
          </div>

          <div className="bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>Course Attendance</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/5 py-8">
              <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-[12px] font-medium text-muted-foreground">No active students</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
