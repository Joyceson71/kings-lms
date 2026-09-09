import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { IVAlert, IVSosEvent, IVPoi } from '@/types/iv';

import type { Map, MarkerClusterGroup, Marker, Polyline, CircleMarker } from 'leaflet';

export function useIVMapRealtime(tripId: string, currentUserId: string, role: string, mapInstanceRef: React.MutableRefObject<Map | null>, markerClusterRef: React.MutableRefObject<MarkerClusterGroup | null>) {
  const [gatherPoint, setGatherPoint] = useState<{lat: number, lng: number, message: string} | null>(null);
  const [poiMode, setPoiMode] = useState<'Meeting' | 'Restrooms' | 'Exit' | 'Custom' | null>(null);
  const [, setTrackedUserId] = useState<string | null>(null);

  const markersRef = useRef<{ [key: string]: Marker }>({});
  const messageMarkersRef = useRef<{ [key: string]: Marker }>({});
  const poiMarkersRef = useRef<{ [key: string]: Marker }>({});
  const profilesRef = useRef<{ [userId: string]: any }>({});
  const userTrailsRef = useRef<Record<string, {lat: number, lng: number}[]>>({});
  const trailLayersRef = useRef<Record<string, Polyline>>({});
  const gatherMarkerRef = useRef<CircleMarker | null>(null);

  useEffect(() => {
    let L: any;
    if (typeof window !== 'undefined') {
      import('leaflet').then(leaflet => {
        L = leaflet.default;
      });
    }

    const initData = async () => {
      const supabase = createClient();
      
      const { data: tripData } = await supabase.from('iv_trips').select('pois').eq('id', tripId).single();
      if (tripData?.pois) {
        tripData.pois.forEach((poi: any) => renderPoi(poi));
      }

      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url');
      if (profiles) {
        profiles.forEach(p => { profilesRef.current[p.id] = p; });
      }

      const { data: initialLocs } = await supabase.from('iv_locations').select('*').eq('iv_trip_id', tripId);
      if (initialLocs) {
        initialLocs.forEach(l => updateMarker(l));
      }

      const { data: existingPhotos } = await supabase.from('iv_messages').select('*').eq('iv_trip_id', tripId).not('photo_url', 'is', null);
      if (existingPhotos) {
        existingPhotos.forEach(msg => renderMessage(msg, true));
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_locations', filter: `iv_trip_id=eq.${tripId}` }, (payload) => updateMarker(payload.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iv_alerts', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
          const al = payload.new as IVAlert;
          if (al.gather_lat && al.gather_lng) {
            setGatherPoint({ lat: al.gather_lat, lng: al.gather_lng, message: al.message });
            toast.info(`Gather Alert: ${al.message}`);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_sos_events', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
          const sos = payload.new as IVSosEvent;
          if (!sos.resolved_at && markersRef.current[sos.student_id] && mapInstanceRef.current) {
            (markersRef.current[sos.student_id] as any).setStyle({ fillColor: '#dc2626', className: 'animate-pulse' });
            mapInstanceRef.current?.flyTo([sos.lat, sos.lng], 16);
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'iv_trips', filter: `id=eq.${tripId}` }, (payload) => {
           if (payload.new.pois) {
             payload.new.pois.forEach((poi: any) => renderPoi(poi));
           }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iv_messages', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
          renderMessage(payload.new as any, false);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initData();

    function renderMessage(msg: any, isInitialLoad: boolean) {
      if (!msg.lat || !msg.lng || !L || !mapInstanceRef.current) return;
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
      const marker = L.marker([msg.lat, msg.lng], { icon }).addTo(mapInstanceRef.current);
      
      if (msg.photo_url) {
        if (msg.content) marker.bindTooltip(msg.content, { direction: 'top', offset: [0, -24] });
      } else {
        marker.bindTooltip(msg.content, { permanent: true, direction: 'top', offset: [0, -32] }).openTooltip();
        if (!isInitialLoad) {
          setTimeout(() => {
            if (mapInstanceRef.current && messageMarkersRef.current[msg.id]) {
              mapInstanceRef.current.removeLayer(messageMarkersRef.current[msg.id]);
              delete messageMarkersRef.current[msg.id];
            }
          }, 600000);
        }
      }
      
      messageMarkersRef.current[msg.id] = marker;
    }

    function updateMarker(loc: any) {
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
        
        marker.on('click', () => {
           setTrackedUserId(loc.user_id);
           toast.info(`Following ${name}`);
        });

        markerClusterRef.current.addLayer(marker);
        markersRef.current[loc.user_id] = marker;
        
        if (isMe) {
          mapInstanceRef.current?.setView([loc.lat, loc.lng], 16);
        }
      }

      if (!userTrailsRef.current[loc.user_id]) userTrailsRef.current[loc.user_id] = [];
      userTrailsRef.current[loc.user_id].push({ lat: loc.lat, lng: loc.lng });
      
      if (trailLayersRef.current[loc.user_id]) {
         trailLayersRef.current[loc.user_id].setLatLngs(userTrailsRef.current[loc.user_id]);
      } else {
         const trailColor = isMe ? '#10b981' : (loc.role === 'faculty' ? '#ef4444' : '#3b82f6');
         const polyline = L.polyline(userTrailsRef.current[loc.user_id], { color: trailColor, weight: 3, opacity: 0.6, dashArray: '5, 10' });
         trailLayersRef.current[loc.user_id] = polyline;
         mapInstanceRef.current?.addLayer(polyline);
      }

      setTrackedUserId(prev => {
         if (prev === loc.user_id && mapInstanceRef.current) {
            mapInstanceRef.current?.setView([loc.lat, loc.lng]);
         }
         return prev;
      });
    }
    
    function renderPoi(poi: IVPoi) {
       if (!L || !mapInstanceRef.current) return;
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
       
       const marker = L.marker([lat, lng], { icon, draggable: role !== 'student' }).addTo(mapInstanceRef.current);
       marker.bindTooltip(type, { permanent: true, direction: 'top', offset: [0, -12] });
       
       if (role !== 'student') {
         marker.on('dragend', async (e: import('leaflet').DragEndEvent) => {
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
  }, [tripId, currentUserId, role]);

  useEffect(() => {
    if (!gatherPoint || !mapInstanceRef.current) return;
    
    import('leaflet').then((L) => {
      if (gatherMarkerRef.current) {
        mapInstanceRef.current?.removeLayer(gatherMarkerRef.current);
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
      
      gatherMarkerRef.current.addTo(mapInstanceRef.current!);
    });
  }, [gatherPoint, mapInstanceRef]);

  return {
    gatherPoint,
    setGatherPoint,
    poiMode,
    setPoiMode,
    setTrackedUserId,
    markersRef,
  };
}
