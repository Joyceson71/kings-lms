'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface GatherAlertModalProps {
  show: boolean;
  onClose: () => void;
  tripId: string;
  gatherLatLng: { lat: number; lng: number } | null;
}

export function GatherAlertModal({ show, onClose, tripId, gatherLatLng }: GatherAlertModalProps) {
  const [gatherMessage, setGatherMessage] = useState('');

  if (!show || !gatherLatLng) return null;

  const sendGatherAlert = async () => {
    if (!gatherMessage) return;
    try {
      const res = await fetch('/api/iv/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iv_trip_id: tripId,
          message: gatherMessage,
          gather_lat: gatherLatLng.lat,
          gather_lng: gatherLatLng.lng
        })
      });
      if (!res.ok) throw new Error('Failed to send');
      toast.success('Gather alert sent');
      onClose();
      setGatherMessage('');
    } catch {
      toast.error('Could not send alert');
    }
  };

  return (
    <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/10 w-full max-w-sm animate-in zoom-in-95 duration-300">
        <h3 className="font-extrabold text-xl mb-2 text-foreground tracking-tight">Send Gather Alert</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Broadcast a message and set a temporary gathering pin for all students.
        </p>
        <div className="space-y-4">
          <input 
            className="w-full bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 p-3.5 rounded-xl transition-all duration-200 text-foreground placeholder:text-muted-foreground/70 outline-none"
            placeholder="E.g. Meet here in 10 mins"
            value={gatherMessage}
            onChange={e => setGatherMessage(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={onClose} className="rounded-xl font-semibold hover:bg-secondary/80">Cancel</Button>
            <Button onClick={sendGatherAlert} className="rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">Send Alert</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
