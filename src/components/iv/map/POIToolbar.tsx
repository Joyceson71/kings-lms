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
      <div className="absolute top-24 right-4 z-[1000] flex flex-col gap-3 bg-background/70 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/10">
        <p className="text-xs font-bold text-center mb-1 text-foreground/80 tracking-wide uppercase">Add POI</p>
        <button onClick={() => setPoiMode('Meeting')} className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-105 ${poiMode === 'Meeting' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-secondary/50 hover:bg-secondary/80 text-foreground'}`} title="Meeting">🤝</button>
        <button onClick={() => setPoiMode('Restrooms')} className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-105 ${poiMode === 'Restrooms' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-secondary/50 hover:bg-secondary/80 text-foreground'}`} title="Restrooms">🚻</button>
        <button onClick={() => setPoiMode('Exit')} className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-105 ${poiMode === 'Exit' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-secondary/50 hover:bg-secondary/80 text-foreground'}`} title="Exit">🚪</button>
        <button onClick={() => setPoiMode('Custom')} className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-105 ${poiMode === 'Custom' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-secondary/50 hover:bg-secondary/80 text-foreground'}`} title="Custom">📍</button>
      </div>
      
      {poiMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-primary/90 backdrop-blur-md text-primary-foreground px-6 py-3 rounded-full shadow-2xl font-semibold flex items-center gap-3 border border-white/20 animate-in slide-in-from-top-4 duration-300">
          <Crosshair className="animate-pulse" size={18} /> 
          <span className="tracking-wide">Click on map to place <strong className="font-bold">{poiMode}</strong></span>
          <button onClick={() => setPoiMode(null)} className="ml-3 hover:bg-black/30 p-1.5 rounded-full transition-colors"><X size={16}/></button>
        </div>
      )}
    </>
  );
}
