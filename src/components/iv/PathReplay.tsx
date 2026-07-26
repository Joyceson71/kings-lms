'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Play, Pause, X } from 'lucide-react';

interface PathReplayProps {
  tripId: string;
  mapInstance: any;
  onClose: () => void;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function PathReplay({ tripId, mapInstance, onClose }: PathReplayProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [students, setStudents] = useState<any>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [minTime, setMinTime] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  
  const L = typeof window !== 'undefined' ? (window as any).L : null;
  const layersRef = useRef<{ [key: string]: { polyline: any, marker: any } }>({});
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('iv_location_history')
        .select('*, profiles(first_name, last_name)')
        .eq('iv_trip_id', tripId)
        .order('recorded_at', { ascending: true });

      if (data && data.length > 0) {
        setHistory(data);
        const minT = new Date(data[0].recorded_at).getTime();
        const maxT = new Date(data[data.length - 1].recorded_at).getTime();
        setMinTime(minT);
        setMaxTime(maxT);
        setCurrentTime(minT);

        const st: any = {};
        let colorIdx = 0;
        data.forEach(row => {
          if (!st[row.user_id]) {
            st[row.user_id] = {
              name: `${row.profiles?.first_name} ${row.profiles?.last_name}`,
              color: COLORS[colorIdx % COLORS.length]
            };
            colorIdx++;
          }
        });
        setStudents(st);
      }
    };
    fetchHistory();
    
    return () => {
      // Cleanup layers
      if (mapInstance) {
        Object.values(layersRef.current).forEach(({ polyline, marker }) => {
          mapInstance.removeLayer(polyline);
          mapInstance.removeLayer(marker);
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    if (!L || !mapInstance || history.length === 0) return;

    // Filter points up to currentTime
    const currentData = history.filter(h => new Date(h.recorded_at).getTime() <= currentTime);
    
    // Group by student
    const byStudent: any = {};
    currentData.forEach(row => {
      if (!byStudent[row.user_id]) byStudent[row.user_id] = [];
      byStudent[row.user_id].push([row.lat, row.lng]);
    });

    Object.keys(students).forEach(userId => {
      const pts = byStudent[userId] || [];
      
      if (!layersRef.current[userId]) {
        const polyline = L.polyline([], { color: students[userId].color, weight: 3 }).addTo(mapInstance);
        const marker = L.circleMarker([0,0], { radius: 6, fillColor: students[userId].color, color: '#fff', weight: 2, fillOpacity: 1 }).addTo(mapInstance);
        marker.bindTooltip(students[userId].name, { permanent: false });
        layersRef.current[userId] = { polyline, marker };
      }

      const layer = layersRef.current[userId];
      layer.polyline.setLatLngs(pts);
      
      if (pts.length > 0) {
        layer.marker.setLatLng(pts[pts.length - 1]);
        if (!mapInstance.hasLayer(layer.marker)) mapInstance.addLayer(layer.marker);
      } else {
        if (mapInstance.hasLayer(layer.marker)) mapInstance.removeLayer(layer.marker);
      }
    });

  }, [currentTime, history, L, mapInstance, students]);

  useEffect(() => {
    if (playing) {
      // 10x real-time speed. Update every 100ms. 
      // 100ms real = 1000ms trip time. Let's do 100x speed for better viewing (100ms = 10s).
      const step = 10000; 
      playIntervalRef.current = setInterval(() => {
        setCurrentTime(t => {
          if (t + step >= maxTime) {
            setPlaying(false);
            return maxTime;
          }
          return t + step;
        });
      }, 100);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [playing, maxTime]);

  if (history.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-card p-4 rounded-xl shadow-2xl border border-border w-11/12 max-w-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Path Replay</h3>
        <button onClick={onClose}><X size={18} /></button>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setPlaying(!playing)}
          className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        
        <div className="flex-1 flex flex-col">
          <input 
            type="range" 
            min={minTime} 
            max={maxTime} 
            value={currentTime}
            onChange={(e) => {
              setPlaying(false);
              setCurrentTime(Number(e.target.value));
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{new Date(currentTime).toLocaleTimeString()}</span>
            <span>{new Date(maxTime).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
