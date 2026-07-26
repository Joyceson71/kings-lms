'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import 'leaflet/dist/leaflet.css';

export default function CreateTripModal() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [tripCode, setTripCode] = useState('');
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const rectRef = useRef<any>(null);

  const generateCode = () => {
    setTripCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  useEffect(() => {
    generateCode();
  }, []);

  useEffect(() => {
    if (!showMap || !mapContainer.current) return;
    
    let L: any;
    
    const initMap = async () => {
      L = (await import('leaflet')).default;
      
      if (!mapInstance.current) {
        mapInstance.current = L.map(mapContainer.current).setView([13.0827, 80.2707], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapInstance.current);
        
        let startPoint: any = null;
        
        mapInstance.current.on('mousedown', (e: any) => {
          startPoint = e.latlng;
          mapInstance.current.dragging.disable();
        });
        
        mapInstance.current.on('mousemove', (e: any) => {
          if (!startPoint) return;
          const bounds = L.latLngBounds(startPoint, e.latlng);
          if (rectRef.current) {
            rectRef.current.setBounds(bounds);
          } else {
            rectRef.current = L.rectangle(bounds, { color: '#3b82f6', weight: 2 }).addTo(mapInstance.current);
          }
        });
        
        mapInstance.current.on('mouseup', (e: any) => {
          if (!startPoint) return;
          const bounds = L.latLngBounds(startPoint, e.latlng);
          setMapBounds({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          });
          startPoint = null;
          mapInstance.current.dragging.enable();
        });
      }
    };
    
    initMap();
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [showMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/iv/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, trip_code: tripCode, map_bounds: mapBounds })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Trip created successfully');
      router.push(`/dashboard/iv-tracker/${data.trip.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create trip');
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border p-8 rounded-2xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create New IV Trip</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Trip Name</label>
          <input 
            type="text" 
            required 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2"
            placeholder="e.g. Infosys Campus Visit 2026"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Trip Code</label>
          <div className="flex gap-4 items-center">
            <div className="bg-background border border-border rounded-lg px-4 py-2 font-mono text-lg font-bold tracking-widest text-primary">
              {tripCode}
            </div>
            <Button type="button" variant="outline" onClick={generateCode}>Refresh Code</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Share this code with students to join the tracker.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Map Bounds (Optional)</label>
          {!showMap ? (
            <Button type="button" variant="secondary" onClick={() => setShowMap(true)}>
              Draw Area on Map
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                Click and drag to draw a rectangle bounding box for the IV area. 
                This will be used to cache offline maps and alert students who leave the area.
              </div>
              <div ref={mapContainer} className="w-full h-64 bg-secondary/20 rounded-xl" />
              {mapBounds && (
                <div className="text-xs text-emerald-400 font-mono">
                  Bounds selected: [{mapBounds.north.toFixed(4)}, {mapBounds.west.toFixed(4)}] to [{mapBounds.south.toFixed(4)}, {mapBounds.east.toFixed(4)}]
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="pt-4 flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Trip'}
          </Button>
        </div>
      </form>
    </div>
  );
}
