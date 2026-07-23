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
  Database, BookOpen, Activity,
  Search, Users, GraduationCap, Shield, UserX, UserCircle2,
  Loader2, Download, ListChecks, Megaphone, X,
  CalendarDays, Building2, Mail, Hash, Zap, ClipboardCheck,
  BarChart2,
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
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

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
  joinedRaw: string;
  department: string | null;
  college: string | null;
}

export interface ActivityItem {
  id: string;
  type: 'user' | 'course' | 'system';
  message: string;
  time: string;
}

interface DeptBreakpoint {
  dept: string;
  students: number;
  faculty: number;
  total: number;
}

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

// ─── NEW: User Detail Drawer ───────────────────────────────────────────────────

function UserDetailDrawer({ user, onClose, isSelf, onChangeRole, onToggleStatus }: {
  user: FormattedUser;
  onClose: () => void;
  isSelf: boolean;
  onChangeRole: () => void;
  onToggleStatus: () => void;
}) {
  const roleColor =
    user.role === 'admin'   ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    user.role === 'faculty' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' :
                              'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-80 flex flex-col shadow-2xl animate-slide-in-right"
      style={{ background: 'rgba(8,8,24,0.98)', borderLeft: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <span className="text-[13px] font-bold text-white">User Profile</span>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center py-2">
          <Avatar
            name={user.name}
            size="xl"
            className="h-20 w-20 text-2xl mb-3"
            ring={user.role === 'admin' ? 'gold' : user.role === 'faculty' ? 'violet' : 'none'}
          />
          <p className="text-lg font-bold text-white leading-tight">{user.name}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{user.email}</p>
          {isSelf && <span className="mt-1 text-[11px] text-amber-400 font-semibold">(you)</span>}
          <div className={`mt-2 px-3 py-1 rounded-full border text-[11px] font-semibold ${roleColor}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </div>
        </div>

        {/* Detail rows */}
        <div className="space-y-3">
          {[
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Building2, label: 'Department', value: user.department || '—' },
            { icon: Hash, label: 'College', value: user.college || '—' },
            { icon: CalendarDays, label: 'Joined', value: user.joined },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Icon className="h-3.5 w-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">{label}</p>
                <p className="text-[13px] text-slate-200 font-medium mt-0.5 break-all">{value}</p>
              </div>
            </div>
          ))}

          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[12px] font-semibold text-slate-300">
                {user.status === 'active' ? 'Active Account' : 'Suspended'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2 border-t border-white/5">
        <button
          onClick={() => { onClose(); onChangeRole(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-indigo-300 transition-all duration-200 hover:brightness-110"
          style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}
        >
          <Shield className="h-3.5 w-3.5" />
          Change Role
        </button>
        {!isSelf && (
          <button
            onClick={() => { onClose(); onToggleStatus(); }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:brightness-110 ${
              user.status === 'active'
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}
            style={{
              background: user.status === 'active' ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
              border: user.status === 'active' ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(52,211,153,0.2)',
            }}
          >
            <UserX className="h-3.5 w-3.5" />
            {user.status === 'active' ? 'Suspend User' : 'Reactivate User'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── NEW: Broadcast Announcement ─────────────────────────────────────────────

function BroadcastPanel({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSend() {
    if (!title.trim() || !content.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('sent');
      setTimeout(() => {
        setTitle('');
        setContent('');
        setStatus('idle');
        onClose();
      }, 1800);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-96 flex flex-col shadow-2xl animate-slide-in-right"
      style={{ background: 'rgba(8,8,24,0.98)', borderLeft: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-amber-400" />
          <span className="text-[13px] font-bold text-white">Broadcast Announcement</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 p-5 space-y-4">
        <div
          className="p-3 rounded-xl text-[11px] text-amber-400 font-medium"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}
        >
          📢 This will create a global announcement visible to <strong>all users</strong> on the platform.
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Campus closed on Friday"
            maxLength={120}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <p className="text-[10px] text-slate-600 text-right">{title.length}/120</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Message</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your announcement here…"
            rows={6}
            maxLength={1000}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white placeholder:text-slate-600 outline-none resize-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <p className="text-[10px] text-slate-600 text-right">{content.length}/1000</p>
        </div>

        {status === 'sent' && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-[12px] text-emerald-400 font-semibold" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            ✓ Announcement broadcast successfully!
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-[12px] text-red-400 font-semibold" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            ✗ Failed to send. Please try again.
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleSend}
          disabled={!title.trim() || !content.trim() || status === 'sending' || status === 'sent'}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#04040c' }}
        >
          {status === 'sending'
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            : status === 'sent'
            ? '✓ Sent!'
            : <><Megaphone className="h-4 w-4" /> Broadcast to All Users</>}
        </button>
      </div>
    </div>
  );
}

// ─── NEW: Department Breakdown Chart ─────────────────────────────────────────

function DeptChart({ data }: { data: DeptBreakpoint[] }) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BarChart2 className="h-8 w-8 text-slate-600/50 mb-2" />
        <p className="text-[12px] text-slate-500">No department data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="dept"
          tick={{ fontSize: 9, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ background: '#0c0c20', border: '1px solid #1a1a2e', borderRadius: '10px', fontSize: '11px', color: '#e8eaf6' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="students" name="Students" stackId="a" fill="#818cf8" radius={[0, 0, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill="#818cf8" fillOpacity={0.85} />)}
        </Bar>
        <Bar dataKey="faculty" name="Faculty" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill="#a78bfa" fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminUsersClient({
  initialUsers,
  currentUserId,
  recentActivity = [],
  systemStats = { courses: 0, sessions: 0, enrollments: 0, departments: 0 },
  healthMetrics = { todaySessions: 0, pendingGrading: 0, totalEnrollments: 0 },
  departmentBreakdown = [],
}: {
  initialUsers: RawUser[];
  currentUserId: string;
  recentActivity?: ActivityItem[];
  systemStats?: { courses: number; sessions: number; enrollments: number; departments: number };
  healthMetrics?: { todaySessions: number; pendingGrading: number; totalEnrollments: number };
  departmentBreakdown?: DeptBreakpoint[];
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
      joinedRaw: u.created_at,
      department: u.department ?? null,
      college: u.college ?? null,
    }))
  );

  // ── Dialog / drawer state ──
  const [roleDialogUser, setRoleDialogUser] = useState<FormattedUser | null>(null);
  const [suspendDialogUser, setSuspendDialogUser] = useState<FormattedUser | null>(null);
  const [detailUser, setDetailUser] = useState<FormattedUser | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);

  // ── Selection state ──
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkSuspending, setIsBulkSuspending] = useState(false);

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
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );
    try {
      await patchUser(user.id, { role: newRole });
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: user.role } : u))
      );
      console.error('Role change failed:', err);
    }
  }

  async function handleStatusToggle(user: FormattedUser) {
    const newStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    try {
      await patchUser(user.id, { status: newStatus });
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u))
      );
      console.error('Status change failed:', err);
    }
  }

  // ── Bulk Actions & Export ──
  function exportCSV() {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined', 'Department', 'College'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(u =>
        `"${u.name}","${u.email}","${u.role}","${u.status}","${u.joined}","${u.department || ''}","${u.college || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kings-lms-users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function toggleSelection(id: string) {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  }

  function toggleAll() {
    if (selectedUsers.size === filtered.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filtered.map(u => u.id)));
    }
  }

  async function handleBulkStatusToggle(targetStatus: UserStatus) {
    setIsBulkSuspending(true);
    try {
      const ids = Array.from(selectedUsers);
      await Promise.all(ids.map(id => patchUser(id, { status: targetStatus })));
      setUsers(prev => prev.map(u =>
        selectedUsers.has(u.id) ? { ...u, status: targetStatus } : u
      ));
      setSelectedUsers(new Set());
    } catch (err) {
      console.error('Bulk status change failed:', err);
      alert('Some updates failed. Please refresh and try again.');
    } finally {
      setIsBulkSuspending(false);
    }
  }

  // ── Derived stats ──
  const stats = useMemo(() => ({
    total:     users.length,
    students:  users.filter((u) => u.role === 'student').length,
    faculty:   users.filter((u) => u.role === 'faculty').length,
    admins:    users.filter((u) => u.role === 'admin').length,
    active:    users.filter((u) => u.status === 'active').length,
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
    <div className="space-y-6">

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
          {/* Broadcast Button */}
          <button
            onClick={() => { setShowBroadcast(true); setDetailUser(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all duration-200 hover:brightness-110"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
            title="Broadcast a global announcement"
          >
            <Megaphone className="h-3.5 w-3.5" />
            Broadcast
          </button>
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

      {/* ── Platform Health Bar ── */}
      <div
        className="grid grid-cols-3 gap-3 animate-slide-in-up opacity-0"
        style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}
      >
        {[
          { label: 'Sessions Today', value: healthMetrics.todaySessions, icon: Zap, color: 'text-emerald-400', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
          { label: 'Pending Grading', value: healthMetrics.pendingGrading, icon: ClipboardCheck, color: 'text-amber-400', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
          { label: 'Total Enrollments', value: healthMetrics.totalEnrollments, icon: GraduationCap, color: 'text-indigo-400', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-xl font-black text-white leading-none">{value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Live Stat Cards ── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-in-up opacity-0"
        style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}
      >
        {statCards.map((card) => (
          <div key={card.label} className="bg-[#111113]/80 backdrop-blur-xl border border-[#1f1f23] hover:border-white/10 hover:bg-[#151518]/90 transition-all duration-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md">
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
          style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}
        >
          <div className="bg-[#111113]/80 backdrop-blur-xl border border-[#1f1f23] rounded-2xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f23] gap-3 flex-wrap">
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
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-border/30 bg-secondary/10 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1 max-w-[240px]">
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

              <div className="flex items-center gap-2">
                {selectedUsers.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap bg-secondary hover:bg-secondary/80 h-8 rounded-lg border border-border/40 text-xs px-3">
                      {isBulkSuspending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <ListChecks className="h-3.5 w-3.5 mr-1.5" />}
                      Bulk Actions ({selectedUsers.size})
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => handleBulkStatusToggle('suspended')} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <UserX className="h-3.5 w-3.5 mr-2" />
                        Suspend Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusToggle('active')} className="text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10">
                        <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                        Reactivate Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button onClick={exportCSV} variant="outline" size="sm" className="h-8 rounded-lg border border-border/40 text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-5 py-3 bg-secondary/10 border-b border-border/20 items-center">
              <input
                type="checkbox"
                checked={selectedUsers.size > 0 && selectedUsers.size === filtered.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-border/50 bg-background/50 accent-primary"
              />
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
                    className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-5 py-3.5 items-center transition-colors animate-fade-in opacity-0 cursor-pointer ${
                      user.status === 'suspended' ? 'bg-red-500/3 hover:bg-red-500/5' :
                      selectedUsers.has(user.id) ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/15'
                    }`}
                    style={{ animationDelay: `${240 + i * 35}ms`, animationFillMode: 'forwards' }}
                    onClick={() => { setDetailUser(user); setShowBroadcast(false); }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleSelection(user.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 rounded border-border/50 bg-background/50 accent-primary"
                    />
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
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Actions
                        </div>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setDetailUser(user); setShowBroadcast(false); }}
                        >
                          <UserCircle2 className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          id={`admin-change-role-${user.id}`}
                          onClick={(e) => { e.stopPropagation(); setRoleDialogUser(user); }}
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
                          onClick={(e) => { e.stopPropagation(); setSuspendDialogUser(user); }}
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
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          {/* Department Breakdown Chart */}
          <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Dept. Breakdown</h2>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-indigo-400" />Students</div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-violet-400" />Faculty</div>
              </div>
            </div>
            <DeptChart data={departmentBreakdown} />
          </div>

          {/* System Overview */}
          <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">System Overview</h2>
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-status-pulse shadow-[0_0_8px_oklch(0.7_0.2_165/0.8)]" />
            </div>
            <div className="space-y-4">
              {[
                { name: 'Total Courses', value: systemStats.courses, icon: BookOpen, color: 'text-indigo-400', progressColor: 'default' as any },
                { name: 'Active Sessions', value: systemStats.sessions, icon: Activity, color: 'text-emerald-400', progressColor: 'emerald' as any },
                { name: 'Enrollments', value: systemStats.enrollments, icon: Users, color: 'text-sky-400', progressColor: 'default' as any },
                { name: 'Departments', value: systemStats.departments, icon: Database, color: 'text-amber-400', progressColor: 'gold' as any },
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                  </div>
                  <Progress value={Math.min(item.value * 5, 100)} variant={item.progressColor} size="sm" />
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium">✓ Metrics updated live</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Real-time data from database</p>
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
        style={{ animationDelay: '560ms', animationFillMode: 'forwards' }}
      >
        <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Add Course',    icon: BookOpen,    id: 'admin-add-course',    href: '/dashboard/courses' },
              { label: 'Broadcast',     icon: Megaphone,   id: 'admin-broadcast',     href: null, action: () => { setShowBroadcast(true); setDetailUser(null); } },
              { label: 'View Reports',  icon: Activity,    id: 'admin-view-reports',  href: '/dashboard/reports' },
              { label: 'Departments',   icon: Building2,   id: 'admin-departments',   href: '/dashboard/admin/departments' },
            ].map((action) => (
              <button
                key={action.id}
                id={action.id}
                onClick={() => {
                  if (action.action) action.action();
                  else if (action.href) router.push(action.href);
                }}
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

      {/* ── User Detail Drawer (slide-in) ── */}
      {detailUser && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailUser(null)}
          />
          <UserDetailDrawer
            user={detailUser}
            onClose={() => setDetailUser(null)}
            isSelf={detailUser.id === currentUserId}
            onChangeRole={() => setRoleDialogUser(detailUser)}
            onToggleStatus={() => setSuspendDialogUser(detailUser)}
          />
        </>
      )}

      {/* ── Broadcast Announcement Drawer ── */}
      {showBroadcast && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowBroadcast(false)}
          />
          <BroadcastPanel onClose={() => setShowBroadcast(false)} />
        </>
      )}
    </div>
  );
}
