import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useIVMapOffline(tripId: string, mapBounds: { north: number; south: number; east: number; west: number } | null | undefined) {
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [offlineMinZoom, setOfflineMinZoom] = useState(12);
  const [offlineMaxZoom, setOfflineMaxZoom] = useState(15);
  const [offlineStats, setOfflineStats] = useState<{ count: number; date: string } | null>(null);

  useEffect(() => {
    const s = localStorage.getItem(`iv-offline-stats-${tripId}`);
    if (s) setOfflineStats(JSON.parse(s));
  }, [tripId]);

  const calculateTiles = () => {
    if (!mapBounds) return 0;
    let total = 0;
    for (let z = offlineMinZoom; z <= offlineMaxZoom; z++) {
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

  return {
    showOfflineModal,
    setShowOfflineModal,
    downloadProgress,
    offlineMinZoom,
    setOfflineMinZoom,
    offlineMaxZoom,
    setOfflineMaxZoom,
    offlineStats,
    calculateTiles,
    downloadMap
  };
}
