'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface IVMapProps {
  tripId: string;
  currentUserId: string;
  role: 'student' | 'faculty' | 'admin';
  mapBounds?: { north: number; south: number; east: number; west: number } | null;
}

export default function IVMap({ tripId, currentUserId, role, mapBounds }: IVMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routingControl = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const gatherMarkerRef = useRef<any>(null);
  
  const [gatherPoint, setGatherPoint] = useState<{lat: number, lng: number, message: string} | null>(null);
  const [showGatherModal, setShowGatherModal] = useState(false);
  const [gatherLatLng, setGatherLatLng] = useState<{lat: number, lng: number} | null>(null);
  const [gatherMessage, setGatherMessage] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    let L: any;
    let LRouting: any;

    const initMap = async () => {
      L = (await import('leaflet')).default;
      
      try {
        await import('leaflet-routing-machine');
      } catch(_) {
        console.warn('Routing machine failed to load');
      }

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapContainer.current).setView([13.0827, 80.2707], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        if (role === 'faculty' || role === 'admin') {
          mapInstance.current.on('click', (e: any) => {
            setGatherLatLng(e.latlng);
            setShowGatherModal(true);
          });
        }
      }

      const supabase = createClient();
      
      // Fetch initial locations
      const { data: initialLocs } = await supabase
        .from('iv_locations')
        .select('*')
        .eq('iv_trip_id', tripId);
        
      if (initialLocs) {
        initialLocs.forEach(updateMarker);
      }
      
      // Fetch active alert
      const { data: alerts } = await supabase
        .from('iv_alerts')
        .select('*')
        .eq('iv_trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (alerts && alerts.length > 0 && alerts[0].gather_lat) {
        setGatherPoint({
          lat: alerts[0].gather_lat,
          lng: alerts[0].gather_lng,
          message: alerts[0].message
        });
      }

      // Realtime subscription
      const channel = supabase.channel(`iv-trip-${tripId}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'iv_locations',
            filter: `iv_trip_id=eq.${tripId}`
          }, 
          (payload) => updateMarker(payload.new)
        )
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'iv_alerts',
            filter: `iv_trip_id=eq.${tripId}`
          }, 
          (payload) => {
            const al = payload.new;
            if (al.gather_lat) {
              setGatherPoint({ lat: al.gather_lat, lng: al.gather_lng, message: al.message });
              toast.info(`Gather Alert: ${al.message}`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initMap();

    function updateMarker(loc: any) {
      if (!L || !mapInstance.current) return;
      if (!loc || !loc.lat || !loc.lng) return;

      const isMe = loc.user_id === currentUserId;
      const color = isMe ? '#10b981' : (loc.is_online ? '#3b82f6' : '#6b7280');
      
      if (markersRef.current[loc.user_id]) {
        markersRef.current[loc.user_id].setLatLng([loc.lat, loc.lng]);
        markersRef.current[loc.user_id].setStyle({ fillColor: color });
      } else {
        const marker = L.circleMarker([loc.lat, loc.lng], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).bindTooltip(isMe ? 'You' : 'Student', { permanent: false });
        
        marker.addTo(mapInstance.current);
        markersRef.current[loc.user_id] = marker;
      }
      
      // Geofence check
      if (isMe && mapBounds) {
        if (loc.lat > mapBounds.north || loc.lat < mapBounds.south || loc.lng > mapBounds.east || loc.lng < mapBounds.west) {
          toast.warning("⚠️ You have left the IV area.");
        }
      }
    }
  }, [tripId, currentUserId, role, mapBounds]);

  useEffect(() => {
    if (!gatherPoint || !mapInstance.current) return;
    
    import('leaflet').then((L) => {
      if (gatherMarkerRef.current) {
        mapInstance.current.removeLayer(gatherMarkerRef.current);
      }
      
      gatherMarkerRef.current = L.default.circleMarker([gatherPoint.lat, gatherPoint.lng], {
        radius: 12,
        fillColor: '#ef4444',
        color: '#fff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
        className: 'animate-pulse'
      }).bindTooltip('Gather Here', { permanent: true, direction: 'top' });
      
      gatherMarkerRef.current.addTo(mapInstance.current);
    });
  }, [gatherPoint]);

  const sendGatherAlert = async () => {
    if (!gatherLatLng || !gatherMessage) return;
    try {
      const res = await fetch('/api/iv/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iv_trip_id: tripId,
          message: gatherMessage,
          gather_lat: gatherLatLng.lat,
          gather_lng: gatherLatLng.lng
        })
      });
      if (!res.ok) throw new Error('Failed to send');
      toast.success('Gather alert sent');
      setShowGatherModal(false);
      setGatherMessage('');
    } catch(_) {
      toast.error('Could not send alert');
    }
  };

  const navigateToGather = async () => {
    if (!gatherPoint || !markersRef.current[currentUserId] || !mapInstance.current) return;
    const myLoc = markersRef.current[currentUserId].getLatLng();
    
    try {
      const L = (await import('leaflet')).default;
      await import('leaflet-routing-machine');
      
      if (routingControl.current) {
        mapInstance.current.removeControl(routingControl.current);
      }
      
      routingControl.current = (L as any).Routing.control({
        waypoints: [
          L.latLng(myLoc.lat, myLoc.lng),
          L.latLng(gatherPoint.lat, gatherPoint.lng)
        ],
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: { styles: [{ color: '#3b82f6', weight: 4 }] },
        show: false,
        addWaypoints: false
      }).addTo(mapInstance.current);
      
    } catch(_) {
      toast.error("Routing not available");
    }
  };

  const downloadMap = async () => {
    if (!mapBounds) {
      toast.error('Map area not defined for this trip');
      return;
    }
    setDownloading(true);
    // Simple mock pre-fetch for demo: would ideally loop x/y/z ranges.
    // We will just fetch a few tiles in the center.
    try {
      const cache = await caches.open('iv-tiles-v1');
      const z = 14;
      const centerLat = (mapBounds.north + mapBounds.south) / 2;
      const centerLng = (mapBounds.east + mapBounds.west) / 2;
      const latRad = centerLat * Math.PI / 180;
      const n = Math.pow(2, z);
      const xtile = Math.floor(n * ((centerLng + 180) / 360));
      const ytile = Math.floor(n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2);
      
      const urls = [];
      for(let i = -2; i <= 2; i++) {
        for(let j = -2; j <= 2; j++) {
          urls.push(`https://a.tile.openstreetmap.org/${z}/${xtile+i}/${ytile+j}.png`);
        }
      }
      
      await cache.addAll(urls);
      toast.success('Map downloaded for offline use');
    } catch(_) {
      toast.error('Failed to download map');
    }
    setDownloading(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {gatherPoint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-3">
          <MapPin className="animate-bounce" />
          Gather here: {gatherPoint.message}
          {role === 'student' && (
            <Button size="sm" variant="secondary" onClick={navigateToGather} className="ml-4">
              Navigate
            </Button>
          )}
        </div>
      )}
      
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
        <Button onClick={downloadMap} disabled={downloading} variant="secondary">
          {downloading ? 'Downloading...' : 'Download Offline Map'}
        </Button>
      </div>

      <div ref={mapContainer} className="w-full h-full z-0 bg-secondary/20" />

      {showGatherModal && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-center justify-center">
          <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Send Gather Alert</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Broadcast a message and pin to all students.
            </p>
            <input 
              className="w-full bg-background border border-border p-3 rounded-lg mb-4"
              placeholder="E.g. Meet here in 10 mins"
              value={gatherMessage}
              onChange={e => setGatherMessage(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowGatherModal(false)}>Cancel</Button>
              <Button onClick={sendGatherAlert}>Send Alert</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
