'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MapPin, Download, CheckCircle, Crosshair, X, Info } from 'lucide-react';
import GeofenceManager from '@/components/iv/GeofenceManager';
import { IVGlobe } from '@/components/iv/IVGlobe';

interface IVMapProps {
  tripId: string;
  currentUserId: string;
  role: 'student' | 'faculty' | 'admin';
  mapBounds?: { north: number; south: number; east: number; west: number } | null;
  showHeatmap?: boolean;
}

export default function IVMap({ tripId, currentUserId, role, mapBounds, showHeatmap }: IVMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routingControl = useRef<any>(null);
  const markerClusterRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const messageMarkersRef = useRef<{ [key: string]: any }>({});
  const poiMarkersRef = useRef<{ [key: string]: any }>({});
  const gatherMarkerRef = useRef<any>(null);
  const profilesRef = useRef<{ [userId: string]: any }>({});
  
  const [gatherPoint, setGatherPoint] = useState<{lat: number, lng: number, message: string} | null>(null);
  const [showGatherModal, setShowGatherModal] = useState(false);
  const [gatherLatLng, setGatherLatLng] = useState<{lat: number, lng: number} | null>(null);
  const [gatherMessage, setGatherMessage] = useState('');
  
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [offlineMinZoom, setOfflineMinZoom] = useState(12);
  const [offlineMaxZoom, setOfflineMaxZoom] = useState(15);
  const [offlineStats, setOfflineStats] = useState<any>(null);

  const [poiMode, setPoiMode] = useState<'Meeting' | 'Restrooms' | 'Exit' | 'Custom' | null>(null);

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [pendingZoneLayer, setPendingZoneLayer] = useState<any>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState('permitted');

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  useEffect(() => {
    const s = localStorage.getItem(`iv-offline-stats-${tripId}`);
    if (s) setOfflineStats(JSON.parse(s));
  }, [tripId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    let L: any;

    const initMap = async () => {
      L = (await import('leaflet')).default;
      await import('leaflet.markercluster');
      
      try {
        await import('leaflet-routing-machine');
        await import('leaflet-draw');
      } catch (err) {
        console.warn('Map plugins failed to load', err);
      }

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapContainer.current, { drawControl: false }).setView([13.0827, 80.2707], 13);
        
        // Store the map globally so GeofenceManager can access it if needed
        (window as any)._ivMapInstance = mapInstance.current;
        (window as any).L = L;
        
        const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
        const satellite = L.tileLayer(process.env.NEXT_PUBLIC_ESRI_TILES || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
        
        L.control.layers({ "Street Map": streetMap, "Satellite": satellite }).addTo(mapInstance.current);
        streetMap.addTo(mapInstance.current);

        markerClusterRef.current = (L as any).markerClusterGroup({ disableClusteringAtZoom: 16 });
        mapInstance.current.addLayer(markerClusterRef.current);

        const drawnItems = new (L as any).FeatureGroup();
        mapInstance.current.addLayer(drawnItems);
        (window as any)._drawnItems = drawnItems;

        if (role === 'faculty' || role === 'admin') {
          const drawControl = new (L as any).Control.Draw({
            edit: { featureGroup: drawnItems },
            draw: {
              polygon: true,
              polyline: false,
              rectangle: true,
              circle: false,
              marker: false,
              circlemarker: false
            }
          });
          mapInstance.current.addControl(drawControl);

          mapInstance.current.on((L as any).Draw.Event.CREATED, (e: any) => {
            setPendingZoneLayer(e.layer);
            setShowZoneModal(true);
          });
        }

        mapInstance.current.on('click', () => {
          // Handled below due to closure
        });
      }

      const supabase = createClient();
      
      const { data: tripData } = await supabase.from('iv_trips').select('pois').eq('id', tripId).single();
      if (tripData?.pois) {
        tripData.pois.forEach((poi: any) => renderPoi(poi, L));
      }

      const { data: zones } = await supabase.from('iv_geofence_zones').select('*').eq('iv_trip_id', tripId);
      if (zones && (window as any)._drawnItems) {
        zones.forEach(zone => {
          const color = zone.zone_type === 'permitted' ? '#10b981' : zone.zone_type === 'danger' ? '#ef4444' : '#f59e0b';
          const polygon = L.polygon(zone.polygon.map((p: any) => [p.lat, p.lng]), { color }).bindTooltip(zone.name);
          (window as any)._drawnItems.addLayer(polygon);
        });
      }

      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url');
      if (profiles) {
        profiles.forEach(p => { profilesRef.current[p.id] = p; });
      }

      const { data: initialLocs } = await supabase.from('iv_locations').select('*').eq('iv_trip_id', tripId);
      if (initialLocs) {
        initialLocs.forEach(l => updateMarker(l, L));
      }

      const { data: existingPhotos } = await supabase.from('iv_messages').select('*').eq('iv_trip_id', tripId).not('photo_url', 'is', null);
      if (existingPhotos) {
        existingPhotos.forEach(msg => renderMessage(msg, L, true));
      }
      
      const { data: alerts } = await supabase.from('iv_alerts').select('*').eq('iv_trip_id', tripId).order('created_at', { ascending: false }).limit(1);
      if (alerts && alerts.length > 0 && alerts[0].gather_lat) {
        setGatherPoint({
          lat: alerts[0].gather_lat,
          lng: alerts[0].gather_lng,
          message: alerts[0].message
        });
      }

      const channel = supabase.channel(`iv-trip-${tripId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_locations', filter: `iv_trip_id=eq.${tripId}` }, (payload) => updateMarker(payload.new, L))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iv_alerts', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
          const al = payload.new;
          if (al.gather_lat) {
            setGatherPoint({ lat: al.gather_lat, lng: al.gather_lng, message: al.message });
            toast.info(`Gather Alert: ${al.message}`);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_sos_events', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
          const sos = payload.new as any;
          if (!sos.resolved_at && markersRef.current[sos.student_id] && mapInstance.current) {
            markersRef.current[sos.student_id].setStyle({ fillColor: '#dc2626', className: 'animate-pulse' });
            mapInstance.current.flyTo([sos.lat, sos.lng], 16);
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'iv_trips', filter: `id=eq.${tripId}` }, (payload) => {
           if (payload.new.pois) {
             payload.new.pois.forEach((poi: any) => renderPoi(poi, L));
           }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iv_messages', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
          renderMessage(payload.new as any, L, false);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initMap();

    function renderMessage(msg: any, L: any, isInitialLoad: boolean) {
      if (!msg.lat || !msg.lng || !L || !mapInstance.current) return;
      if (messageMarkersRef.current[msg.id]) return;

      let html = '';
      if (msg.photo_url) {
        html = `<div class="w-12 h-12 rounded-lg border-2 border-primary shadow-lg overflow-hidden cursor-pointer bg-white" style="background-image: url('${msg.photo_url}'); background-size: cover; background-position: center;"></div>`;
      } else if (msg.is_broadcast) {
        html = `<div class="w-8 h-8 bg-yellow-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold">BR</div>`;
      } else {
        html = `<div class="w-8 h-8 bg-white rounded-full border-2 border-gray-400 shadow-lg flex items-center justify-center text-xs font-bold relative"><div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-gray-400"></div>💬</div>`;
      }
      
      const icon = L.divIcon({ html, className: 'bg-transparent', iconSize: msg.photo_url ? [48, 48] : [32, 32], iconAnchor: msg.photo_url ? [24, 24] : [16, 32] });
      const marker = L.marker([msg.lat, msg.lng], { icon }).addTo(mapInstance.current);
      
      if (msg.photo_url) {
        marker.on('click', () => setSelectedPhoto(msg.photo_url));
        if (msg.content) marker.bindTooltip(msg.content, { direction: 'top', offset: [0, -24] });
      } else {
        marker.bindTooltip(msg.content, { permanent: true, direction: 'top', offset: [0, -32] }).openTooltip();
        if (!isInitialLoad) {
          setTimeout(() => {
            if (mapInstance.current && messageMarkersRef.current[msg.id]) {
              mapInstance.current.removeLayer(messageMarkersRef.current[msg.id]);
              delete messageMarkersRef.current[msg.id];
            }
          }, 600000);
        }
      }
      
      messageMarkersRef.current[msg.id] = marker;
    }

    function updateMarker(loc: any, L: any) {
      if (!L || !markerClusterRef.current) return;
      if (!loc || !loc.lat || !loc.lng) return;

      const isMe = loc.user_id === currentUserId;
      const name = isMe ? 'You' : (profilesRef.current[loc.user_id]?.full_name || 'Student');
      const avatar = profilesRef.current[loc.user_id]?.avatar_url;
      const ringClass = isMe ? 'ring-emerald-500' : (loc.is_online ? 'ring-blue-500' : 'ring-gray-500');
      
      const html = avatar 
        ? `<div class="w-10 h-10 rounded-full border-2 border-background ring-2 ${ringClass} overflow-hidden shadow-lg"><img src="${avatar}" class="w-full h-full object-cover" /></div>`
        : `<div class="w-10 h-10 rounded-full border-2 border-background ring-2 ${ringClass} bg-secondary flex items-center justify-center text-foreground font-bold shadow-lg">${name.charAt(0)}</div>`;

      if (markersRef.current[loc.user_id]) {
        markersRef.current[loc.user_id].setLatLng([loc.lat, loc.lng]);
        const icon = L.divIcon({ html, className: 'bg-transparent', iconSize: [40, 40], iconAnchor: [20, 20] });
        markersRef.current[loc.user_id].setIcon(icon);
      } else {
        const icon = L.divIcon({ html, className: 'bg-transparent', iconSize: [40, 40], iconAnchor: [20, 20] });
        const marker = L.marker([loc.lat, loc.lng], { icon }).bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -20] });
        
        markerClusterRef.current.addLayer(marker);
        markersRef.current[loc.user_id] = marker;
        
        if (isMe) {
          mapInstance.current.setView([loc.lat, loc.lng], 16);
        }
      }
      
      if (isMe && mapBounds) {
        if (loc.lat > mapBounds.north || loc.lat < mapBounds.south || loc.lng > mapBounds.east || loc.lng < mapBounds.west) {
          toast.warning("⚠️ You have left the IV area.");
        }
      }
    }
    
    async function renderPoi(poi: any, L: any) {
       if (!L || !mapInstance.current) return;
       const { id, type, lat, lng } = poi;
       if (poiMarkersRef.current[id]) {
          poiMarkersRef.current[id].setLatLng([lat, lng]);
          return;
       }
       
       let emoji = '📍';
       if (type === 'Meeting') emoji = '🤝';
       if (type === 'Restrooms') emoji = '🚻';
       if (type === 'Exit') emoji = '🚪';
       
       const icon = L.divIcon({ 
         html: `<div class="text-2xl">${emoji}</div>`, 
         className: 'bg-transparent',
         iconSize: [24,24],
         iconAnchor: [12,12]
       });
       
       const marker = L.marker([lat, lng], { icon, draggable: role !== 'student' }).addTo(mapInstance.current);
       marker.bindTooltip(type, { permanent: true, direction: 'top', offset: [0, -12] });
       
       if (role !== 'student') {
         marker.on('dragend', async (e: any) => {
            const newPos = e.target.getLatLng();
            const supabase = createClient();
            const { data } = await supabase.from('iv_trips').select('pois').eq('id', tripId).single();
            const pois = data?.pois || [];
            const idx = pois.findIndex((p: any) => p.id === id);
            if (idx > -1) {
              pois[idx].lat = newPos.lat;
              pois[idx].lng = newPos.lng;
              await supabase.from('iv_trips').update({ pois }).eq('id', tripId);
            }
         });
       }
       
       poiMarkersRef.current[id] = marker;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, currentUserId, role, mapBounds]);

  // Click handler wrapper due to poiMode dependency
  useEffect(() => {
     if (!mapInstance.current) return;
     const handler = (e: any) => {
        if (poiMode) {
           addPoi(e.latlng, poiMode);
           setPoiMode(null);
        } else if (role === 'faculty' || role === 'admin') {
           setGatherLatLng(e.latlng);
           setShowGatherModal(true);
        }
     };
     mapInstance.current.on('click', handler);
     return () => {
        if (mapInstance.current) mapInstance.current.off('click', handler);
     };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiMode, role, tripId]);
  
  async function addPoi(latlng: any, type: string) {
     const supabase = createClient();
     const { data } = await supabase.from('iv_trips').select('pois').eq('id', tripId).single();
     const pois = data?.pois || [];
     pois.push({ id: Date.now().toString(), type, lat: latlng.lat, lng: latlng.lng });
     await supabase.from('iv_trips').update({ pois }).eq('id', tripId);
  }

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

  useEffect(() => {
    if (!mapInstance.current || !showHeatmap) {
      if ((window as any)._heatLayer && mapInstance.current) {
        mapInstance.current.removeLayer((window as any)._heatLayer);
        (window as any)._heatLayer = null;
      }
      return;
    }

    const loadHeatmap = async () => {
      const L = (await import('leaflet')).default as any;
      if (!L.heatLayer) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const supabase = createClient();
      const { data } = await supabase.from('iv_location_history').select('lat, lng').eq('iv_trip_id', tripId);
      
      if (data && data.length > 0) {
        const counts: any = {};
        data.forEach(d => {
          const k = `${d.lat.toFixed(4)},${d.lng.toFixed(4)}`;
          counts[k] = (counts[k] || 0) + 1;
        });
        
        const max = Math.max(...Object.values(counts) as number[]);
        const heatPoints = Object.keys(counts).map(k => {
          const [lat, lng] = k.split(',').map(Number);
          return [lat, lng, (counts[k] / max)];
        });

        if ((window as any)._heatLayer) {
          mapInstance.current.removeLayer((window as any)._heatLayer);
        }
        (window as any)._heatLayer = L.heatLayer(heatPoints, { radius: 25, blur: 15, max: 1 }).addTo(mapInstance.current);
      }
    };
    
    loadHeatmap();

    return () => {
      if ((window as any)._heatLayer && mapInstance.current) {
        mapInstance.current.removeLayer((window as any)._heatLayer);
        (window as any)._heatLayer = null;
      }
    };
  }, [showHeatmap, tripId]);

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
    } catch {
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
      
    } catch {
      toast.error("Routing not available");
    }
  };

  const calculateTiles = () => {
    if (!mapBounds) return 0;
    let total = 0;
    for (let z = offlineMinZoom; z <= offlineMaxZoom; z++) {
      const centerLat = (mapBounds.north + mapBounds.south) / 2;
      const centerLng = (mapBounds.east + mapBounds.west) / 2;
      const latRad = centerLat * Math.PI / 180;
      const n = Math.pow(2, z);
      // Tile position approximation for count estimate
      Math.floor(n * ((centerLng + 180) / 360));
      Math.floor(n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2);
      
      const range = z === 12 ? 1 : z === 13 ? 2 : z === 14 ? 4 : 8; // Approximation based on zoom
      total += Math.pow((range * 2 + 1), 2) * 2; // * 2 for both street and satellite
    }
    return total;
  };

  const downloadMap = async () => {
    if (!mapBounds) return;
    setDownloadProgress(0);
    
    try {
      const cache = await caches.open('iv-tiles-v1');
      const urls: string[] = [];
      
      for (let z = offlineMinZoom; z <= offlineMaxZoom; z++) {
        const centerLat = (mapBounds.north + mapBounds.south) / 2;
        const centerLng = (mapBounds.east + mapBounds.west) / 2;
        const latRad = centerLat * Math.PI / 180;
        const n = Math.pow(2, z);
        const xtile = Math.floor(n * ((centerLng + 180) / 360));
        const ytile = Math.floor(n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2);
        
        const range = z === 12 ? 1 : z === 13 ? 2 : z === 14 ? 4 : 8;
        
        for(let i = -range; i <= range; i++) {
          for(let j = -range; j <= range; j++) {
            urls.push(`https://a.tile.openstreetmap.org/${z}/${xtile+i}/${ytile+j}.png`);
            urls.push((process.env.NEXT_PUBLIC_ESRI_TILES || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').replace('{z}', z.toString()).replace('{y}', (ytile+j).toString()).replace('{x}', (xtile+i).toString()));
          }
        }
      }
      
      let done = 0;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res);
        } catch { /* tile fetch failed */ }
        done++;
        setDownloadProgress(Math.round((done / urls.length) * 100));
      }
      
      const stats = { count: urls.length, date: new Date().toISOString() };
      localStorage.setItem(`iv-offline-stats-${tripId}`, JSON.stringify(stats));
      setOfflineStats(stats);
      
      toast.success('Offline map cached successfully!');
      setTimeout(() => setShowOfflineModal(false), 1000);
    } catch {
      toast.error('Download interrupted');
    }
    setDownloadProgress(-1);
  };

  return (
    <div className="relative w-full h-full flex flex-col select-none touch-none">
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
      
      {(role === 'faculty' || role === 'admin') && (
        <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2 bg-card p-2 rounded-lg shadow-lg border border-border">
          <p className="text-xs font-bold text-center mb-1">Add POI</p>
          <button onClick={() => setPoiMode('Meeting')} className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-primary/20 ${poiMode === 'Meeting' ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary'}`} title="Meeting">🤝</button>
          <button onClick={() => setPoiMode('Restrooms')} className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-primary/20 ${poiMode === 'Restrooms' ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary'}`} title="Restrooms">🚻</button>
          <button onClick={() => setPoiMode('Exit')} className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-primary/20 ${poiMode === 'Exit' ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary'}`} title="Exit">🚪</button>
          <button onClick={() => setPoiMode('Custom')} className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-primary/20 ${poiMode === 'Custom' ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary'}`} title="Custom">📍</button>
        </div>
      )}
      
      {poiMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-6 py-2 rounded-full shadow-lg font-bold flex items-center gap-2">
          <Crosshair className="animate-pulse" size={16} /> Click on map to place {poiMode}
          <button onClick={() => setPoiMode(null)} className="ml-2 bg-black/20 p-1 rounded-full"><X size={14}/></button>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
        <Button onClick={() => setShowOfflineModal(true)} variant="secondary" className="clay-card font-bold py-2 px-4 shadow-xl">
          <Download className="mr-2" size={16} /> Offline Map Cache
        </Button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000] flex flex-col items-center">
        <div className="clay-card rounded-full p-2 flex shadow-2xl mb-2 items-center">
          <button 
            onClick={() => setViewMode('2d')} 
            className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${viewMode === '2d' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            2D Map
          </button>
          <button 
            onClick={() => setViewMode('3d')} 
            className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${viewMode === '3d' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            3D Globe
          </button>
        </div>
        
        {viewMode === '2d' && mapInstance.current && (
          <GeofenceManager tripId={tripId} role={role} mapInstance={mapInstance.current} />
        )}
      </div>

      <div 
        className={`w-full h-full z-[500] flex flex-col pt-16 bg-background absolute inset-0 ${viewMode === '3d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {viewMode === '3d' && <IVGlobe tripId={tripId} />}
      </div>

      <div 
        ref={mapContainer} 
        className="w-full h-full z-0 bg-secondary/20 absolute inset-0" 
        style={{ opacity: viewMode === '2d' ? 1 : 0, pointerEvents: viewMode === '2d' ? 'auto' : 'none' }}
      />

      {showOfflineModal && (
        <div className="absolute inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4">
          <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="font-bold text-xl mb-2 flex items-center justify-between">
              Offline Map Cache
              <button onClick={() => setShowOfflineModal(false)}><X size={20} /></button>
            </h3>
            
            {offlineStats && (
              <div className="bg-green-500/10 text-green-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm font-semibold border border-green-500/20">
                <CheckCircle size={16} /> 
                Cached {offlineStats.count} tiles on {new Date(offlineStats.date).toLocaleDateString()}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-4">
              Select zoom levels to download for offline use. Higher zoom levels provide more detail but consume significantly more storage.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold flex justify-between">Min Zoom: {offlineMinZoom}</label>
                <input type="range" min={10} max={18} value={offlineMinZoom} onChange={e => setOfflineMinZoom(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="text-sm font-bold flex justify-between">Max Zoom: {offlineMaxZoom}</label>
                <input type="range" min={10} max={18} value={offlineMaxZoom} onChange={e => setOfflineMaxZoom(Number(e.target.value))} className="w-full" />
              </div>
              
              <div className="bg-secondary/50 p-3 rounded-lg flex items-center gap-3 text-sm">
                <Info size={16} className="text-primary shrink-0" />
                <div>
                  <p>Estimated Tiles: <strong>{calculateTiles()}</strong></p>
                  <p>Estimated Size: <strong>{(calculateTiles() * 0.015).toFixed(1)} MB</strong></p>
                </div>
              </div>
            </div>

            {downloadProgress >= 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Downloading...</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                </div>
              </div>
            )}

            <Button onClick={downloadMap} disabled={downloadProgress >= 0 || !mapBounds} className="w-full font-bold">
              {downloadProgress >= 0 ? 'Downloading...' : 'Start Download'}
            </Button>
          </div>
        </div>
      )}

      {showGatherModal && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
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

      {showZoneModal && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Save Geofence Zone</h3>
            <label className="block text-sm font-bold mb-1">Zone Name</label>
            <input 
              className="w-full bg-background border border-border p-3 rounded-lg mb-4"
              placeholder="E.g. Safe Area"
              value={zoneName}
              onChange={e => setZoneName(e.target.value)}
            />
            <label className="block text-sm font-bold mb-1">Zone Type</label>
            <select 
              className="w-full bg-background border border-border p-3 rounded-lg mb-4"
              value={zoneType}
              onChange={e => setZoneType(e.target.value)}
            >
              <option value="permitted">Permitted (Stay inside)</option>
              <option value="restricted">Restricted (Stay out)</option>
              <option value="danger">Danger (Stay out)</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setShowZoneModal(false); setPendingZoneLayer(null); }}>Cancel</Button>
              <Button onClick={async () => {
                if (!zoneName || !pendingZoneLayer) return;
                const polygon = pendingZoneLayer.getLatLngs()[0].map((p: any) => ({ lat: p.lat, lng: p.lng }));
                const supabase = createClient();
                const { error } = await supabase.from('iv_geofence_zones').insert({
                  iv_trip_id: tripId,
                  name: zoneName,
                  zone_type: zoneType,
                  polygon,
                  created_by: currentUserId
                });
                if (error) {
                  toast.error('Failed to save zone');
                  return;
                }
                const color = zoneType === 'permitted' ? '#10b981' : zoneType === 'danger' ? '#ef4444' : '#f59e0b';
                pendingZoneLayer.setStyle({ color }).bindTooltip(zoneName);
                (window as any)._drawnItems.addLayer(pendingZoneLayer);
                toast.success('Zone saved');
                setShowZoneModal(false);
                setPendingZoneLayer(null);
                setZoneName('');
              }}>Save Zone</Button>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="absolute inset-0 bg-black/90 z-[3000] flex flex-col items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full" onClick={() => setSelectedPhoto(null)}>
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedPhoto} alt="Gallery view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
