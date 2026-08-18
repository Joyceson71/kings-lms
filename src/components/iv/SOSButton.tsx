'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SOSButtonProps {
  tripId: string;
  studentId: string;
}

export default function SOSButton({ tripId, studentId }: SOSButtonProps) {
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [activeSOS, setActiveSOS] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (holding) {
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setHoldProgress(Math.min((elapsed / 3000) * 100, 100));
      }, 50);

      holdTimerRef.current = setTimeout(() => {
        triggerSOS();
      }, 3000);
    } else {
      setHoldProgress(0);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding]);

  const triggerSOS = async () => {
    setHolding(false);
    setHoldProgress(0);
    
    if (!('geolocation' in navigator)) {
      toast.error('Location is required for SOS');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      
      const { data, error } = await supabase
        .from('iv_sos_events')
        .insert({
          iv_trip_id: tripId,
          student_id: studentId,
          lat,
          lng
        })
        .select()
        .single();
        
      if (error || !data) {
        toast.error('Failed to send SOS');
        setIsLocating(false);
        return;
      }
      
      setIsLocating(false);
      setActiveSOS(data.id);
      setCanCancel(true);
      setTimeout(() => setCanCancel(false), 30000);
      
      // Trigger push
      fetch('/api/iv/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iv_trip_id: tripId, lat, lng, student_id: studentId, sos_id: data.id })
      });
      
    }, () => {
      setIsLocating(false);
      toast.error('Could not get location');
    });
  };

  const cancelSOS = async () => {
    if (!activeSOS) return;
    await supabase.from('iv_sos_events').update({ resolved_at: new Date().toISOString() }).eq('id', activeSOS);
    setActiveSOS(null);
    setCanCancel(false);
    toast.success('SOS cancelled');
  };

  const [facultyPhone, setFacultyPhone] = useState<string | null>(null);

  useEffect(() => {
    if (activeSOS) {
      const getPhone = async () => {
        const { data: trip } = await supabase.from('iv_trips').select('created_by').eq('id', tripId).single();
        if (trip?.created_by) {
          const { data: profile } = await supabase.from('profiles').select('phone_number').eq('id', trip.created_by).single();
          if (profile?.phone_number) {
            setFacultyPhone(profile.phone_number);
          }
        }
      };
      getPhone();
    }
  }, [activeSOS, tripId, supabase]);

  if (activeSOS) {
    return (
      <div className="fixed inset-0 z-[5000] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-destructive/10 border border-destructive rounded-[2rem] p-8 text-center shadow-2xl animate-pulse">
          <h1 className="text-5xl font-black text-destructive tracking-tighter mb-4">SOS ACTIVE</h1>
          <p className="text-foreground font-medium text-lg mb-8">Emergency responders have been notified.</p>
          <div className="flex flex-col gap-4">
            <a 
              href={`tel:${facultyPhone || '911'}`}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              📞 CALL FACULTY
            </a>
            {canCancel && (
              <button 
                onClick={cancelSOS}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground px-8 py-4 rounded-2xl text-xl font-bold border border-border shadow-sm transition-colors"
              >
                CANCEL (30s)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-[1000]">
      <button
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onContextMenu={(e) => e.preventDefault()}
        className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-destructive text-destructive-foreground font-black shadow-lg border border-destructive/20 flex items-center justify-center relative overflow-hidden select-none hover:bg-destructive/90 active:scale-95 transition-all"
      >
        <div 
          className="absolute bottom-0 left-0 right-0 bg-black/20 transition-all duration-75" 
          style={{ height: `${holdProgress}%` }}
        />
        <span className="relative z-10 text-2xl md:text-3xl tracking-widest">{isLocating ? '...' : 'SOS'}</span>
      </button>
      {(holding || isLocating) && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-foreground text-background px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
          {isLocating ? 'LOCATING...' : 'HOLD TO SEND'}
        </div>
      )}
    </div>
  );
}
