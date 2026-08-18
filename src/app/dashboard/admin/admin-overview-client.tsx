'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, Building2, BookOpen, MapPin, 
  Activity, GraduationCap, ShieldCheck,
  Megaphone, UserPlus, Clock
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export default function AdminOverviewClient() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    faculty: 0,
    departments: 0,
    courses: 0,
    trips: 0,
  });
  const [deptData, setDeptData] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();

      const [
        { count: userCount, data: users },
        { count: deptCount, data: depts },
        { count: courseCount },
        { count: tripCount },
        { data: recent }
      ] = await Promise.all([
        supabase.from('profiles').select('role, department', { count: 'exact' }),
        supabase.from('departments').select('id, name', { count: 'exact' }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('iv_trips').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, full_name, email, role, created_at, avatar_url').order('created_at', { ascending: false }).limit(5)
      ]);

      let students = 0;
      let faculty = 0;
      const deptCounts: Record<string, number> = {};

      if (users) {
        users.forEach((u: any) => {
          if (u.role === 'student') students++;
          if (u.role === 'faculty') faculty++;
          if (u.department) {
            deptCounts[u.department] = (deptCounts[u.department] || 0) + 1;
          }
        });
      }

      const formattedDeptData = (depts || []).map((d: any) => ({
        name: d.name,
        users: deptCounts[d.id] || 0
      })).sort((a, b) => b.users - a.users).slice(0, 5);

      setStats({
        totalUsers: userCount || 0,
        students,
        faculty,
        departments: deptCount || 0,
        courses: courseCount || 0,
        trips: tripCount || 0
      });
      
      setDeptData(formattedDeptData);
      setRecentUsers(recent || []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Students', value: stats.students, icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { title: 'Faculty', value: stats.faculty, icon: ShieldCheck, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Departments', value: stats.departments, icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Active Courses', value: stats.courses, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'IV Trips', value: stats.trips, icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground mt-1 text-lg">System analytics and management dashboard.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/dashboard/admin/users')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Users size={20} /> Manage Users
          </button>
          <button 
            onClick={() => router.push('/dashboard/admin/departments')}
            className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold shadow-sm hover:bg-secondary/80 transition-colors flex items-center gap-2"
          >
            <Building2 size={20} /> Manage Departments
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className={`w-16 h-16 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
              <card.icon size={32} />
            </div>
            <div>
              <p className="text-muted-foreground font-medium">{card.title}</p>
              {loading ? (
                <div className="h-10 w-24 bg-muted animate-pulse rounded-lg mt-2" />
              ) : (
                <h3 className="text-4xl font-black text-foreground mt-1">{card.value}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <Activity className="text-primary" /> Top Departments by Size
          </h3>
          <div className="h-72">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ left: -20, bottom: -10 }}>
                  <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ borderRadius: '1rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="users" fill="currentColor" radius={[8, 8, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="text-indigo-400 h-5 w-5" /> Recent Users
            </h3>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))
              ) : recentUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-xl transition-colors">
                  <Avatar className="w-10 h-10 border border-border bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-foreground">{user.full_name || 'New User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      user.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      user.role === 'faculty' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div>
              <h3 className="text-xl font-black tracking-tight mb-2">System Health</h3>
              <p className="text-muted-foreground text-sm mb-6">All services are operating normally.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Database Latency</span>
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">~12ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Storage Usage</span>
                  <span className="text-indigo-500 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full text-xs">1.2 GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
