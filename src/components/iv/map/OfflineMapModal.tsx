'use client';

import { X, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineMapModalProps {
  show: boolean;
  onClose: () => void;
  offlineStats: { count: number; date: string } | null;
  offlineMinZoom: number;
  setOfflineMinZoom: (val: number) => void;
  offlineMaxZoom: number;
  setOfflineMaxZoom: (val: number) => void;
  calculateTiles: () => number;
  downloadProgress: number;
  downloadMap: () => void;
  canDownload: boolean;
}

export function OfflineMapModal({
  show,
  onClose,
  offlineStats,
  offlineMinZoom,
  setOfflineMinZoom,
  offlineMaxZoom,
  setOfflineMaxZoom,
  calculateTiles,
  downloadProgress,
  downloadMap,
  canDownload
}: OfflineMapModalProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-md">
        <h3 className="font-bold text-xl mb-2 flex items-center justify-between">
          Offline Map Cache
          <button onClick={onClose}><X size={20} /></button>
        </h3>
        
        {offlineStats && (
          <div className="bg-green-500/10 text-green-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm font-semibold border border-green-500/20">
            <CheckCircle size={16} /> 
            Cached {offlineStats.count} tiles on {new Date(offlineStats.date).toLocaleDateString()}
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mb-4">
          Select zoom levels to download for offline use. Higher zoom levels provide more detail but consume significantly more storage.
        </p>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-bold flex justify-between">Min Zoom: {offlineMinZoom}</label>
            <input type="range" min={10} max={18} value={offlineMinZoom} onChange={e => setOfflineMinZoom(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="text-sm font-bold flex justify-between">Max Zoom: {offlineMaxZoom}</label>
            <input type="range" min={10} max={18} value={offlineMaxZoom} onChange={e => setOfflineMaxZoom(Number(e.target.value))} className="w-full" />
          </div>
          
          <div className="bg-secondary/50 p-3 rounded-lg flex items-center gap-3 text-sm">
            <Info size={16} className="text-primary shrink-0" />
            <div>
              <p>Estimated Tiles: <strong>{calculateTiles()}</strong></p>
              <p>Estimated Size: <strong>{(calculateTiles() * 0.015).toFixed(1)} MB</strong></p>
            </div>
          </div>
        </div>

        {downloadProgress >= 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Downloading...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
            </div>
          </div>
        )}

        <Button onClick={downloadMap} disabled={downloadProgress >= 0 || !canDownload} className="w-full font-bold">
          {downloadProgress >= 0 ? 'Downloading...' : 'Start Download'}
        </Button>
      </div>
    </div>
  );
}
