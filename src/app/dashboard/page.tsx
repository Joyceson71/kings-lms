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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back. Here is what&apos;s happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className={`text-xs mt-1 ${stat.changeType === 'positive' ? 'text-emerald-500' : 'text-muted-foreground/70'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Attendance</CardTitle>
            <CardDescription className="text-muted-foreground">
              Attendance records from the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center border-t border-border/50">
            <p className="text-muted-foreground/70 text-sm">Chart will be rendered here (Recharts)</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Upcoming Sessions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Classes scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-border/50 pt-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Advanced Data Structures</p>
                    <p className="text-xs text-muted-foreground">CS-301 • Dr. Smith</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">10:00 AM</p>
                    <p className="text-xs text-muted-foreground/70">Room 402</p>
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
