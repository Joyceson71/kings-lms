import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { toast } from 'sonner';

export function useIVLocation(tripId: string, userId: string, active: boolean, batterySaver: boolean = false) {
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number; isOnline: boolean } | null>(null);
  const checkpointsRef = useRef<any[]>([]);
  const supabase = createClient();
  const wakeLockRef = useRef<any>(null);
  const watchIdRef = useRef<string | number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const fetchCP = async () => {
      const { data } = await supabase.from('iv_checkpoints').select('*').eq('iv_trip_id', tripId);
      if (data) checkpointsRef.current = data;
    };
    fetchCP();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tripId]);

  useEffect(() => {
    if (!active) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
      if (watchIdRef.current !== null) {
        if (typeof watchIdRef.current === 'string') {
          Geolocation.clearWatch({ id: watchIdRef.current }).catch(console.error);
        } else if ('geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchIdRef.current as number);
        }
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let geofences: any[] = [];
    let geofenceChannel: any = null;

    const fetchGeofences = async () => {
      const { data } = await supabase.from('iv_geofence_zones').select('*').eq('iv_trip_id', tripId);
      if (data) geofences = data;
      
      geofenceChannel = supabase.channel(`geofences-${tripId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_geofence_zones', filter: `iv_trip_id=eq.${tripId}` }, async () => {
          const { data: refreshed } = await supabase.from('iv_geofence_zones').select('*').eq('iv_trip_id', tripId);
          if (refreshed) geofences = refreshed;
        }).subscribe();
      
      const { data: tripData } = await supabase.from('iv_trips').select('attendance_session_id').eq('id', tripId).single();
      if (tripData?.attendance_session_id && !localStorage.getItem(`iv-attendance-${tripData.attendance_session_id}`)) {
         fetch('/api/attendance/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: tripData.attendance_session_id, user_id: userId, verification_method: 'location' })
         }).then(res => {
            if (res.ok) localStorage.setItem(`iv-attendance-${tripData.attendance_session_id}`, 'true');
         }).catch(() => {});
      }
    };

    const isPointInPolygon = (point: {lat: number, lng: number}, polygon: {lat: number, lng: number}[]) => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const intersect = ((yi > point.lng) !== (yj > point.lng)) && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        console.warn('Wake Lock error:', err.message);
      }
    };
    requestWakeLock();
    fetchGeofences();

    const syncOfflineData = async () => {
      if (!navigator.onLine) return;
      try {
        const q = JSON.parse(localStorage.getItem('iv_ping_queue') || '[]');
        if (q.length) {
          const { error } = await supabase.from('iv_locations').upsert(q, { onConflict: 'user_id,iv_trip_id' });
          if (!error) {
             const history = q.map((p: any) => ({ iv_trip_id: p.iv_trip_id, user_id: p.user_id, lat: p.lat, lng: p.lng, recorded_at: p.queued_at || p.updated_at }));
             await supabase.from('iv_location_history').insert(history).then();
             localStorage.removeItem('iv_ping_queue');
          }
        }

        const bq = JSON.parse(localStorage.getItem('iv_breach_queue') || '[]');
        if (bq.length) {
           const events = bq.map((b: any) => ({
              zone_id: b.zone_id,
              user_id: b.user_id,
              event_type: b.event_type,
              lat: b.lat,
              lng: b.lng,
              created_at: b.queued_at
           }));
           const { error: bErr } = await supabase.from('iv_geofence_events').insert(events);
           if (!bErr) {
              localStorage.removeItem('iv_breach_queue');
              bq.forEach((b: any) => {
                 fetch('/api/iv/geofence-alert', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ iv_trip_id: b.iv_trip_id, user_id: b.user_id, zone_id: b.zone_id, lat: b.lat, lng: b.lng })
                 }).catch(() => {});
              });
           }
        }
      } catch (err) {
        console.error('Manual sync error:', err);
      }
    };

    let appStateListener: any = null;
    try {
      appStateListener = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          syncOfflineData();
        }
      });
    } catch (err) {
      console.warn('Capacitor App API not available', err);
    }
    
    window.addEventListener('online', syncOfflineData);
    syncOfflineData();

    const processLocation = async (lat: number, lng: number, accuracy: number) => {
      const now = Date.now();
      const minInterval = batterySaver ? 60000 : 10000;
      if (now - lastUpdateRef.current < minInterval) return;
      lastUpdateRef.current = now;

      let battery: number | null = null;
      try {
        if ('getBattery' in navigator) {
          const bm = await (navigator as any).getBattery();
          battery = Math.round(bm.level * 100);
        }
      } catch {}

      const isOnline = navigator.onLine;
      setLocation({ lat, lng, accuracy, isOnline });

      const ping = {
        user_id: userId,
        iv_trip_id: tripId,
        lat,
        lng,
        accuracy,
        battery,
        is_online: isOnline,
        updated_at: new Date().toISOString()
      };

      if (isOnline) {
        const sendLoc = async () => {
          const { data } = await supabase.from('iv_locations').select('id').eq('user_id', userId).eq('iv_trip_id', tripId).maybeSingle();
          if (data?.id) {
            await supabase.from('iv_locations').update(ping).eq('id', data.id);
          } else {
            await supabase.from('iv_locations').insert(ping);
          }
          await supabase.from('iv_location_history').insert({
             iv_trip_id: tripId,
             user_id: userId,
             lat,
             lng
          });
        };
        sendLoc().catch(err => console.error('Failed to update location', err));
      } else {
        try {
          const q = JSON.parse(localStorage.getItem('iv_ping_queue') || '[]');
          q.push({ ...ping, queued_at: new Date().toISOString() });
          localStorage.setItem('iv_ping_queue', JSON.stringify(q));
          
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const sw = await navigator.serviceWorker.ready;
            await (sw as any).sync.register('iv-location-sync');
          }
        } catch (err) {
          console.error('Offline storage error:', err);
        }
      }

      if (checkpointsRef.current.length > 0) {
        checkpointsRef.current.forEach(async (cp) => {
          const R = 6371e3;
          const φ1 = lat * Math.PI/180, φ2 = cp.lat * Math.PI/180;
          const Δφ = (cp.lat - lat) * Math.PI/180;
          const Δλ = (cp.lng - lng) * Math.PI/180;
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;
          if (dist <= (cp.radius_meters || 50)) {
            const { error } = await supabase.from('iv_checkpoint_arrivals').insert({
              checkpoint_id: cp.id,
              user_id: userId
            });
            if (!error) {
              toast.success(`Arrived at ${cp.title || 'checkpoint'}!`);
              try {
                await Haptics.notification({ type: NotificationType.Success });
              } catch {
                // ignore haptics error
              }
            }
          }
        });
      }

      if (geofences.length > 0) {
        let isInsideAnyPermitted = false;
        let hasPermittedZones = false;
        const permittedZones = geofences.filter(z => z.zone_type === 'permitted');
        
        if (permittedZones.length > 0) {
          hasPermittedZones = true;
          for (const zone of permittedZones) {
             if (isPointInPolygon({lat, lng}, zone.polygon)) {
                isInsideAnyPermitted = true;
                break;
             }
          }
        }
        
        const activeBreaches: any[] = [];
        
        if (hasPermittedZones && !isInsideAnyPermitted) {
           let closestZone = permittedZones[0];
           let minDistance = Infinity;
           
           for (const zone of permittedZones) {
             if (zone.polygon && zone.polygon.length > 0) {
               const pt = zone.polygon[0];
               const dist = Math.pow(pt.lat - lat, 2) + Math.pow(pt.lng - lng, 2);
               if (dist < minDistance) {
                 minDistance = dist;
                 closestZone = zone;
               }
             }
           }
           activeBreaches.push(closestZone);
        }
        
        const dangerZones = geofences.filter(z => z.zone_type !== 'permitted');
        for (const zone of dangerZones) {
           if (isPointInPolygon({lat, lng}, zone.polygon)) {
             activeBreaches.push(zone);
           }
        }
        
        const queueBreach = (zoneId: string, zoneType: string) => {
          try {
            const bq = JSON.parse(localStorage.getItem('iv_breach_queue') || '[]');
            bq.push({
              iv_trip_id: tripId, user_id: userId, zone_id: zoneId,
              event_type: zoneType === 'permitted' ? 'exit' : 'enter',
              lat, lng, queued_at: new Date().toISOString()
            });
            localStorage.setItem('iv_breach_queue', JSON.stringify(bq));
          } catch (err) {}
        };

        for (const zone of activeBreaches) {
           const lastBreach = localStorage.getItem(`iv-breach-${zone.id}`);
           if (!lastBreach || Date.now() - Number(lastBreach) > 60000 * 5) {
             localStorage.setItem(`iv-breach-${zone.id}`, Date.now().toString());
             
             if (isOnline) {
                supabase.from('iv_geofence_events').insert({
                  zone_id: zone.id,
                  user_id: userId,
                  event_type: zone.zone_type === 'permitted' ? 'exit' : 'enter',
                  lat, lng
                }).then();
                
                fetch('/api/iv/geofence-alert', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ iv_trip_id: tripId, user_id: userId, zone_id: zone.id, lat, lng })
                }).catch(() => {
                   queueBreach(zone.id, zone.zone_type);
                });
             } else {
                queueBreach(zone.id, zone.zone_type);
             }
           }
        }
      }
    };

    const startTracking = async () => {
      const minInterval = batterySaver ? 60000 : 10000;
      
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            throw new Error('Capacitor permission denied, falling back');
          }
        }
        
        const id = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }, (position, err: any) => {
          if (err) {
            console.warn('Capacitor Geolocation error:', err);
            return;
          }
          if (position) {
            processLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
          }
        });
        
        watchIdRef.current = id;
      } catch (err) {
        console.warn('Capacitor Geolocation failed, falling back to browser API', err);
        
        if ('geolocation' in navigator) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              processLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
            },
            (error: any) => {
              console.warn('Geolocation error:', error);
              if (error.code === 1) toast.error("Location permission denied. Enable in browser settings.");
              else if (error.code === 2) toast.error("Location unavailable. Try moving outdoors.");
              else if (error.code === 3) {
                toast.error("GPS timeout. Retrying...");
                // Note: The browser API or interval below handles the retry automatically
              }
            },
            { 
              enableHighAccuracy: true, 
              maximumAge: 5000, 
              timeout: 10000 
            }
          );
        }
      }

      // Robust fallback interval to ensure location updates aren't frozen by browser background throttling
      intervalRef.current = setInterval(async () => {
        const now = Date.now();
        if (now - lastUpdateRef.current < minInterval) return;
        
        try {
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: !batterySaver,
            timeout: 10000
          });
          processLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        } catch {
           if ('geolocation' in navigator) {
             navigator.geolocation.getCurrentPosition(
               (pos) => processLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
               (error: any) => {
                  console.warn('Geolocation error fallback polling:', error);
               },
               { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
             );
           }
        }
      }, minInterval + 5000); // Check 5s after minimum interval
    };

    startTracking();

    return () => {
      window.removeEventListener('online', syncOfflineData);
      if (appStateListener) {
        appStateListener.then((l: any) => l.remove()).catch(console.error);
      }
      
      if (watchIdRef.current !== null) {
        if (typeof watchIdRef.current === 'string') {
          Geolocation.clearWatch({ id: watchIdRef.current }).catch(console.error);
        } else if ('geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchIdRef.current as number);
        }
        watchIdRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (geofenceChannel) {
        supabase.removeChannel(geofenceChannel);
      }

      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tripId, userId, batterySaver]);

  return location;
}
