import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, CheckCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { name: 'Total Students', value: '1,024', icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Active Courses', value: '42', icon: BookOpen, change: '+4%', changeType: 'positive' },
    { name: 'Avg. Attendance', value: '89%', icon: CheckCircle, change: '+2.1%', changeType: 'positive' },
    { name: 'Live Sessions', value: '8', icon: Clock, change: 'Running now', changeType: 'neutral' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-zinc-400">Welcome back. Here is what&apos;s happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className={`text-xs mt-1 ${stat.changeType === 'positive' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Recent Attendance</CardTitle>
            <CardDescription className="text-zinc-400">
              Attendance records from the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center border-t border-zinc-800/50">
            <p className="text-zinc-500 text-sm">Chart will be rendered here (Recharts)</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Upcoming Sessions</CardTitle>
            <CardDescription className="text-zinc-400">
              Classes scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-zinc-800/50 pt-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Advanced Data Structures</p>
                    <p className="text-xs text-zinc-400">CS-301 • Dr. Smith</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">10:00 AM</p>
                    <p className="text-xs text-zinc-500">Room 402</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
