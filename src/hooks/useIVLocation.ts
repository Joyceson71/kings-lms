import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { App } from '@capacitor/app';

export function useIVLocation(tripId: string, userId: string, active: boolean) {
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number; isOnline: boolean } | null>(null);
  const wakeLockRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
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
            // Take the latest ping for this trip and user
            const latest = pings.reverse().find((p: any) => p.user_id === userId && p.iv_trip_id === tripId);
            if (latest) {
              latest.is_online = true; // since we are online now
              await supabase.from('iv_locations').upsert(latest, { onConflict: 'user_id,iv_trip_id' });
            }
            // Clear synced records
            const clearTx = db.transaction('pings', 'readwrite');
            clearTx.objectStore('pings').clear();
          }
        };
      } catch (err) {
        console.error('Manual sync error:', err);
      }
    };

    // Capacitor App State listener for syncing when app comes to foreground
    const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        syncOfflineData();
      }
    });
    
    window.addEventListener('online', syncOfflineData);
    syncOfflineData();

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
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
          console.warn('Geolocation error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }

    return () => {
      window.removeEventListener('online', syncOfflineData);
      appStateListener.then(l => l.remove()).catch(console.error);
      
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    };
  }, [active, tripId, userId]);

  return location;
}
