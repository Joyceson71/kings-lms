'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ShieldCheck, Users, BookOpen, Activity, Server, Lock,
  UserCheck, UserX, TrendingUp, MoreVertical, RefreshCw,
  Database, Globe, Cpu, HardDrive,
} from 'lucide-react';

const systemStats = [
  { name: 'Total Users', value: '1,247', icon: Users, color: 'from-violet-600 to-fuchsia-500', glow: 'oklch(0.65 0.26 285 / 0.3)', bgIcon: 'bg-violet-500/10', iconColor: 'text-violet-400', change: '+23 this month' },
  { name: 'Faculty Members', value: '48', icon: UserCheck, color: 'from-sky-500 to-cyan-400', glow: 'oklch(0.65 0.2 220 / 0.3)', bgIcon: 'bg-sky-500/10', iconColor: 'text-sky-400', change: '3 pending approval' },
  { name: 'Total Courses', value: '86', icon: BookOpen, color: 'from-emerald-500 to-teal-400', glow: 'oklch(0.70 0.20 165 / 0.3)', bgIcon: 'bg-emerald-500/10', iconColor: 'text-emerald-400', change: '+6 this semester' },
  { name: 'Active Sessions', value: '12', icon: Activity, color: 'from-amber-500 to-orange-400', glow: 'oklch(0.75 0.16 85 / 0.3)', bgIcon: 'bg-amber-500/10', iconColor: 'text-amber-400', change: 'Right now' },
];

const systemHealth = [
  { name: 'Database', value: 98, icon: Database, color: 'emerald' as const },
  { name: 'API Server', value: 100, icon: Server, color: 'emerald' as const },
  { name: 'Storage', value: 64, icon: HardDrive, color: 'gold' as const },
  { name: 'CPU Load', value: 32, icon: Cpu, color: 'violet' as const },
];

type UserRole = 'admin' | 'faculty' | 'student';

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  joined: string;
  lastSeen: string;
}

const allUsers: ManagedUser[] = [
  { id: 1, name: 'Joyceson D', email: 'joyceson.d@kingsecc.in', role: 'admin', status: 'active', joined: 'Jan 2024', lastSeen: 'Just now' },
  { id: 2, name: 'Dr. A. Smith', email: 'a.smith@kingsecc.in', role: 'faculty', status: 'active', joined: 'Jan 2024', lastSeen: '2h ago' },
  { id: 3, name: 'Prof. M. Raj', email: 'm.raj@kingsecc.in', role: 'faculty', status: 'active', joined: 'Feb 2024', lastSeen: '1d ago' },
  { id: 4, name: 'Arun K.', email: 'arun.k@kingsecc.in', role: 'student', status: 'active', joined: 'Jun 2024', lastSeen: '3h ago' },
  { id: 5, name: 'Priya N.', email: 'priya.n@kingsecc.in', role: 'student', status: 'active', joined: 'Jun 2024', lastSeen: 'Yesterday' },
  { id: 6, name: 'New Faculty', email: 'new.faculty@kingsecc.in', role: 'faculty', status: 'pending', joined: 'Jul 2026', lastSeen: 'Never' },
  { id: 7, name: 'Rahul V.', email: 'rahul.v@kingsecc.in', role: 'student', status: 'suspended', joined: 'Jun 2024', lastSeen: '30d ago' },
];

const recentActivity = [
  { icon: UserCheck, message: 'New faculty account created: Prof. R. Kumar', time: '5m ago', color: 'text-emerald-400' },
  { icon: BookOpen, message: 'Course CS-305 added to the system', time: '1h ago', color: 'text-sky-400' },
  { icon: UserX, message: 'Student account suspended (attendance < 50%)', time: '2h ago', color: 'text-red-400' },
  { icon: Lock, message: 'Password reset request: priya.n@kingsecc.in', time: '3h ago', color: 'text-amber-400' },
  { icon: Globe, message: 'System backup completed successfully', time: '6h ago', color: 'text-violet-400' },
];

const roleBadgeMap: Record<UserRole, 'admin' | 'faculty' | 'student'> = {
  admin: 'admin',
  faculty: 'faculty',
  student: 'student',
};

export default function AdminPage() {
  const { isAdmin, loading } = useUser();
  const router = useRouter();

  // Redirect non-admins
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="gradient-text-gold">Admin Panel</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">Full system access · Kings Engineering College LMS</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="admin" dot>Administrator</Badge>
          <Button
            variant="outline"
            size="sm"
            id="admin-refresh-btn"
            className="border-border/40 rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat, i) => (
          <div
            key={stat.name}
            className="animate-slide-in-up opacity-0"
            style={{ animationDelay: `${(i + 1) * 70}ms`, animationFillMode: 'forwards' }}
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
                  <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.name}</p>
                <p className="text-3xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedCounter target={stat.value} duration={1200} />
                </p>
                <p className="text-xs mt-2 text-muted-foreground/70 font-medium">{stat.change}</p>
              </div>
            </TiltCard>
          </div>
        ))}
      </div>

      {/* Main grid: User table + Activity + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User management table */}
        <div className="lg:col-span-2 animate-slide-in-up opacity-0" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
          <TiltCard intensity={2} glareEffect={false}>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>User Management</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">All registered users — manage roles & status</p>
                </div>
                <Button
                  size="sm"
                  id="admin-invite-btn"
                  className="h-8 px-3 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 rounded-lg text-xs font-semibold"
                >
                  + Invite User
                </Button>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3 bg-secondary/20 border-b border-border/30">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">User</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"></span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/20">
                {allUsers.map((user, i) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3.5 items-center hover:bg-secondary/15 transition-colors animate-fade-in opacity-0"
                    style={{ animationDelay: `${350 + i * 40}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.name} size="sm" ring={user.role === 'admin' ? 'gold' : user.role === 'faculty' ? 'violet' : 'none'} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    <Badge variant={roleBadgeMap[user.role]}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>

                    <Badge
                      variant={user.status === 'active' ? 'active' : user.status === 'pending' ? 'warning' : 'destructive'}
                      dot
                    >
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>

                    <button
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                      aria-label={`More options for ${user.name}`}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Right column */}
        <div className="space-y-5 animate-slide-in-up opacity-0" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          {/* System health */}
          <TiltCard intensity={6}>
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>System Health</h2>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-status-pulse shadow-[0_0_8px_oklch(0.7_0.2_165/0.8)]" />
              </div>
              <div className="space-y-4">
                {systemHealth.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${
                        item.value >= 90 ? 'text-emerald-400' :
                        item.value >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>{item.value}%</span>
                    </div>
                    <Progress value={item.value} variant={item.color} size="sm" />
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-medium">✓ All systems operational</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Last checked: just now</p>
              </div>
            </div>
          </TiltCard>

          {/* Recent activity */}
          <TiltCard intensity={5}>
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-bold text-foreground mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <activity.icon className={`h-3.5 w-3.5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80 leading-relaxed">{activity.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </div>
      </div>

      {/* Quick actions */}
      <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
        <TiltCard intensity={3} glareEffect={false}>
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-base font-bold text-foreground mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Add Course', icon: BookOpen, id: 'admin-add-course' },
                { label: 'Manage Roles', icon: ShieldCheck, id: 'admin-manage-roles' },
                { label: 'View Reports', icon: Activity, id: 'admin-view-reports' },
                { label: 'System Backup', icon: Database, id: 'admin-backup' },
              ].map((action) => (
                <button
                  key={action.id}
                  id={action.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/30 bg-background/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 text-center"
                >
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <action.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
