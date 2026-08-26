'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';

interface GeofenceManagerProps {
  tripId: string;
  mapInstance: any;
  role: 'student' | 'faculty' | 'admin';
}

export default function GeofenceManager({ tripId, mapInstance, role }: GeofenceManagerProps) {
  const [zones, setZones] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (role !== 'faculty' && role !== 'admin') return;
    if (!mapInstance || typeof window === 'undefined') return;

    const L = (window as any).L;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('leaflet-draw');

    // Initialize the FeatureGroup to store editable layers
    const drawnItems = new L.FeatureGroup();
    mapInstance.addLayer(drawnItems);

    // Initialize the draw control and pass it the FeatureGroup of editable layers
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#ef4444',
            weight: 3
          }
        },
        polyline: false,
        circle: false,
        rectangle: true,
        marker: false,
        circlemarker: false
      }
    });

    mapInstance.addControl(drawControl);

    const handleDrawCreated = async (e: any) => {
      const layer = e.layer;
      
      drawnItems.addLayer(layer);

      
      // Convert layer to GeoJSON-like polygon coordinates
      const latlngs = layer.getLatLngs()[0].map((ll: any) => ({ lat: ll.lat, lng: ll.lng }));
      
      const zoneName = prompt("Enter a name for this Danger Zone:", "Restricted Area");
      if (!zoneName) {
        drawnItems.removeLayer(layer);
        return;
      }

      toast.loading('Saving geofence...', { id: 'save-zone' });
      const { error } = await supabase.from('iv_geofence_zones').insert({
        iv_trip_id: tripId,
        name: zoneName,
        polygon: JSON.stringify(latlngs),
        is_safe_zone: false
      });

      if (error) {
        toast.error('Failed to save geofence', { id: 'save-zone' });
        drawnItems.removeLayer(layer);
      } else {
        toast.success('Geofence saved', { id: 'save-zone' });
        fetchZones();
      }
    };

    mapInstance.on(L.Draw.Event.CREATED, handleDrawCreated);

    fetchZones(drawnItems, L);

    return () => {
      mapInstance.removeControl(drawControl);
      mapInstance.removeLayer(drawnItems);
      mapInstance.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance, role, tripId]);

  const fetchZones = async (group?: any, LObj?: any) => {
    const { data } = await supabase.from('iv_geofence_zones').select('*').eq('iv_trip_id', tripId);
    if (data) {
      setZones(data);
      if (group && LObj) {
        group.clearLayers();
        data.forEach(z => {
          try {
            const points = typeof z.polygon === 'string' ? JSON.parse(z.polygon) : z.polygon;
            const polygonLayer = LObj.polygon(points, { color: z.is_safe_zone ? '#10b981' : '#ef4444' });
            polygonLayer.bindTooltip(z.name);
            group.addLayer(polygonLayer);
          } catch { /* invalid polygon coords — skip */ }
        });
      }
    }
  };

  if (role !== 'faculty' && role !== 'admin') return null;

  return (
    <div className="absolute top-24 left-4 z-[2000] bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-border pointer-events-auto shadow-lg max-w-xs">
      <h3 className="font-bold text-sm tracking-widest uppercase text-muted-foreground mb-2">Zone Manager</h3>
      <p className="text-xs text-foreground mb-3">Use the drawing tools on the map to define Danger Zones.</p>
      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
        {zones.map(z => (
          <div key={z.id} className="flex justify-between items-center bg-card p-2 rounded-lg border border-border">
            <span className="text-sm font-medium truncate">{z.name}</span>
            <button 
              onClick={async () => {
                await supabase.from('iv_geofence_zones').delete().eq('id', z.id);
                fetchZones((window as any)._ivDrawnItems, (window as any).L);
              }} 
              className="text-destructive hover:text-red-700 text-xs font-bold"
            >
              Delete
            </button>
          </div>
        ))}
        {zones.length === 0 && <p className="text-xs italic text-muted-foreground">No zones created.</p>}
      </div>
    </div>
  );
}
