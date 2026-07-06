'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { markAttendance } from '@/lib/supabase/queries';
import { TiltCard } from '@/components/ui/tilt-card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

function AttendClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your attendance...');
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('Invalid QR code. No session ID found.');
      return;
    }

    processAttendance(sessionId);
  }, [sessionId]);

  const processAttendance = async (sid: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login but remember where to return
        router.push(`/login?redirectTo=/attend?session=${sid}`);
        return;
      }

      // 1. Get session details
      const { data: session, error: sessionError } = await supabase
        .from('course_sessions')
        .select('*, courses(title)')
        .eq('qr_token', sid)
        .maybeSingle();

      if (sessionError || !session) {
        throw new Error('Invalid or expired attendance session.');
      }
      
      if (session.status !== 'active') {
        throw new Error('This attendance session is closed.');
      }

      setCourseName(session.courses?.title || 'Course');

      // 2. Mark attendance via queries using the real session ID
      const { success, error: markError } = await markAttendance(supabase, session.id, user.id);

      if (!success) {
        if (markError?.includes('duplicate key') || markError?.includes('23505')) {
          throw new Error('You have already marked your attendance for this session.');
        }
        throw new Error(markError || 'Failed to mark attendance.');
      }

      // Success
      setStatus('success');
      setMessage(`Successfully marked present for ${session.courses?.title || 'the course'}.`);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#3ecf8e']
      });

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />

      <TiltCard intensity={10}>
        <div className="glass-card rounded-3xl p-8 max-w-md w-full relative z-10 flex flex-col items-center text-center">
          {status === 'loading' && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Please wait</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 animate-in zoom-in">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black mb-2 text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Attendance Recorded!</h2>
              <p className="text-emerald-400 text-sm font-medium mb-8">{message}</p>
              
              <Button 
                onClick={() => router.push('/dashboard/attendance')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 animate-in zoom-in">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-black mb-2 text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Scan Failed</h2>
              <p className="text-red-400 text-sm font-medium mb-8">{message}</p>
              
              <Button 
                onClick={() => router.push('/dashboard/attendance')}
                variant="outline"
                className="w-full border-border/40 hover:bg-secondary/40 text-foreground font-bold h-12 rounded-xl"
              >
                Return to Dashboard
              </Button>
            </>
          )}
        </div>
      </TiltCard>
    </div>
  );
}

export default function AttendPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AttendClient />
    </Suspense>
  );
}
