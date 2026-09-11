'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { IVGlobe } from '@/components/iv/IVGlobe';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Custom Hooks
import type { Map, MarkerClusterGroup, FeatureGroup, Layer, Polygon, LeafletMouseEvent } from 'leaflet';
import { useIVMapOffline } from '@/hooks/useIVMapOffline';
import { useIVMapRealtime } from '@/hooks/useIVMapRealtime';

// Modals & UI Components
import { OfflineMapModal } from './map/OfflineMapModal';
import { GatherAlertModal } from './map/GatherAlertModal';
import { ZoneManagerModal } from './map/ZoneManagerModal';
import { POIToolbar } from './map/POIToolbar';
import { IVGeofenceZone } from '@/types/iv';

interface IVMapProps {
  tripId: string;
  currentUserId: string;
  role: 'student' | 'faculty' | 'admin';
  mapBounds?: { north: number; south: number; east: number; west: number } | null;
  showHeatmap?: boolean;
}

export default function IVMap({ tripId, currentUserId, role, mapBounds, showHeatmap }: IVMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const markerClusterRef = useRef<MarkerClusterGroup | null>(null);
  const drawnItemsRef = useRef<FeatureGroup | null>(null);
  const heatLayerRef = useRef<Layer | null>(null);
  const routingControl = useRef<unknown>(null);

  const [zones, setZones] = useState<IVGeofenceZone[]>([]);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  
  // Modals & States
  const [showGatherModal, setShowGatherModal] = useState(false);
  const [gatherLatLng, setGatherLatLng] = useState<{lat: number, lng: number} | null>(null);
  
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [pendingZoneLayer, setPendingZoneLayer] = useState<Polygon | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Initialize Custom Hooks
  const { 
    showOfflineModal, setShowOfflineModal, downloadProgress, 
    offlineMinZoom, setOfflineMinZoom, offlineMaxZoom, setOfflineMaxZoom, 
    offlineStats, calculateTiles, downloadMap 
  } = useIVMapOffline(tripId, mapBounds);

  const { gatherPoint, poiMode, setPoiMode, markersRef } = useIVMapRealtime(tripId, currentUserId, role, mapInstance, markerClusterRef);

  const fetchZones = useCallback(async () => {
    const supabase = createClient();
    const { data: fetchedZones } = await supabase.from('iv_geofence_zones').select('*').eq('iv_trip_id', tripId);
    if (fetchedZones && drawnItemsRef.current) {
      setZones(fetchedZones as IVGeofenceZone[]);
      drawnItemsRef.current.clearLayers();
      const leafletModule = await import('leaflet');
      const leafletInstance: any = leafletModule.default;
      
      fetchedZones.forEach((zone: IVGeofenceZone) => {
        try {
          const color = zone.zone_type === 'permitted' ? '#10b981' : zone.zone_type === 'danger' ? '#ef4444' : '#f59e0b';
          const points = typeof zone.polygon === 'string' ? JSON.parse(zone.polygon) : zone.polygon;
          const polygon = leafletInstance.polygon((points as {lat: number, lng: number}[]).map((p: any) => [p.lat, p.lng]), { color }).bindTooltip(zone.name);
          drawnItemsRef.current?.addLayer(polygon);
        } catch (err) {
          console.warn('Invalid polygon data for zone', zone.id);
        }
      });
    }
  }, [tripId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    let L: any;

    const initMap = async () => {
      const leafletModule = await import('leaflet');
      L = leafletModule.default;
      window.L = L;
      
      await import('leaflet.markercluster');
      
      // internal leaflet property
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconUrl: iconUrl.src, iconRetinaUrl: iconRetinaUrl.src, shadowUrl: shadowUrl.src });
      
      try {
        await import('leaflet-routing-machine');
        await import('leaflet-draw');
      } catch (err) {
        console.warn('Map plugins failed to load', err);
      }

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapContainer.current!, { drawControl: false }).setView([13.0827, 80.2707], 13);
        
        const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
        const satellite = L.tileLayer(process.env.NEXT_PUBLIC_ESRI_TILES || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
        
        L.control.layers({ "Street Map": streetMap, "Satellite": satellite }).addTo(mapInstance.current);
        streetMap.addTo(mapInstance.current);

        markerClusterRef.current = L.markerClusterGroup({ disableClusteringAtZoom: 16 });
        mapInstance.current?.addLayer(markerClusterRef.current!);

        const drawnItems = new L.FeatureGroup();
        mapInstance.current?.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;

        if (role === 'faculty' || role === 'admin') {
          const drawControl = new L.Control.Draw({
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
          mapInstance.current?.addControl(drawControl);

          mapInstance.current?.on(L.Draw.Event.CREATED, (e: { layer: Polygon }) => {
            setPendingZoneLayer(e.layer);
            setShowZoneModal(true);
          });
        }
      }

      fetchZones();
    };

    initMap();
  }, [role, fetchZones]);

  // Add click handler for Gather Alert and POI
  useEffect(() => {
    if (!mapInstance.current) return;
    const handler = async (e: LeafletMouseEvent) => {
      if (poiMode) {
        const supabase = createClient();
        const { data } = await supabase.from('iv_trips').select('pois').eq('id', tripId).single();
        const pois = data?.pois || [];
        pois.push({ id: Date.now().toString(), type: poiMode, lat: e.latlng.lat, lng: e.latlng.lng });
        await supabase.from('iv_trips').update({ pois }).eq('id', tripId);
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
  }, [poiMode, role, tripId, setPoiMode]);

  // Heatmap layer handling
  useEffect(() => {
    if (!mapInstance.current || !showHeatmap) {
      if (heatLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    const loadHeatmap = async () => {
      const L = (await import('leaflet')).default;
      if (!(L as any).heatLayer) {
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
        const counts: Record<string, number> = {};
        data.forEach(d => {
          const k = `${d.lat.toFixed(4)},${d.lng.toFixed(4)}`;
          counts[k] = (counts[k] || 0) + 1;
        });
        
        const max = Math.max(...Object.values(counts) as number[]);
        const heatPoints = Object.keys(counts).map(k => {
          const [lat, lng] = k.split(',').map(Number);
          return [lat, lng, (counts[k] / max)];
        });

        if (heatLayerRef.current) {
          mapInstance.current?.removeLayer(heatLayerRef.current);
        }
        heatLayerRef.current = (L as any).heatLayer(heatPoints, { radius: 25, blur: 15, max: 1 }).addTo(mapInstance.current);
      }
    };
    
    loadHeatmap();

    return () => {
      if (heatLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [showHeatmap, tripId]);

  const navigateToGather = async () => {
    if (!gatherPoint || !markersRef.current[currentUserId] || !mapInstance.current) return;
    const myLoc = markersRef.current[currentUserId].getLatLng();
    
    try {
      const L = (await import('leaflet')).default;
      await import('leaflet-routing-machine');
      
      if (routingControl.current) {
        mapInstance.current.removeControl(routingControl.current as any);
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

  return (
    <div className="relative w-full h-full flex flex-col select-none touch-none">
      
      <POIToolbar role={role} poiMode={poiMode} setPoiMode={setPoiMode} />

      {gatherPoint && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-primary/90 backdrop-blur-md text-primary-foreground px-6 py-3 rounded-full shadow-2xl font-semibold flex items-center gap-3 border border-white/20 animate-in slide-in-from-top-4 duration-300">
          <span className="tracking-wide">Gathering point active!</span>
          <Button onClick={navigateToGather} variant="secondary" className="h-8 rounded-full font-bold shadow-md hover:scale-105 transition-transform text-xs px-4">
            Navigate
          </Button>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
        <Button onClick={() => setShowOfflineModal(true)} variant="secondary" className="bg-background/80 backdrop-blur-md border border-white/10 font-bold py-3 px-5 shadow-2xl hover:shadow-primary/20 hover:scale-105 transition-all duration-300 rounded-2xl">
          <Download className="mr-2 text-primary" size={18} /> Offline Cache
        </Button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000] flex flex-col items-center">
        <div className="bg-background/70 backdrop-blur-md border border-white/10 rounded-full p-1.5 flex shadow-2xl mb-2 items-center gap-1">
          <button 
            onClick={() => setViewMode('2d')} 
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${viewMode === '2d' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-foreground/70 hover:bg-white/10 hover:text-foreground'}`}
          >
            2D Map
          </button>
          <button 
            onClick={() => setViewMode('3d')} 
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${viewMode === '3d' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-foreground/70 hover:bg-white/10 hover:text-foreground'}`}
          >
            3D Globe
          </button>
        </div>
        
        {viewMode === '2d' && mapInstance.current && (role === 'faculty' || role === 'admin') && (
          <div className="absolute top-24 left-6 z-[2000] bg-background/70 backdrop-blur-xl p-5 rounded-3xl border border-white/10 pointer-events-auto shadow-2xl max-w-sm w-72">
            <h3 className="font-bold text-xs tracking-widest uppercase text-primary mb-1">Zone Manager</h3>
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">Draw polygons on the map to define zones.</p>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {zones.map(z => (
                <div key={z.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 group transition-colors hover:bg-black/30">
                  <span className="text-sm font-semibold truncate text-foreground/90">{z.name}</span>
                  <button 
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.from('iv_geofence_zones').delete().eq('id', z.id);
                      fetchZones();
                    }} 
                    className="text-destructive hover:text-red-400 text-xs font-bold ml-4 shrink-0 opacity-80 hover:opacity-100 transition-opacity bg-destructive/10 px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {zones.length === 0 && <p className="text-sm italic text-foreground/50 text-center py-4 bg-black/10 rounded-xl border border-dashed border-white/10">No zones created.</p>}
            </div>
          </div>
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

      <OfflineMapModal 
        show={showOfflineModal} 
        onClose={() => setShowOfflineModal(false)}
        offlineStats={offlineStats}
        offlineMinZoom={offlineMinZoom}
        setOfflineMinZoom={setOfflineMinZoom}
        offlineMaxZoom={offlineMaxZoom}
        setOfflineMaxZoom={setOfflineMaxZoom}
        calculateTiles={calculateTiles}
        downloadProgress={downloadProgress}
        downloadMap={downloadMap}
        canDownload={!!mapBounds}
      />

      <GatherAlertModal 
        show={showGatherModal} 
        onClose={() => setShowGatherModal(false)} 
        tripId={tripId} 
        gatherLatLng={gatherLatLng} 
      />

      <ZoneManagerModal 
        show={showZoneModal} 
        onClose={() => setShowZoneModal(false)}
        tripId={tripId}
        currentUserId={currentUserId}
        pendingZoneLayer={pendingZoneLayer}
        drawnItemsRef={drawnItemsRef}
        onZoneSaved={fetchZones}
      />
    </div>
  );
}
