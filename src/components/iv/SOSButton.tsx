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
      <div className="absolute bottom-24 right-4 z-[1000] flex flex-col items-end gap-2">
        <div className="bg-red-600 text-white p-3 rounded-lg shadow-lg animate-pulse flex items-center justify-center text-center">
          <p className="font-bold">SOS sent — help is coming</p>
        </div>
        {canCancel && (
          <button 
            onClick={cancelSOS}
            className="bg-black/80 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md"
          >
            Cancel SOS (30s)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="absolute bottom-24 right-4 z-[1000]">
      <button
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onContextMenu={(e) => e.preventDefault()}
        className="w-20 h-20 rounded-full bg-red-600 text-white font-bold shadow-xl border-4 border-white flex items-center justify-center relative overflow-hidden select-none active:scale-95 transition-transform"
      >
        <div 
          className="absolute bottom-0 left-0 right-0 bg-red-800 transition-all duration-75" 
          style={{ height: `${holdProgress}%` }}
        />
        <span className="relative z-10 text-xl">SOS</span>
      </button>
      {holding && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white px-3 py-1 rounded text-sm">
          Hold to send
        </div>
      )}
    </div>
  );
}
