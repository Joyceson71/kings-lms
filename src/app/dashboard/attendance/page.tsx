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
          <h1 className="text-2xl font-bold tracking-tight text-white">Attendance</h1>
          <p className="text-zinc-400">Manage and track student attendance.</p>
        </div>
        
        {isFaculty && (
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Active Sessions</CardTitle>
            <CardDescription className="text-zinc-400">
              Classes currently running
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFaculty ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">CS-301: Data Structures</h3>
                      <p className="text-xs text-zinc-400">Started 15 mins ago • Room 402</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <QrCode className="mr-2 h-4 w-4" />
                    Show QR
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%]" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400">32/45 Present</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-zinc-800 rounded-lg">
                <QrCode className="h-10 w-10 text-zinc-600 mb-3" />
                <h3 className="text-lg font-medium text-white">Ready to mark attendance?</h3>
                <p className="text-sm text-zinc-400 max-w-sm mt-1 mb-4">
                  Scan the QR code displayed by your professor to mark your attendance for the current session.
                </p>
                <Button className="bg-indigo-600 hover:bg-indigo-700">Scan QR Code</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Recent History</CardTitle>
            <CardDescription className="text-zinc-400">
              Your attendance records from past sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { course: 'CS-301', date: 'Oct 24, 2023', status: 'Present', color: 'text-emerald-400' },
                { course: 'CS-302', date: 'Oct 23, 2023', status: 'Present', color: 'text-emerald-400' },
                { course: 'ENG-101', date: 'Oct 22, 2023', status: 'Absent', color: 'text-red-400' },
                { course: 'CS-301', date: 'Oct 20, 2023', status: 'Present', color: 'text-emerald-400' },
              ].map((record, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-5 w-5 ${record.color}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{record.course}</p>
                      <p className="text-xs text-zinc-500">{record.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${record.color}`}>{record.status}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              View Full History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
