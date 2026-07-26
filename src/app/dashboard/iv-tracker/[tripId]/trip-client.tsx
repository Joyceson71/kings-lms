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
import TripGallery from '@/components/iv/TripGallery';
import PathReplay from '@/components/iv/PathReplay';
import QRCode from 'qrcode';
import { ImageIcon, Menu, X } from 'lucide-react';

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
  const [showGallery, setShowGallery] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

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
      {/* MOBILE SIDEBAR TOGGLE */}
      <button 
        className="md:hidden absolute top-4 left-4 z-[3000] bg-gradient-to-br from-indigo-950/80 to-purple-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        onClick={() => setShowSidebar(true)}
      >
        <Menu size={24} />
      </button>

      {/* SPATIAL SIDEBAR */}
      <div className={`absolute top-4 left-4 z-[3500] w-[calc(100vw-32px)] md:w-[360px] max-h-[calc(100vh-100px)] md:max-h-[calc(100vh-32px)] rounded-[2rem] bg-gradient-to-br from-indigo-950/90 to-purple-900/90 backdrop-blur-2xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-white pointer-events-auto transition-transform duration-300 ${showSidebar ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto'}`}>
        <div className="p-6 flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]">IV Tracker Max</h2>
            <button className="md:hidden text-white/70 hover:text-white bg-white/10 p-2 rounded-full border border-white/20" onClick={() => setShowSidebar(false)}>
              <X size={20} />
            </button>
          </div>
          
          {(role === 'faculty' || role === 'admin') && (
            <div className="mb-6 p-4 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
              <p className="text-xs font-black text-pink-400 uppercase tracking-[0.2em] mb-1">Live Headcount</p>
              <p className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                {students.filter(s => (Date.now() - new Date(s.updated_at).getTime()) < 30000).length} <span className="text-white/50 text-2xl">/ {students.length}</span>
              </p>
            </div>
          )}
          
          {isActive && (
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={() => setSharing(!sharing)}
                className={`w-full py-5 rounded-2xl font-black text-xl tracking-[0.2em] transition-all duration-300 border-2 ${
                  sharing 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:shadow-[0_0_50px_rgba(239,68,68,0.8)]'
                    : 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-black border-emerald-200 shadow-[0_0_30px_rgba(52,211,153,0.6)] hover:shadow-[0_0_50px_rgba(52,211,153,0.8)]'
                }`}
              >
                {sharing ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                    LIVE — STOP SHARING
                  </span>
                ) : (
                  'JOIN TRIP'
                )}
              </button>
              
              {role === 'student' && (
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col">
                    <Label htmlFor="battery-saver" className="font-bold text-white tracking-wide">Battery Saver</Label>
                    <span className="text-xs text-white/50">Throttles GPS to 60s</span>
                  </div>
                  <input 
                    type="checkbox"
                    id="battery-saver" 
                    checked={batterySaver} 
                    onChange={e => setBatterySaver(e.target.checked)} 
                    className="w-6 h-6 rounded-lg border-white/20 bg-black/50 accent-pink-500"
                  />
                </div>
              )}
            </div>
          )}

          {isActive && (role === 'faculty' || role === 'admin') && joinCode && (
            <button 
              onClick={async () => {
                const url = `${window.location.origin}/dashboard/iv-tracker/${tripId}`;
                setQrUrl(await QRCode.toDataURL(url));
                setShowQrModal(true);
              }} 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:scale-[1.02] transition-transform mb-8"
            >
              Share QR Link
            </button>
          )}

          {!isActive && (role === 'faculty' || role === 'admin') && (
            <div className="flex flex-col gap-3 mb-8">
              <button onClick={() => setShowReplay(!showReplay)} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-2xl font-black shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                {showReplay ? 'Close Replay' : 'Replay Trip'}
              </button>
              <button onClick={() => setShowHeatmap(!showHeatmap)} className="bg-white/10 text-white py-3 rounded-2xl font-black border border-white/20 hover:bg-white/20">
                {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
              </button>
              <button onClick={() => window.open(`/api/iv/trip-report?trip_id=${tripId}`)} className="bg-black text-white py-3 rounded-2xl font-black border border-white/10 shadow-inner flex items-center justify-center gap-2 hover:bg-black/80">
                Download PDF Report
              </button>
            </div>
          )}

          <div className="flex-1">
            <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-4">Live Participants</h3>
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
                <div key={s.user_id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5 backdrop-blur-md">
                  <div>
                    <p className="font-bold text-sm tracking-wide">
                      {s.profiles?.first_name} {s.profiles?.last_name}
                      {s.user_id === currentUserId && <span className="text-pink-400"> (You)</span>}
                    </p>
                    <p className="text-xs text-white/50 flex gap-2 mt-1">
                      {new Date(s.updated_at).toLocaleTimeString()}
                      {dist !== null && (
                        <span className={`font-black tracking-wider ${dist < 50 ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]' : dist < 200 ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]'}`}>
                          {dist}m
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.battery !== null && (
                      <div className="flex items-center text-xs font-bold text-white/80" title={`${s.battery}%`}>
                        {s.battery > 80 ? <BatteryFull size={16} className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" /> :
                         s.battery > 20 ? <BatteryMedium size={16} className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" /> :
                         <BatteryLow size={16} className="text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]" />}
                        <span className="ml-1">{s.battery}%</span>
                      </div>
                    )}
                    <div className={`w-3 h-3 rounded-full ${s.is_online ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,1)]' : 'bg-gray-600 shadow-inner'}`} title={s.is_online ? 'Online' : 'Offline'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {/* FULL SCREEN MAP */}
      <div className="absolute inset-0 z-0">
        {isOffline && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-2 rounded-full text-sm z-[3000] font-black tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.6)]">
            <WifiOff size={18} /> OFFLINE - QUEUING GPS
          </div>
        )}
        <div className="absolute bottom-24 right-4 md:bottom-8 md:right-8 z-[2000] flex flex-col gap-4 md:gap-6 pointer-events-auto items-end">
          <button 
            onClick={() => setShowGallery(true)}
            className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.8)] hover:scale-110 transition-transform border-4 border-white/20 backdrop-blur-sm"
          >
            <ImageIcon size={32} />
          </button>
          <SOSButton tripId={tripId} studentId={currentUserId} />
        </div>
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[4000] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 border border-white/20 text-white p-12 rounded-[3rem] shadow-[0_0_60px_rgba(217,70,239,0.5)] flex flex-col items-center">
            <h3 className="font-black text-3xl mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Join Trip</h3>
            <div className="bg-white/10 px-8 py-4 rounded-2xl border border-white/20 mb-8 shadow-inner text-center">
              <p className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">Trip Code</p>
              <p className="font-mono text-5xl font-black text-white tracking-widest">{joinCode}</p>
            </div>
            <img src={qrUrl} alt="QR Code" className="w-80 h-80 rounded-3xl mb-8 shadow-2xl shadow-black/50 border-4 border-white/10" />
            <button onClick={() => setShowQrModal(false)} className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(236,72,153,0.5)]">
              Close
            </button>
          </div>
        </div>
      )}
      
      {showGallery && (
        <TripGallery 
          tripId={tripId} 
          currentUserId={currentUserId} 
          onClose={() => setShowGallery(false)} 
        />
      )}
    </>
  );
}
