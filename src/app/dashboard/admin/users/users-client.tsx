'use client';

import { useState, useMemo, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, UserCheck, MoreVertical, RefreshCw,
  Database, Globe, HardDrive, BookOpen, Server, Activity,
  Search, Users, GraduationCap, Shield, UserX, UserCircle2,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'student' | 'faculty' | 'admin';
type UserStatus = 'active' | 'suspended';

interface RawUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus | null;
  created_at: string;
  department?: string | null;
  college?: string | null;
}

interface FormattedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joined: string;
  department: string | null;
}

export interface ActivityItem {
  id: string;
  type: 'user' | 'course' | 'system';
  message: string;
  time: string;
}

// ─── Static display data (still mock — wired in a future analytics migration) ─

const systemHealth = [
  { name: 'Database',   value: 98,  icon: Database,  color: 'emerald' as const },
  { name: 'API Server', value: 95,  icon: Server,    color: 'emerald' as const },
  { name: 'Storage',    value: 64,  icon: HardDrive, color: 'gold'    as const },
  { name: 'CDN',        value: 100, icon: Globe,     color: 'emerald' as const },
];

// ─── Role Change Dialog ────────────────────────────────────────────────────────

const ROLES: { value: UserRole; label: string; desc: string; color: string }[] = [
  { value: 'student', label: 'Student',  desc: 'Can view courses & submit attendance',  color: 'text-indigo-400' },
  { value: 'faculty', label: 'Faculty',  desc: 'Can manage courses & grade students',   color: 'text-violet-400' },
  { value: 'admin',   label: 'Admin',    desc: 'Full system access',                    color: 'text-amber-400'  },
];

interface RoleDialogProps {
  user: FormattedUser;
  isSelf: boolean;
  onClose: () => void;
  onConfirm: (newRole: UserRole) => Promise<void>;
}

function RoleDialog({ user, isSelf, onClose, onConfirm }: RoleDialogProps) {
  const [selected, setSelected] = useState<UserRole>(user.role);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm(selected);
      onClose();
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Change Role — {user.name}</DialogTitle>
        <DialogDescription>
          Choose a new role for this user. The change takes effect immediately.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 py-2">
        {ROLES.map((r) => (
          <button
            key={r.value}
            disabled={isSelf && r.value !== 'admin'}
            onClick={() => setSelected(r.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 text-left
              ${selected === r.value
                ? 'border-primary/60 bg-primary/8'
                : 'border-border/30 bg-secondary/10 hover:border-border/60'}
              ${isSelf && r.value !== 'admin' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${selected === r.value ? 'border-primary' : 'border-border/50'}`}>
              {selected === r.value && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${r.color}`}>{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </div>
            {user.role === r.value && (
              <span className="text-[10px] font-semibold text-muted-foreground border border-border/40 rounded px-1.5 py-0.5">current</span>
            )}
          </button>
        ))}
        {isSelf && (
          <p className="text-[11px] text-amber-400/80 px-1">
            ⚠ You cannot demote yourself from Admin.
          </p>
        )}
      </div>

      <DialogFooter>
        <DialogClose className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" onClick={onClose}>
          Cancel
        </DialogClose>
        <Button
          onClick={handleConfirm}
          disabled={pending || selected === user.role || (isSelf && selected !== 'admin')}
          className="rounded-xl"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {pending ? 'Saving…' : 'Confirm Change'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Suspend Confirm Dialog ────────────────────────────────────────────────────

interface SuspendDialogProps {
  user: FormattedUser;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function SuspendDialog({ user, onClose, onConfirm }: SuspendDialogProps) {
  const [pending, startTransition] = useTransition();
  const isSuspended = user.status === 'suspended';

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className={isSuspended ? 'text-emerald-400' : 'text-destructive'}>
          {isSuspended ? 'Reactivate User' : 'Suspend User'} — {user.name}
        </DialogTitle>
        <DialogDescription>
          {isSuspended
            ? 'This user will regain full access to the platform.'
            : 'The user will be unable to access any protected pages until reactivated.'}
        </DialogDescription>
      </DialogHeader>
      <div className={`mt-2 p-4 rounded-xl border ${isSuspended ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
        <p className={`text-sm font-semibold ${isSuspended ? 'text-emerald-400' : 'text-destructive'}`}>
          {isSuspended ? '✓ This action is reversible.' : '⚠ This action is reversible.'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You can {isSuspended ? 'suspend' : 'reactivate'} this user again at any time.
        </p>
      </div>
      <DialogFooter>
        <DialogClose className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" onClick={onClose}>
          Cancel
        </DialogClose>
        <Button
          onClick={handleConfirm}
          disabled={pending}
          variant={isSuspended ? 'default' : 'destructive'}
          className="rounded-xl"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {pending
            ? 'Saving…'
            : isSuspended ? 'Reactivate User' : 'Suspend User'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminUsersClient({
  initialUsers,
  currentUserId,
  recentActivity = [],
}: {
  initialUsers: RawUser[];
  currentUserId: string;
  recentActivity?: ActivityItem[];
}) {
  const router = useRouter();

  // ── Local user state (optimistic) ──
  const [users, setUsers] = useState<FormattedUser[]>(() =>
    initialUsers.map((u) => ({
      id: u.id,
      name: u.full_name || 'Unknown User',
      email: u.email || 'N/A',
      role: u.role,
      status: u.status ?? 'active',
      joined: new Date(u.created_at).toLocaleDateString('en-IN'),
      department: u.department ?? null,
    }))
  );

  // ── Dialog state ──
  const [roleDialogUser, setRoleDialogUser] = useState<FormattedUser | null>(null);
  const [suspendDialogUser, setSuspendDialogUser] = useState<FormattedUser | null>(null);

  // ── Filters ──
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // ── API helpers ──
  async function patchUser(id: string, updates: { role?: UserRole; status?: UserStatus }) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Unknown error');
    }
  }

  async function handleRoleChange(user: FormattedUser, newRole: UserRole) {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );
    try {
      await patchUser(user.id, { role: newRole });
    } catch (err) {
      // Rollback
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: user.role } : u))
      );
      console.error('Role change failed:', err);
    }
  }

  async function handleStatusToggle(user: FormattedUser) {
    const newStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    try {
      await patchUser(user.id, { status: newStatus });
    } catch (err) {
      // Rollback
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u))
      );
      console.error('Status change failed:', err);
    }
  }

  // ── Derived stats ──
  const stats = useMemo(() => ({
    total:    users.length,
    students: users.filter((u) => u.role === 'student').length,
    faculty:  users.filter((u) => u.role === 'faculty').length,
    admins:   users.filter((u) => u.role === 'admin').length,
    active:   users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  }), [users]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole   = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const statCards = [
    { label: 'Total Users',    value: stats.total,    icon: Users,          color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Students',       value: stats.students,  icon: GraduationCap,  color: 'text-sky-400',    bg: 'bg-sky-500/10' },
    { label: 'Faculty',        value: stats.faculty,   icon: UserCircle2,    color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Admins',         value: stats.admins,    icon: Shield,         color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0"
        style={{ animationFillMode: 'forwards' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <h1 className="text-3xl font-black tracking-tight">
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
            onClick={() => router.refresh()}
            className="border-border/40 rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Live Stat Cards ── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-in-up opacity-0"
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
      >
        {statCards.map((card) => (
          <div key={card.label} className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground leading-none">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── User Management Table ── */}
        <div
          className="lg:col-span-2 animate-slide-in-up opacity-0"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50 gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-foreground">User Management</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filtered.length} of {stats.total} users
                  {stats.suspended > 0 && (
                    <span className="ml-2 text-red-400">· {stats.suspended} suspended</span>
                  )}
                </p>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-secondary/10 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="admin-user-search"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-secondary/30 border-border/40 rounded-lg"
                />
              </div>

              {/* Role filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'student', 'faculty', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all duration-150
                      ${roleFilter === r
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-secondary/30 text-muted-foreground border border-border/30 hover:border-border/60'}`}
                  >
                    {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3 bg-secondary/10 border-b border-border/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">User</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/20">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <UserX className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No users match your filter.</p>
                </div>
              ) : (
                filtered.map((user, i) => (
                  <div
                    key={user.id}
                    className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3.5 items-center transition-colors animate-fade-in opacity-0 ${
                      user.status === 'suspended' ? 'bg-red-500/3 hover:bg-red-500/5' : 'hover:bg-secondary/15'
                    }`}
                    style={{ animationDelay: `${200 + i * 35}ms`, animationFillMode: 'forwards' }}
                  >
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={user.status === 'suspended' ? 'opacity-50' : ''}>
                        <Avatar
                          name={user.name}
                          size="sm"
                          ring={user.role === 'admin' ? 'gold' : user.role === 'faculty' ? 'violet' : 'none'}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${user.status === 'suspended' ? 'text-muted-foreground line-through decoration-red-500/50' : 'text-foreground'}`}>
                          {user.name}
                          {user.id === currentUserId && (
                            <span className="ml-1.5 text-[10px] font-normal text-amber-400 no-underline">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Role badge */}
                    <Badge variant={user.role as any}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>

                    {/* Status badge */}
                    <Badge
                      variant={user.status === 'active' ? 'active' : 'destructive'}
                      dot
                    >
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>

                    {/* Actions menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        aria-label={`More options for ${user.name}`}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Actions
                        </div>
                        <DropdownMenuItem
                          id={`admin-change-role-${user.id}`}
                          onClick={() => setRoleDialogUser(user)}
                        >
                          <Shield className="h-3.5 w-3.5 mr-2 text-amber-400" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          id={`admin-toggle-status-${user.id}`}
                          disabled={user.id === currentUserId}
                          className={user.status === 'active'
                            ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
                            : 'text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-400'}
                          onClick={() => setSuspendDialogUser(user)}
                        >
                          <UserX className="h-3.5 w-3.5 mr-2" />
                          {user.status === 'active' ? 'Suspend User' : 'Reactivate User'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div
          className="space-y-5 animate-slide-in-up opacity-0"
          style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
        >
          {/* System health */}
          <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">System Health</h2>
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
            <h2 className="text-base font-bold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const Icon = activity.type === 'user' ? UserCheck : activity.type === 'course' ? BookOpen : Database;
                const color = activity.type === 'user' ? 'text-emerald-400' : activity.type === 'course' ? 'text-indigo-400' : 'text-amber-400';
                
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80 leading-relaxed">{activity.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(activity.time).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {recentActivity.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div
        className="animate-slide-in-up opacity-0"
        style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
      >
        <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Add Course',    icon: BookOpen,    id: 'admin-add-course',    href: '/dashboard/courses' },
              { label: 'Manage Roles',  icon: ShieldCheck, id: 'admin-manage-roles',  href: null },
              { label: 'View Reports',  icon: Activity,    id: 'admin-view-reports',  href: '/dashboard/reports' },
              { label: 'System Backup', icon: Database,    id: 'admin-backup',        href: null },
            ].map((action) => (
              <button
                key={action.id}
                id={action.id}
                onClick={() => action.href ? router.push(action.href) : alert(`"${action.label}" coming soon!`)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/30 bg-background/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground/80">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Role Change Dialog ── */}
      <Dialog open={!!roleDialogUser} onOpenChange={(open) => !open && setRoleDialogUser(null)}>
        {roleDialogUser && (
          <RoleDialog
            user={roleDialogUser}
            isSelf={roleDialogUser.id === currentUserId}
            onClose={() => setRoleDialogUser(null)}
            onConfirm={(newRole) => handleRoleChange(roleDialogUser, newRole)}
          />
        )}
      </Dialog>

      {/* ── Suspend / Reactivate Dialog ── */}
      <Dialog open={!!suspendDialogUser} onOpenChange={(open) => !open && setSuspendDialogUser(null)}>
        {suspendDialogUser && (
          <SuspendDialog
            user={suspendDialogUser}
            onClose={() => setSuspendDialogUser(null)}
            onConfirm={() => handleStatusToggle(suspendDialogUser)}
          />
        )}
      </Dialog>
    </div>
  );
}
