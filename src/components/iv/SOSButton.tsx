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
        return;
      }
      
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

  if (activeSOS) {
    return (
      <div className="fixed inset-0 z-[5000] bg-red-950/80 backdrop-blur-3xl flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-red-600/20 border-2 border-red-500 rounded-[3rem] p-12 text-center shadow-[0_0_100px_rgba(239,68,68,0.8)] animate-pulse">
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">SOS ACTIVE</h1>
          <p className="text-red-200 font-bold text-xl mb-12">Emergency responders have been notified.</p>
          {canCancel && (
            <button 
              onClick={cancelSOS}
              className="w-full bg-black/50 hover:bg-black text-white px-8 py-6 rounded-3xl text-2xl font-black border border-red-500/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-colors"
            >
              CANCEL (30s)
            </button>
          )}
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
        className="w-24 h-24 rounded-[2rem] bg-gradient-to-b from-red-500 to-red-700 text-white font-black shadow-[0_0_40px_rgba(239,68,68,0.8)] border-4 border-red-300 flex items-center justify-center relative overflow-hidden select-none hover:scale-105 active:scale-95 transition-transform"
      >
        <div 
          className="absolute bottom-0 left-0 right-0 bg-red-950 transition-all duration-75" 
          style={{ height: `${holdProgress}%` }}
        />
        <span className="relative z-10 text-3xl tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">SOS</span>
      </button>
      {holding && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md text-white px-6 py-2 rounded-2xl text-sm font-bold border border-white/20 shadow-xl">
          HOLD TO SEND
        </div>
      )}
    </div>
  );
}
