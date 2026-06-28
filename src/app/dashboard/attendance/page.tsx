'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Plus, CheckCircle, Clock } from 'lucide-react';

export default function AttendancePage() {
  const isFaculty = true; // Mocking role for now

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Manage and track student attendance.</p>
        </div>
        
        {isFaculty && (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Active Sessions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Classes currently running
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFaculty ? (
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-500 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">CS-301: Data Structures</h3>
                      <p className="text-xs text-muted-foreground">Started 15 mins ago • Room 402</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-border text-foreground hover:bg-secondary hover:text-foreground">
                    <QrCode className="mr-2 h-4 w-4" />
                    Show QR
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%]" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">32/45 Present</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg">
                <QrCode className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground">Ready to mark attendance?</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                  Scan the QR code displayed by your professor to mark your attendance for the current session.
                </p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Scan QR Code</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Recent History</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your attendance records from past sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { course: 'CS-301', date: 'Oct 24, 2023', status: 'Present', color: 'text-emerald-500' },
                { course: 'CS-302', date: 'Oct 23, 2023', status: 'Present', color: 'text-emerald-500' },
                { course: 'ENG-101', date: 'Oct 22, 2023', status: 'Absent', color: 'text-destructive' },
                { course: 'CS-301', date: 'Oct 20, 2023', status: 'Present', color: 'text-emerald-500' },
              ].map((record, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-5 w-5 ${record.color}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{record.course}</p>
                      <p className="text-xs text-muted-foreground/70">{record.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${record.color}`}>{record.status}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 border-border text-muted-foreground hover:bg-secondary hover:text-foreground">
              View Full History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
