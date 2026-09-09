'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ZoneManagerModalProps {
  show: boolean;
  onClose: () => void;
  tripId: string;
  currentUserId: string;
  pendingZoneLayer: any;
  drawnItemsRef: React.MutableRefObject<any>;
  onZoneSaved: () => void;
}

export function ZoneManagerModal({
  show,
  onClose,
  tripId,
  currentUserId,
  pendingZoneLayer,
  drawnItemsRef,
  onZoneSaved
}: ZoneManagerModalProps) {
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState('permitted');

  if (!show || !pendingZoneLayer) return null;

  const saveZone = async () => {
    if (!zoneName || !pendingZoneLayer) return;
    
    // In Leaflet, polygons are accessed via getLatLngs()[0]
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
    drawnItemsRef.current?.addLayer(pendingZoneLayer);
    
    toast.success('Zone saved');
    onZoneSaved();
    setZoneName('');
  };

  return (
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
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={saveZone}>Save Zone</Button>
        </div>
      </div>
    </div>
  );
}
