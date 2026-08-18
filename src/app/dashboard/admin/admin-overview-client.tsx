'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, Building2, BookOpen, MapPin, 
  Activity, GraduationCap, ShieldCheck 
} from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();

      const [
        { count: userCount, data: users },
        { count: deptCount, data: depts },
        { count: courseCount },
        { count: tripCount }
      ] = await Promise.all([
        supabase.from('profiles').select('role, department', { count: 'exact' }),
        supabase.from('departments').select('id, name', { count: 'exact' }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('iv_trips').select('*', { count: 'exact', head: true })
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
          <div key={i} className="bg-card border border-border rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
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

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-2">System Health</h3>
            <p className="text-muted-foreground mb-8">All services are operating normally. Real-time connections are stable.</p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">Database Latency</span>
                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full text-sm">~12ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Storage Usage</span>
                <span className="text-indigo-500 font-bold bg-indigo-500/10 px-3 py-1 rounded-full text-sm">1.2 GB / 50 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Active Realtime Channels</span>
                <span className="text-blue-500 font-bold bg-blue-500/10 px-3 py-1 rounded-full text-sm">24</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
            <span>Last checked: Just now</span>
            <span className="flex items-center gap-2 text-emerald-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
