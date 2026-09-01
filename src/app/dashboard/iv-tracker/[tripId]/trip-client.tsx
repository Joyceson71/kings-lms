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
import TripAnalytics from '@/components/iv/TripAnalytics';
import TripReportGenerator from '@/components/iv/TripReportGenerator';
import TripItinerary from '@/components/iv/TripItinerary';
import QRCode from 'qrcode';
import { ImageIcon, Menu, X, Copy, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sosEvents, setSosEvents] = useState<any[]>([]);
  const [breaches, setBreaches] = useState<any[]>([]);

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
        .select(`*, profiles(full_name, role)`)
        .eq('iv_trip_id', tripId)
        .order('updated_at', { ascending: false });
      
      if (data) setStudents(data);
    };

    const fetchAnalyticsData = async () => {
      const { data: sos } = await supabase.from('iv_sos_events').select('*').eq('iv_trip_id', tripId);
      if (sos) setSosEvents(sos);

      const { data: zones } = await supabase.from('iv_geofence_zones').select('id').eq('iv_trip_id', tripId);
      if (zones && zones.length > 0) {
        const { data: br } = await supabase.from('iv_geofence_events').select('*').in('zone_id', zones.map(z => z.id));
        if (br) setBreaches(br);
      }
    };

    fetchStudents();
    fetchAnalyticsData();

    const channel = supabase.channel(`trip-sidebar-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_locations', filter: `iv_trip_id=eq.${tripId}` }, 
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newLoc = payload.new as any;
            setStudents(prev => {
              const exists = prev.find(s => s.user_id === newLoc.user_id);
              if (exists) {
                return prev.map(s => s.user_id === newLoc.user_id ? { ...s, ...newLoc } : s);
              } else {
                fetchStudents();
                return prev;
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  useEffect(() => {
    if (role !== 'student' || !sharing) return;
    
    const myLoc = students.find(s => s.user_id === currentUserId);
    const facultyLoc = students.find(s => s.profiles?.role === 'faculty' || s.profiles?.role === 'admin');
    
    if (myLoc && facultyLoc && myLoc.lat && facultyLoc.lat) {
      const R = 6371e3;
      const φ1 = myLoc.lat * Math.PI/180, φ2 = facultyLoc.lat * Math.PI/180;
      const Δφ = (facultyLoc.lat - myLoc.lat) * Math.PI/180;
      const Δλ = (facultyLoc.lng - myLoc.lng) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = Math.round(R * c);
      
      if (dist > 200) {
        const lastAlert = localStorage.getItem(`iv-stray-alert-${tripId}`);
        if (!lastAlert || Date.now() - Number(lastAlert) > 60000 * 5) {
          localStorage.setItem(`iv-stray-alert-${tripId}`, Date.now().toString());
          toast.error(`⚠️ Stray Alert: You are ${dist}m away from the faculty!`);
          if ('vibrate' in navigator) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }
        }
      }
    }
  }, [students, currentUserId, role, sharing, tripId]);

  return (
    <>
      {/* MOBILE SIDEBAR TOGGLE */}
      <button 
        className="md:hidden absolute top-6 left-6 z-[3000] clay-card p-3 shadow-xl"
        onClick={() => setShowSidebar(true)}
      >
        <Menu size={24} />
      </button>

      {/* SPATIAL SIDEBAR */}
      <div className={`absolute top-8 left-8 z-[3500] w-[calc(100vw-64px)] md:w-[360px] max-h-[calc(100vh-64px)] glass-card backdrop-blur-2xl bg-black/40 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] rounded-[2.5rem] flex flex-col overflow-hidden text-foreground pointer-events-auto transition-transform duration-500 ease-out ${showSidebar ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto'}`}>
        <div className="p-8 flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-3xl tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent drop-shadow-sm">IV Tracker</h2>
            <button className="md:hidden text-white/50 hover:text-white bg-black/20 p-2.5 rounded-full backdrop-blur-md transition-colors" onClick={() => setShowSidebar(false)}>
              <X size={20} />
            </button>
          </div>
          
          {(role === 'faculty' || role === 'admin') && (
            <div className="mb-8 p-6 neo-inset bg-black/20 rounded-[1.5rem] border border-white/5 shadow-inner flex flex-col items-center justify-center">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Live Headcount</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black text-white drop-shadow-md">
                  {students.filter(s => (Date.now() - new Date(s.updated_at).getTime()) < 30000).length}
                </p>
                <span className="text-white/30 text-2xl font-bold">/ {students.length}</span>
              </div>
            </div>
          )}
          
          {isActive && (
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={() => setSharing(!sharing)}
                className={`w-full py-4 rounded-full font-black text-lg tracking-widest transition-all duration-300 shadow-xl ${
                  sharing 
                    ? 'bg-black/40 text-destructive border border-destructive/30 hover:bg-destructive/10'
                    : 'bg-gradient-to-r from-primary to-accent text-white hover:scale-[1.03] shadow-[0_8px_30px_rgba(79,70,229,0.5)] border border-white/20'
                }`}
              >
                {sharing ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse shadow-[0_0_12px_#ef4444]" />
                    STOP SHARING
                  </span>
                ) : (
                  'JOIN TRIP'
                )}
              </button>
              
              {role === 'student' && (
                <div className="flex items-center justify-between p-4 clay-card rounded-2xl hover:scale-[1.02] transition-transform">
                  <div className="flex flex-col">
                    <Label htmlFor="battery-saver" className="font-bold text-foreground">Battery Saver</Label>
                    <span className="text-xs text-muted-foreground">Throttles GPS to 60s</span>
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
                const url = `${window.location.origin}/dashboard/iv-tracker/${tripId}`;
                setQrUrl(await QRCode.toDataURL(url));
                setShowQrModal(true);
              }} 
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white py-3.5 rounded-full font-bold text-sm transition-all hover:bg-white/10 hover:scale-[1.02] mb-8 shadow-lg flex items-center justify-center gap-2"
            >
              Share QR Link
            </button>
          )}

          {!isActive && (role === 'faculty' || role === 'admin') && (
            <div className="flex flex-col gap-3 mb-8">
              <button onClick={() => setShowReplay(!showReplay)} className="clay-card py-2 rounded-full font-bold text-primary hover:scale-[1.02] transition-transform shadow-md">
                {showReplay ? 'Live Map' : 'Path Replay'}
              </button>
              <button onClick={() => setShowHeatmap(!showHeatmap)} className="clay-card py-2 rounded-full font-bold text-secondary-foreground hover:scale-[1.02] transition-transform shadow-md">
                {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
              </button>
              <button onClick={() => setShowAnalytics(true)} className="clay-card py-2 rounded-full font-bold text-accent hover:scale-[1.02] transition-transform shadow-md">
                Live Analytics
              </button>
              <button onClick={() => setShowReportBuilder(true)} className="clay-card py-3 rounded-full font-black text-foreground hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2">
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
                <div key={s.user_id} className="flex items-center justify-between p-3 clay-card rounded-2xl shadow-sm">
                  <div>
                    <p className="font-bold text-sm tracking-wide">
                      {s.profiles?.full_name}
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
        <div className="absolute bottom-24 right-4 md:bottom-10 md:right-10 z-[2000] flex flex-col gap-4 md:gap-6 pointer-events-auto items-end">
          <button 
            onClick={() => setShowItinerary(!showItinerary)}
            className="w-14 h-14 md:w-16 md:h-16 clay-card rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          >
            <CalendarClock size={24} />
          </button>
          <button 
            onClick={() => setShowGallery(true)}
            className="w-14 h-14 md:w-16 md:h-16 clay-card rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          >
            <ImageIcon size={24} />
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
          userName={students.find(s => s.user_id === currentUserId)?.profiles?.full_name?.split(' ')[0] || 'User'} 
        />
        {showReplay && <PathReplay tripId={tripId} mapInstance={(window as any)._ivMapInstance} onClose={() => setShowReplay(false)} />}
        
        {/* Itinerary Slide Over */}
        <div className={`absolute top-0 right-0 bottom-0 z-[2500] transition-transform duration-300 ${showItinerary ? 'translate-x-0' : 'translate-x-full'}`}>
          <TripItinerary tripId={tripId} role={role} currentUserId={currentUserId} />
        </div>
      </div>
      
      {showQrModal && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[4000] flex items-center justify-center p-4">
          <div className="bg-card border border-border text-foreground p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full">
            <h3 className="font-bold text-2xl mb-4">Join Trip</h3>
            <div className="bg-muted px-8 py-4 rounded-xl border border-border mb-6 text-center w-full relative group">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Trip Code</p>
              <div className="flex items-center justify-center gap-3">
                <p className="font-mono text-4xl font-black">{joinCode}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(joinCode || '');
                    toast.success('Code copied to clipboard');
                  }}
                  className="p-2 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
                  title="Copy code"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <img src={qrUrl} alt="QR Code" className="w-64 h-64 rounded-2xl mb-6 bg-white p-2" />
            <button onClick={() => setShowQrModal(false)} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-bold">
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
      
      {showAnalytics && (
        <div className="absolute inset-0 z-[4500] bg-background/95 backdrop-blur-xl flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <h2 className="font-bold text-xl tracking-tight">Analytics Dashboard</h2>
            <button onClick={() => setShowAnalytics(false)} className="p-2 bg-muted rounded-full hover:bg-muted/80">
              <X size={20} />
            </button>
          </div>
          <TripAnalytics students={students} sosEvents={sosEvents} breaches={breaches} />
        </div>
      )}
      
      {showReportBuilder && (
        <TripReportGenerator 
          tripId={tripId} 
          students={students} 
          sosEvents={sosEvents} 
          breaches={breaches} 
          onClose={() => setShowReportBuilder(false)} 
        />
      )}
    </>
  );
}
