'use client';

import { Crosshair, X } from 'lucide-react';

interface POIToolbarProps {
  role: 'student' | 'faculty' | 'admin';
  poiMode: 'Meeting' | 'Restrooms' | 'Exit' | 'Custom' | null;
  setPoiMode: (mode: 'Meeting' | 'Restrooms' | 'Exit' | 'Custom' | null) => void;
}

export function POIToolbar({ role, poiMode, setPoiMode }: POIToolbarProps) {
  if (role !== 'faculty' && role !== 'admin') return null;

  return (
    <>
      <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2 bg-card p-2 rounded-lg shadow-lg border border-border">
        <p className="text-xs font-bold text-center mb-1">Add POI</p>
        <button onClick={() => setPoiMode('Meeting')} className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-primary/20 ${poiMode === 'Meeting' ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary'}`} title="Meeting">🤝</button>
        <button onClick={() => setPoiMode('Restrooms')} className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-primary/20 ${poiMode === 'Restrooms' ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary'}`} title="Restrooms">🚻</button>
        <button onClick={() => setPoiMode('Exit')} className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-primary/20 ${poiMode === 'Exit' ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary'}`} title="Exit">🚪</button>
        <button onClick={() => setPoiMode('Custom')} className={`w-10 h-10 rounded flex items-center justify-center text-xl hover:bg-primary/20 ${poiMode === 'Custom' ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary'}`} title="Custom">📍</button>
      </div>
      
      {poiMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-6 py-2 rounded-full shadow-lg font-bold flex items-center gap-2">
          <Crosshair className="animate-pulse" size={16} /> Click on map to place {poiMode}
          <button onClick={() => setPoiMode(null)} className="ml-2 bg-black/20 p-1 rounded-full"><X size={14}/></button>
        </div>
      )}
    </>
  );
}
