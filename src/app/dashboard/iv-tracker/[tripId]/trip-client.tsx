'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useIVLocation } from '@/hooks/useIVLocation';
import { subscribeToPush } from '@/lib/push-subscribe';
import { Label } from '@/components/ui/label';
import { WifiOff, BatteryFull, BatteryLow, BatteryMedium } from 'lucide-react';
import SOSButton from '@/components/iv/SOSButton';
import AdminSOSPanel from '@/components/iv/AdminSOSPanel';
import TripChat from '@/components/iv/TripChat';
import PathReplay from '@/components/iv/PathReplay';
import QRCode from 'qrcode';

const IVMap = dynamic(() => import('@/components/iv/IVMap'), { ssr: false });

interface TripClientProps {
  tripId: string;
  currentUserId: string;
  role: 'student' | 'faculty' | 'admin';
  mapBounds?: any;
  isActive?: boolean;
  joinCode?: string;
}

export default function TripClient({ tripId, currentUserId, role, mapBounds, isActive = true, joinCode }: TripClientProps) {
  const [sharing, setSharing] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  // Hook handles location tracking and offline syncing
  useIVLocation(tripId, currentUserId, isActive && sharing, batterySaver);

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
        <h2 className="font-bold text-lg mb-2">IV Tracker</h2>
        
        {(role === 'faculty' || role === 'admin') && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20 text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Live Headcount</p>
            <p className="text-2xl font-bold text-primary">
              {students.filter(s => (Date.now() - new Date(s.updated_at).getTime()) < 30000).length} / {students.length}
            </p>
          </div>
        )}
        
        {isActive && (
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border">
              <Label htmlFor="share-location" className="font-bold">
                {role === 'student' ? 'Share Location' : 'Act as Guide (Share Location)'}
              </Label>
              <input 
                type="checkbox"
                id="share-location" 
                checked={sharing} 
                onChange={e => setSharing(e.target.checked)} 
                className="w-5 h-5 rounded border-border"
              />
            </div>
            
            {role === 'student' && (
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border">
                <div className="flex flex-col">
                  <Label htmlFor="battery-saver" className="font-bold">Battery Saver Mode</Label>
                  <span className="text-xs text-muted-foreground">Updates every 60s, lower accuracy</span>
                </div>
                <input 
                  type="checkbox"
                  id="battery-saver" 
                  checked={batterySaver} 
                  onChange={e => setBatterySaver(e.target.checked)} 
                  className="w-5 h-5 rounded border-border"
                />
              </div>
            )}
          </div>
        )}

        {isActive && (role === 'faculty' || role === 'admin') && joinCode && (
          <button 
            onClick={async () => {
              const url = `${window.location.origin}/dashboard/iv-tracker/${tripId}/join?code=${joinCode}`;
              setQrUrl(await QRCode.toDataURL(url));
              setShowQrModal(true);
            }} 
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold mb-6"
          >
            Share QR Link
          </button>
        )}

        {!isActive && (role === 'faculty' || role === 'admin') && (
          <div className="flex flex-col gap-2 mb-6">
            <button onClick={() => setShowReplay(!showReplay)} className="bg-primary text-primary-foreground py-2 rounded-lg font-bold">
              {showReplay ? 'Close Replay' : 'Replay Trip'}
            </button>
            <button onClick={() => setShowHeatmap(!showHeatmap)} className="bg-secondary text-secondary-foreground py-2 rounded-lg font-bold">
              {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
            </button>
            <button onClick={() => window.open(`/api/iv/trip-report?trip_id=${tripId}`)} className="bg-black text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
              Download PDF Report
            </button>
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Live Participants</h3>
          <div className="space-y-3">
            {students.map(s => {
              const myLoc = students.find(x => x.user_id === currentUserId);
              let dist = null;
              if ((role === 'faculty' || role === 'admin') && myLoc && s.user_id !== currentUserId && myLoc.lat && myLoc.lng && s.lat && s.lng) {
                const R = 6371e3;
                const φ1 = myLoc.lat * Math.PI/180, φ2 = s.lat * Math.PI/180;
                const Δφ = (s.lat - myLoc.lat) * Math.PI/180;
                const Δλ = (s.lng - myLoc.lng) * Math.PI/180;
                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                dist = Math.round(R * c);
              }

              return (
                <div key={s.user_id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {s.profiles?.first_name} {s.profiles?.last_name}
                      {s.user_id === currentUserId && ' (You)'}
                    </p>
                    <p className="text-xs text-muted-foreground flex gap-2">
                      {new Date(s.updated_at).toLocaleTimeString()}
                      {dist !== null && (
                        <span className={`font-bold ${dist < 50 ? 'text-emerald-500' : dist < 200 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {dist}m away
                        </span>
                      )}
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
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 relative h-[50vh] md:h-full">
        {isOffline && (
          <div className="absolute top-0 left-0 w-full bg-yellow-500/90 text-black text-center text-sm py-1 z-[2000] font-bold flex items-center justify-center gap-2">
            <WifiOff size={16} /> You are offline — location is being queued
          </div>
        )}
        {role === 'student' && <SOSButton tripId={tripId} studentId={currentUserId} />}
        {(role === 'faculty' || role === 'admin') && <AdminSOSPanel tripId={tripId} currentUserId={currentUserId} />}
        <IVMap 
          tripId={tripId} 
          currentUserId={currentUserId} 
          role={role} 
          mapBounds={mapBounds} 
          showHeatmap={showHeatmap}
        />
        <TripChat 
          tripId={tripId} 
          currentUserId={currentUserId} 
          role={role} 
          userName={students.find(s => s.user_id === currentUserId)?.profiles?.first_name || 'User'} 
        />
        {showReplay && <PathReplay tripId={tripId} mapInstance={(window as any)._ivMapInstance} onClose={() => setShowReplay(false)} />}
      </div>
      
      {showQrModal && (
        <div className="absolute inset-0 bg-black/50 z-[3000] flex items-center justify-center p-4">
          <div className="bg-white text-black p-8 rounded-xl shadow-2xl flex flex-col items-center">
            <h3 className="font-bold text-xl mb-4">Trip Join QR Code</h3>
            <img src={qrUrl} alt="QR Code" className="w-64 h-64 border-4 border-gray-200 rounded-xl mb-4" />
            <p className="font-mono bg-gray-100 p-2 rounded text-sm mb-6 text-center break-all">
              {window.location.origin}/dashboard/iv-tracker/{tripId}/join?code={joinCode}
            </p>
            <button onClick={() => setShowQrModal(false)} className="w-full bg-black text-white py-2 rounded-lg font-bold">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
