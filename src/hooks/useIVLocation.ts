import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useIVLocation(tripId: string, userId: string, active: boolean) {
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number; isOnline: boolean } | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!active) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
      return;
    }


    const supabase = createClient();

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

    const pingLocation = () => {
      if (!('geolocation' in navigator)) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
          let battery: number | null = null;
          
          try {
            if ('getBattery' in navigator) {
              const bm = await (navigator as any).getBattery();
              battery = Math.round(bm.level * 100);
            }
          } catch (_) {}

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
            // Send directly
            supabase.from('iv_locations').upsert(ping, { onConflict: 'user_id,iv_trip_id' })
              .then(({ error }) => {
                if (error) console.error('Failed to upsert location', error);
              });
          } else {
            // Offline fallback
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
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    };

    pingLocation();
    const intervalId = setInterval(pingLocation, 5000);

    return () => {
      clearInterval(intervalId);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    };
  }, [active, tripId, userId]);

  return location;
}
