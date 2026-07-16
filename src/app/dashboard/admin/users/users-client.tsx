'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ShieldCheck, UserCheck, MoreVertical, RefreshCw,
  Database, Globe, HardDrive,
} from 'lucide-react';

// Removed hardcoded users and stats
const systemHealth = [
  { name: 'Database', value: 98, icon: Database, color: 'emerald' as any },
  { name: 'API Server', value: 95, icon: Server, color: 'emerald' as any },
  { name: 'Storage', value: 64, icon: HardDrive, color: 'amber' as any },
  { name: 'CDN', value: 100, icon: Globe, color: 'emerald' as any },
];

const recentActivity = [
  { icon: UserCheck, color: 'text-emerald-400', message: 'New user "Sarah Jenkins" registered', time: '10 mins ago' },
  { icon: Database, color: 'text-indigo-400', message: 'Database backup completed automatically', time: '2 hours ago' },
  { icon: ShieldCheck, color: 'text-amber-400', message: 'Admin role granted to "Mike Davis"', time: '4 hours ago' },
];
export default function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
  const router = useRouter();

  const formattedUsers = initialUsers.map(u => ({
    id: u.id,
    name: u.full_name || 'Unknown User',
    email: u.email || 'N/A',
    role: u.role,
    status: u.status || 'active', // mock
    joined: new Date(u.created_at).toLocaleDateString(),
    lastSeen: 'Just now'
  }));
  const { isAdmin, loading } = useUser();

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
            <h1 className="text-3xl font-black tracking-tight" >
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



      {/* Main grid: User table + Activity + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User management table */}
        <div className="lg:col-span-2 animate-slide-in-up opacity-0" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
          <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground" >User Management</h2>
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
                {formattedUsers.map((user, i) => (
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

                    <Badge variant={user.role as any}>
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
          
        </div>

        {/* Right column */}
        <div className="space-y-5 animate-slide-in-up opacity-0" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          {/* System health */}
          <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-foreground" >System Health</h2>
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
          

          {/* Recent activity */}
          <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5">
              <h2 className="text-base font-bold text-foreground mb-4" >Recent Activity</h2>
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
          
        </div>
      </div>

      {/* Quick actions */}
      <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
        <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5">
            <h2 className="text-base font-bold text-foreground mb-4" >Quick Actions</h2>
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
        
      </div>
    </div>
  );
}
