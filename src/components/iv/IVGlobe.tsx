'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';


// Dynamically import react-globe.gl to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl').then(mod => mod.default), { ssr: false });

interface LocationData {
  student_id: string;
  lat: number;
  lng: number;
  role?: string;
  user_name?: string;
  avatar_url?: string;
  updated_at: string;
}

interface IVGlobeProps {
  tripId: string;
}

export function IVGlobe({ tripId }: IVGlobeProps) {
  const [locations, setLocations] = useState<Record<string, LocationData>>({});
  const globeRef = useRef<any>(null);
  
  // Set initial coordinates for India / Chennai
  const initialCenter = { lat: 13.0827, lng: 80.2707, altitude: 1.5 };

  useEffect(() => {
    const supabase = createClient();
    
    // Fetch initial locations
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('iv_locations')
        .select('*')
        .eq('iv_trip_id', tripId);
        
      if (data && !error) {
        const locMap: Record<string, LocationData> = {};
        data.forEach((loc) => {
          locMap[loc.student_id] = loc;
        });
        setLocations(locMap);
      }
    };

    fetchLocations();

    // Subscribe to real-time updates
    const channel = supabase.channel(`iv-globe-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_locations', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
        const newLoc = payload.new as LocationData;
        setLocations(prev => ({ ...prev, [newLoc.student_id]: newLoc }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(initialCenter, 4000);
    }
  }, []);

  const globeData = useMemo(() => {
    return Object.values(locations).map(loc => ({
      lat: loc.lat,
      lng: loc.lng,
      size: 1.5,
      color: loc.role === 'faculty' ? '#ef4444' : '#10b981',
      name: loc.user_name || 'Student',
      id: loc.student_id,
      avatar: loc.avatar_url
    }));
  }, [locations]);

  return (
    <div className="w-full h-[600px] relative bg-[#04040c] rounded-xl overflow-hidden shadow-2xl border border-white/5">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        htmlElementsData={globeData}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="transform: translate(-50%, -100%); pointer-events: none; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); padding: 2px 8px; border-radius: 4px; border: 1px solid ${d.color}; font-size: 10px; font-weight: bold; color: white; white-space: nowrap;">
                ${d.name}
              </div>
              <div style="width: 12px; height: 12px; background: ${d.color}; border-radius: 50%; box-shadow: 0 0 10px ${d.color}; border: 2px solid white;"></div>
            </div>
          `;
          return el;
        }}
        atmosphereColor="#4f46e5"
        atmosphereAltitude={0.15}
      />
      
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Live Globe Tracker</h3>
        <p className="text-indigo-300 text-xs mt-1">{globeData.length} active connections</p>
      </div>
      
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur border border-white/10 p-2 rounded-lg pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Students
        </div>
        <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /> Faculty
        </div>
      </div>
    </div>
  );
}
