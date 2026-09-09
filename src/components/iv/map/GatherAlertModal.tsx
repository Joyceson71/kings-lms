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
    <div className="absolute inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h3 className="font-bold text-lg mb-4">Send Gather Alert</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Broadcast a message and pin to all students.
        </p>
        <input 
          className="w-full bg-background border border-border p-3 rounded-lg mb-4"
          placeholder="E.g. Meet here in 10 mins"
          value={gatherMessage}
          onChange={e => setGatherMessage(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={sendGatherAlert}>Send Alert</Button>
        </div>
      </div>
    </div>
  );
}
