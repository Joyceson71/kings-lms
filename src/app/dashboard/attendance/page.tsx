'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { QrCode, Plus, Clock, CheckCircle, XCircle, BarChart2, Users, ScanLine } from 'lucide-react';

const isFaculty = true; // Mock — will be from Supabase user role

const historyRecords = [
  { course: 'CS-301', name: 'Data Structures', date: 'Jul 1, 2026', status: 'Present', pct: 94 },
  { course: 'CS-302', name: 'Database Systems', date: 'Jun 30, 2026', status: 'Present', pct: 88 },
  { course: 'ENG-101', name: 'Engineering Math', date: 'Jun 29, 2026', status: 'Absent', pct: 65 },
  { course: 'CS-301', name: 'Data Structures', date: 'Jun 28, 2026', status: 'Present', pct: 94 },
  { course: 'CS-303', name: 'Computer Networks', date: 'Jun 27, 2026', status: 'Late', pct: 72 },
];

const activeSessions = [
  { course: 'CS-301: Data Structures', started: '15 mins ago', room: 'Room 402', present: 32, total: 45 },
  { course: 'CS-302: Database Systems', started: '5 mins ago', room: 'Room 205', present: 18, total: 40 },
];

const overallStats = [
  { label: 'Sessions Attended', value: 42, color: 'emerald' as const },
  { label: 'Sessions Missed', value: 8, color: 'red' as const },
  { label: 'Late Arrivals', value: 3, color: 'gold' as const },
];

export default function AttendancePage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Attendance</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isFaculty ? 'Manage sessions and track student attendance.' : 'View your attendance history and scan QR codes.'}
          </p>
        </div>
        {isFaculty && (
          <Button
            id="new-session-btn"
            className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
          >
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            New Session
          </Button>
        )}
      </div>

      {/* Quick stats row */}
      {!isFaculty && (
        <div className="grid grid-cols-3 gap-4 animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
          {overallStats.map((stat) => (
            <TiltCard key={stat.label} intensity={10}>
              <div className="glass-card rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                <Progress value={stat.value * 2} variant={stat.color} size="sm" className="mt-3" />
              </div>
            </TiltCard>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Active sessions / QR scan */}
        <div className="space-y-4 animate-slide-in-up opacity-0" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>
          <TiltCard intensity={5} glareEffect={false}>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Active Sessions</h2>
                <Badge variant="active" dot>Live</Badge>
              </div>

              {isFaculty ? (
                <div className="space-y-4">
                  {activeSessions.map((session, i) => (
                    <div key={i} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-5 w-5 text-emerald-400 animate-status-pulse" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{session.course}</h3>
                            <p className="text-xs text-muted-foreground">Started {session.started} • {session.room}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl h-8 px-3 text-xs"
                        >
                          <QrCode className="mr-1.5 h-3.5 w-3.5" />
                          Show QR
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={(session.present / session.total) * 100} variant="emerald" size="sm" className="flex-1" />
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                            {session.present}<span className="text-muted-foreground">/{session.total}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Student: QR scan CTA */
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  {/* Animated scan ring */}
                  <div className="relative mb-6">
                    <div className="h-24 w-24 rounded-2xl border-2 border-primary/40 flex items-center justify-center bg-primary/5">
                      <QrCode className="h-12 w-12 text-primary" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-scan-ring" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-scan-ring delay-700 opacity-60" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Ready to Mark Attendance?
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mb-5">
                    Scan the QR code displayed by your professor to mark your attendance for the current session.
                  </p>
                  <Button
                    id="scan-qr-btn"
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all"
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scan QR Code
                  </Button>
                </div>
              )}
            </div>
          </TiltCard>
        </div>

        {/* Attendance history */}
        <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
          <TiltCard intensity={5} glareEffect={false}>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent History</h2>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" />
                  Full Report
                </Button>
              </div>

              <div className="space-y-2.5">
                {historyRecords.map((record, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-background/20 hover:bg-background/40 hover:border-border/60 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        record.status === 'Present' ? 'bg-emerald-500/10' :
                        record.status === 'Absent' ? 'bg-red-500/10' :
                        'bg-amber-500/10'
                      }`}>
                        {record.status === 'Present' ? (
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                        ) : record.status === 'Absent' ? (
                          <XCircle className="h-4.5 w-4.5 text-red-400" />
                        ) : (
                          <Clock className="h-4.5 w-4.5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{record.course}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{record.name}</p>
                        <p className="text-xs text-muted-foreground/70">{record.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar name={`${Math.round(record.pct)}%`} size="xs" className="text-[8px]" />
                      <Badge
                        variant={record.status === 'Present' ? 'success' : record.status === 'Absent' ? 'destructive' : 'warning'}
                        dot
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                id="view-history-btn"
                className="w-full mt-4 border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl"
              >
                View Full History
              </Button>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
