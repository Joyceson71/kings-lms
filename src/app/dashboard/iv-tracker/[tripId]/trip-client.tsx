'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useIVLocation } from '@/hooks/useIVLocation';
import { subscribeToPush } from '@/lib/push-subscribe';
import { Label } from '@/components/ui/label';
import { WifiOff, BatteryFull, BatteryLow, BatteryMedium } from 'lucide-react';

const IVMap = dynamic(() => import('@/components/iv/IVMap'), { ssr: false });

interface TripClientProps {
  tripId: string;
  currentUserId: string;
  role: 'student' | 'faculty' | 'admin';
  mapBounds?: any;
}

export default function TripClient({ tripId, currentUserId, role, mapBounds }: TripClientProps) {
  const [sharing, setSharing] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  // Hook handles location tracking and offline syncing
  useIVLocation(tripId, currentUserId, sharing);

  useEffect(() => {
    if (sharing) {
      subscribeToPush();
    }
  }, [sharing]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const fetchStudents = async () => {
      const { data } = await supabase
        .from('iv_locations')
        .select(`*, profiles(first_name, last_name)`)
        .eq('iv_trip_id', tripId)
        .order('updated_at', { ascending: false });
      
      if (data) setStudents(data);
    };

    fetchStudents();

    const channel = supabase.channel(`trip-sidebar-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_locations', filter: `iv_trip_id=eq.${tripId}` }, 
        () => fetchStudents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return (
    <>
      <div className="w-full md:w-80 bg-card border-r border-border p-4 flex flex-col h-auto md:h-full z-10 shrink-0 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4">IV Tracker</h2>
        
        {role === 'student' && (
          <div className="flex items-center justify-between mb-6 p-4 bg-secondary/20 rounded-xl border border-border">
            <Label htmlFor="share-location" className="font-bold">Share Location</Label>
            <input 
              type="checkbox"
              id="share-location" 
              checked={sharing} 
              onChange={e => setSharing(e.target.checked)} 
              className="w-5 h-5 rounded border-border"
            />
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Live Participants</h3>
          <div className="space-y-3">
            {students.map(s => (
              <div key={s.user_id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                <div>
                  <p className="font-medium text-sm">
                    {s.profiles?.first_name} {s.profiles?.last_name}
                    {s.user_id === currentUserId && ' (You)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.updated_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.battery !== null && (
                    <div className="flex items-center text-xs text-muted-foreground" title={`${s.battery}%`}>
                      {s.battery > 80 ? <BatteryFull size={14} className="text-emerald-500" /> :
                       s.battery > 20 ? <BatteryMedium size={14} className="text-yellow-500" /> :
                       <BatteryLow size={14} className="text-red-500" />}
                      <span className="ml-1">{s.battery}%</span>
                    </div>
                  )}
                  <div className={`w-2 h-2 rounded-full ${s.is_online ? 'bg-emerald-500' : 'bg-gray-500'}`} title={s.is_online ? 'Online' : 'Offline'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative h-[50vh] md:h-full">
        {isOffline && (
          <div className="absolute top-0 left-0 w-full bg-yellow-500/90 text-black text-center text-sm py-1 z-[2000] font-bold flex items-center justify-center gap-2">
            <WifiOff size={16} /> You are offline — location is being queued
          </div>
        )}
        <IVMap 
          tripId={tripId} 
          currentUserId={currentUserId} 
          role={role} 
          mapBounds={mapBounds} 
        />
      </div>
    </>
  );
}
