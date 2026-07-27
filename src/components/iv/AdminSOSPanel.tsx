'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminSOSPanel({ tripId, currentUserId }: { tripId: string, currentUserId: string }) {
  const [activeSOS, setActiveSOS] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const supabase = createClient();
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      
      osc.start();
      setTimeout(() => osc.stop(), 200);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        gain2.gain.setValueAtTime(0.1, ctx.currentTime);
        osc2.start();
        setTimeout(() => osc2.stop(), 200);
      }, 300);
    } catch (_) {}
  };

  const fetchSOS = async () => {
    const { data } = await supabase
      .from('iv_sos_events')
      .select('*, profiles(full_name, emergency_contact)')
      .eq('iv_trip_id', tripId)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });
      
    if (data) {
      if (activeSOS.length === 0 && data.length > 0) {
        playBeep();
      }
      setActiveSOS(data);
    }
  };

  useEffect(() => {
    fetchSOS();
    const channel = supabase.channel(`sos-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_sos_events', filter: `iv_trip_id=eq.${tripId}` }, () => {
        fetchSOS();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const handleAck = async (id: string) => {
    await supabase.from('iv_sos_events').update({
      acknowledged_by: currentUserId,
      acknowledged_at: new Date().toISOString()
    }).eq('id', id);
    toast.success('SOS Acknowledged');
  };

  const handleResolve = async (id: string) => {
    await supabase.from('iv_sos_events').update({
      resolved_at: new Date().toISOString()
    }).eq('id', id);
    toast.success('SOS Resolved');
  };

  if (activeSOS.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-[2000] flex flex-col gap-2 p-4 max-h-[50vh] overflow-y-auto pointer-events-none">
      {activeSOS.map(sos => {
        const elapsed = Math.floor((now - new Date(sos.created_at).getTime()) / 1000);
        const name = sos.profiles?.full_name || 'Unknown';
        const timeout = elapsed > 60 && !sos.acknowledged_at;
        
        return (
          <div key={sos.id} className="bg-red-600 text-white rounded-lg shadow-xl border-2 border-white p-4 animate-pulse pointer-events-auto">
            <h3 className="font-bold text-lg mb-1">🚨 SOS ALERT</h3>
            <p className="mb-2">{name} sent SOS — {elapsed} seconds ago</p>
            
            {!sos.acknowledged_at && (
              <div className="w-full bg-red-800 h-2 rounded mb-2 overflow-hidden">
                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${Math.max(0, 100 - (elapsed / 60) * 100)}%` }} />
              </div>
            )}

            {timeout && !sos.acknowledged_at && (
              <p className="bg-black text-yellow-400 p-2 text-sm font-bold rounded mb-2">
                No one acknowledged — call emergency contact: {sos.profiles?.emergency_contact || 'N/A'}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              {!sos.acknowledged_at && (
                <button onClick={() => handleAck(sos.id)} className="bg-white text-red-600 px-4 py-2 rounded font-bold shadow hover:bg-gray-100">
                  Acknowledge
                </button>
              )}
              <button onClick={() => handleResolve(sos.id)} className="bg-black/50 text-white px-4 py-2 rounded font-bold hover:bg-black/70">
                Mark Resolved
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
