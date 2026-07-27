import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { toast } from 'sonner';

export function useIVLocation(tripId: string, userId: string, active: boolean, batterySaver: boolean = false) {
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number; isOnline: boolean } | null>(null);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const supabase = createClient();
  const wakeLockRef = useRef<any>(null);
  const watchIdRef = useRef<string | number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const fetchCP = async () => {
      const { data } = await supabase.from('iv_checkpoints').select('*').eq('iv_trip_id', tripId);
      if (data) setCheckpoints(data);
    };
    fetchCP();
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

    const fetchGeofences = async () => {
      const { data } = await supabase.from('iv_geofence_zones').select('*').eq('iv_trip_id', tripId);
      if (data) geofences = data;
      
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
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open('iv-offline', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('pings', {autoIncrement:true});
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        const tx = db.transaction('pings', 'readwrite');
        const store = tx.objectStore('pings');
        const getAllReq = store.getAll();
        
        getAllReq.onsuccess = async () => {
          const pings = getAllReq.result;
          if (pings && pings.length > 0) {
            const latest = pings.reverse().find((p: any) => p.user_id === userId && p.iv_trip_id === tripId);
            if (latest) {
              latest.is_online = true; 
              await supabase.from('iv_locations').upsert(latest, { onConflict: 'user_id,iv_trip_id' });
            }
            const clearTx = db.transaction('pings', 'readwrite');
            clearTx.objectStore('pings').clear();
          }
        };
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
        supabase.from('iv_locations').upsert(ping, { onConflict: 'user_id,iv_trip_id' })
          .then(({ error }) => { if (error) console.error('Failed to upsert location', error); });
      } else {
        try {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const req = indexedDB.open('iv-offline', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('pings', {autoIncrement:true});
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });

          await new Promise((resolve, reject) => {
            const tx = db.transaction('pings', 'readwrite');
            const store = tx.objectStore('pings');
            const req = store.add(ping);
            req.onsuccess = resolve;
            req.onerror = reject;
          });

          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const sw = await navigator.serviceWorker.ready;
            await (sw as any).sync.register('iv-location-sync');
          }
        } catch (err) {
          console.error('Offline storage error:', err);
        }
      }

      if (checkpoints.length > 0) {
        checkpoints.forEach(async (cp) => {
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
              } catch (e) {
                // ignore
              }
            }
          }
        });
      }

      if (geofences.length > 0) {
        for (const zone of geofences) {
          const inside = isPointInPolygon({lat, lng}, zone.polygon);
          const isBreach = (zone.zone_type === 'permitted' && !inside) || (zone.zone_type !== 'permitted' && inside);
          
          if (isBreach) {
            const lastBreach = localStorage.getItem(`iv-breach-${zone.id}`);
            if (!lastBreach || Date.now() - Number(lastBreach) > 60000 * 5) {
              localStorage.setItem(`iv-breach-${zone.id}`, Date.now().toString());
              
              await supabase.from('iv_geofence_events').insert({
                zone_id: zone.id,
                user_id: userId,
                event_type: zone.zone_type === 'permitted' ? 'exit' : 'enter',
                lat, lng
              });
              
              fetch('/api/iv/geofence-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ iv_trip_id: tripId, user_id: userId, zone_id: zone.id, lat, lng })
              });
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
            toast.error('Location permission denied for app.');
            return;
          }
        }
        
        const id = await Geolocation.watchPosition({
          enableHighAccuracy: !batterySaver,
          maximumAge: batterySaver ? 30000 : 10000,
          timeout: batterySaver ? 15000 : 20000
        }, (position, err) => {
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
            (error) => {
              console.warn('Geolocation error:', error);
            },
            { 
              enableHighAccuracy: !batterySaver, 
              maximumAge: batterySaver ? 30000 : 10000, 
              timeout: batterySaver ? 15000 : 20000 
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
        } catch (err) {
           if ('geolocation' in navigator) {
             navigator.geolocation.getCurrentPosition(
               (pos) => processLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
               () => {},
               { enableHighAccuracy: !batterySaver, timeout: 10000 }
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

      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    };
  }, [active, tripId, userId, batterySaver]);

  return location;
}
