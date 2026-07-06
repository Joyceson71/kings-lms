'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/lib/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { QrCode, Plus, Clock, CheckCircle, XCircle, BarChart2, Users, ScanLine, Loader2 } from 'lucide-react';
import { QRDisplayModal } from '@/components/attendance/qr-display';
import { QRScannerModal } from '@/components/attendance/qr-scanner';
import confetti from 'canvas-confetti';

function AttendanceContent() {
  const { isFaculty, isStudent, profile, loading: userLoading } = useUser();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const qrTokenFromUrl = searchParams.get('token');
  
  // Data State
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({ attended: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isQRDisplayOpen, setIsQRDisplayOpen] = useState(false);
  const [selectedQRToken, setSelectedQRToken] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    if (!userLoading && profile?.id) {
      fetchData();
      
      if (qrTokenFromUrl && isStudent) {
        // Automatically try to mark attendance if a token is in URL
        handleScanSuccess(qrTokenFromUrl);
      }
    }
  }, [userLoading, profile?.id, isStudent, qrTokenFromUrl]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isFaculty) {
        // Faculty: Get courses they teach
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title, code')
          .eq('created_by', profile?.id);
        
        if (coursesData) setMyCourses(coursesData);

        // Faculty: Get their active sessions
        const { data: sessionsData } = await supabase
          .from('course_sessions')
          .select('*, courses(title, code), attendance_logs(id)')
          .eq('created_by', profile?.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (sessionsData) setActiveSessions(sessionsData);

        // Faculty: Recent history
        const { data: historyData } = await supabase
          .from('attendance_logs')
          .select('*, profiles(full_name), course_sessions(courses(title, code))')
          .order('marked_at', { ascending: false })
          .limit(10);
        
        if (historyData) setHistoryRecords(historyData);
        
      } else if (isStudent) {
        // Student: Get active sessions for enrolled courses
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', profile?.id);
          
        const courseIds = enrollments?.map(e => e.course_id) || [];
        
        if (courseIds.length > 0) {
          const { data: sessionsData } = await supabase
            .from('course_sessions')
            .select('*, courses(title, code)')
            .in('course_id', courseIds)
            .eq('status', 'active');
            
          if (sessionsData) setActiveSessions(sessionsData);
        }

        // Student: Get own history
        const { data: historyData } = await supabase
          .from('attendance_logs')
          .select('*, course_sessions(courses(title, code))')
          .eq('student_id', profile?.id)
          .order('marked_at', { ascending: false });
          
        if (historyData) {
          setHistoryRecords(historyData);
          const attendedCount = historyData.filter(h => h.status === 'Present').length;
          // Just mock total for now until we have session totals
          setStats({ attended: attendedCount, total: attendedCount + 2 }); 
        }
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (myCourses.length === 0) return alert('You must create a course first.');
    
    setIsCreatingSession(true);
    try {
      const courseId = myCourses[0].id; // For simplicity, picking first course
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase
        .from('course_sessions')
        .insert({
          course_id: courseId,
          created_by: profile?.id,
          room: 'Main Hall',
          qr_token: token
        })
        .select('*, courses(title, code)')
        .single();
        
      if (error) throw error;
      
      if (data) {
        setActiveSessions([data, ...activeSessions]);
        // Open QR directly
        setSelectedQRToken(data.qr_token);
        setSelectedCourseName(data.courses?.title || 'Unknown Course');
        setIsQRDisplayOpen(true);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    setIsProcessingScan(true);
    setScanError(null);
    setScanSuccess(null);

    try {
      // Decode URL if scanned from full QR
      let token = decodedText;
      if (decodedText.includes('token=')) {
        token = new URL(decodedText).searchParams.get('token') || decodedText;
      }

      // Find the session with this token
      const { data: sessionData, error: sessionError } = await supabase
        .from('course_sessions')
        .select('id, course_id, status, courses(title)')
        .eq('qr_token', token)
        .single();

      if (sessionError || !sessionData) {
        throw new Error('Invalid or expired QR code.');
      }

      if (sessionData.status !== 'active') {
        throw new Error('This session has already ended.');
      }

      // Check if already enrolled in this course
      const { data: enrollmentData } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', sessionData.course_id)
        .eq('student_id', profile?.id)
        .single();

      if (!enrollmentData) {
        // Auto-enroll for demo purposes
        await supabase.from('course_enrollments').insert({
          course_id: sessionData.course_id,
          student_id: profile?.id
        });
      }

      // Mark attendance
      const { error: logError } = await supabase
        .from('attendance_logs')
        .insert({
          session_id: sessionData.id,
          student_id: profile?.id,
          status: 'Present'
        });

      if (logError) {
        if (logError.code === '23505') {
          throw new Error('You have already marked attendance for this session.');
        }
        throw logError;
      }

      setScanSuccess(`Marked present for ${(sessionData.courses as any)?.title}`);
      
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#3ecf8e']
      });

      // Refresh data
      fetchData();

    } catch (error: any) {
      console.error('Scanning error:', error);
      setScanError(error.message || 'Failed to mark attendance.');
    } finally {
      setIsProcessingScan(false);
    }
  };

  const openQRScanner = () => {
    setScanError(null);
    setScanSuccess(null);
    setIsScannerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Attendance</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isFaculty ? 'Manage sessions and generate QR codes.' : 'View your attendance history and scan QR codes.'}
          </p>
        </div>
        {isFaculty && (
          <Button
            id="new-session-btn"
            onClick={handleCreateSession}
            disabled={isCreatingSession}
            className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
          >
            {isCreatingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />}
            New Session
          </Button>
        )}
      </div>

      {/* Quick stats row (students only) */}
      {isStudent && (
        <div className="grid grid-cols-3 gap-4 animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
          <TiltCard intensity={10}>
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.attended}</p>
              <p className="text-xs text-muted-foreground mt-1">Sessions Attended</p>
              <Progress value={stats.attended > 0 ? (stats.attended / stats.total) * 100 : 0} variant="emerald" size="sm" className="mt-3" />
            </div>
          </TiltCard>
          <TiltCard intensity={10}>
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{Math.max(0, stats.total - stats.attended)}</p>
              <p className="text-xs text-muted-foreground mt-1">Sessions Missed</p>
              <Progress value={0} variant="red" size="sm" className="mt-3" />
            </div>
          </TiltCard>
          <TiltCard intensity={10}>
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{Math.round(stats.attended > 0 ? (stats.attended / stats.total) * 100 : 0)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Overall Rate</p>
              <Progress value={stats.attended > 0 ? (stats.attended / stats.total) * 100 : 0} variant="gold" size="sm" className="mt-3" />
            </div>
          </TiltCard>
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
                  {activeSessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active sessions. Create one above.</p>
                  )}
                  {activeSessions.map((session, i) => {
                    const presentCount = session.attendance_logs?.length || 0;
                    return (
                      <div key={session.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-5 w-5 text-emerald-400 animate-status-pulse" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">{session.courses?.code}: {session.courses?.title}</h3>
                              <p className="text-xs text-muted-foreground">Started {new Date(session.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {session.room}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQRToken(session.qr_token);
                              setSelectedCourseName(session.courses?.title || '');
                              setIsQRDisplayOpen(true);
                            }}
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl h-8 px-3 text-xs flex-shrink-0 ml-2"
                          >
                            <QrCode className="mr-1.5 h-3.5 w-3.5" />
                            Show QR
                          </Button>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <Progress value={Math.min((presentCount / 30) * 100, 100)} variant="emerald" size="sm" className="flex-1" />
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                              {presentCount} checked in
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                    onClick={openQRScanner}
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
                {historyRecords.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent attendance records.</p>
                )}
                {historyRecords.map((record, i) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-background/20 hover:bg-background/40 hover:border-border/60 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        record.status === 'Present' ? 'bg-emerald-500/10' :
                        record.status === 'Absent' ? 'bg-red-500/10' :
                        'bg-amber-500/10'
                      }`}>
                        {record.status === 'Present' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : record.status === 'Absent' ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{record.course_sessions?.courses?.code}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{isFaculty ? record.profiles?.full_name : record.course_sessions?.courses?.title}</p>
                        <p className="text-xs text-muted-foreground/70">{new Date(record.marked_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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

      <QRDisplayModal 
        isOpen={isQRDisplayOpen} 
        onClose={() => setIsQRDisplayOpen(false)} 
        token={selectedQRToken}
        courseName={selectedCourseName}
      />
      
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        isProcessing={isProcessingScan}
        scanError={scanError}
        scanSuccess={scanSuccess}
      />
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8"/></div>}>
      <AttendanceContent />
    </Suspense>
  );
}
