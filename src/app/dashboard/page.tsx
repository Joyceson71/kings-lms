"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Clock, Activity } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const data = [
  { name: "Mon", attendance: 85, engagement: 70 },
  { name: "Tue", attendance: 88, engagement: 75 },
  { name: "Wed", attendance: 92, engagement: 82 },
  { name: "Thu", attendance: 90, engagement: 80 },
  { name: "Fri", attendance: 95, engagement: 88 },
  { name: "Sat", attendance: 40, engagement: 30 },
  { name: "Sun", attendance: 20, engagement: 10 },
];

const recentActivity = [
  { user: "Alice Johnson", action: "Submitted Assignment", time: "2 mins ago", avatar: "AJ" },
  { user: "Bob Smith", action: "Joined Community Chat", time: "15 mins ago", avatar: "BS" },
  { user: "Dr. Evans", action: "Uploaded Data Structures Notes", time: "1 hour ago", avatar: "DE" },
  { user: "Charlie Davis", action: "Completed Quiz", time: "3 hours ago", avatar: "CD" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Welcome back, Admin!</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening at Kings Engineering College today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass-panel hover:bg-white/10 rounded-xl">Generate Report</Button>
          <Button className="rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.5)]">Start QR Session</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Students", value: "3,245", icon: Users, trend: "+12%" },
          { title: "Active Courses", value: "124", icon: BookOpen, trend: "+4%" },
          { title: "Avg. Attendance", value: "88%", icon: Clock, trend: "+2%" },
          { title: "System Status", value: "Optimal", icon: Activity, trend: "99.9% Uptime" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="glass-card border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-primary mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 glass-panel border-none">
          <CardHeader>
            <CardTitle>Attendance & Engagement</CardTitle>
            <CardDescription>Weekly overview of student participation metrics.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}%`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="attendance" stroke="oklch(0.65 0.15 260)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="engagement" stroke="oklch(0.85 0.15 180)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 glass-panel border-none">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarFallback className="bg-primary/20 text-primary">{activity.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 overflow-hidden">
                    <p className="text-sm font-medium leading-none truncate">{activity.user}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.action}</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-none">
        <CardHeader>
          <CardTitle>Ongoing Classes</CardTitle>
          <CardDescription>Live sessions currently taking place.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>Course</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Room / Link</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { course: "CS-301 Data Structures", instructor: "Dr. Evans", room: "Room 402", count: "45/60" },
                { course: "ME-204 Thermodynamics", instructor: "Prof. Miller", room: "Lab A", count: "38/40" },
                { course: "EC-405 Signal Processing", instructor: "Dr. Huang", room: "Online", count: "112/120" },
              ].map((row, i) => (
                <TableRow key={i} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{row.course}</TableCell>
                  <TableCell>{row.instructor}</TableCell>
                  <TableCell>{row.room}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      {row.count}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
