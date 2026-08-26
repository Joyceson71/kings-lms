'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Circle, MapPin, Plus, Trash2, CalendarClock, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface TripItineraryProps {
  tripId: string;
  role: 'student' | 'faculty' | 'admin';
  currentUserId: string;
}

export default function TripItinerary({ tripId, role, currentUserId }: TripItineraryProps) {
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [arrivals, setArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCheckpoints();
    
    const channel = supabase.channel(`checkpoints-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_checkpoints', filter: `iv_trip_id=eq.${tripId}` }, fetchCheckpoints)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iv_checkpoint_arrivals' }, fetchCheckpoints)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const fetchCheckpoints = async () => {
    const { data: cp } = await supabase.from('iv_checkpoints').select('*').eq('iv_trip_id', tripId).order('order_index', { ascending: true });
    if (cp) setCheckpoints(cp);

    if (cp && cp.length > 0) {
      const { data: arr } = await supabase.from('iv_checkpoint_arrivals').select('*').in('checkpoint_id', cp.map(c => c.id));
      if (arr) setArrivals(arr);
    }
    setLoading(false);
  };

  const addMockCheckpoint = async () => {
    const newCp = {
      iv_trip_id: tripId,
      title: `Checkpoint ${checkpoints.length + 1}`,
      description: 'Automatically added checkpoint',
      lat: 13.0827 + (Math.random() * 0.01),
      lng: 80.2707 + (Math.random() * 0.01),
      order_index: checkpoints.length
    };
    const { error } = await supabase.from('iv_checkpoints').insert(newCp);
    if (error) toast.error('Failed to add checkpoint');
    else toast.success('Checkpoint added');
  };

  const deleteCheckpoint = async (id: string) => {
    await supabase.from('iv_checkpoints').delete().eq('id', id);
  };

  const handlePhotoUpload = async (checkpointId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhotoId(checkpointId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${checkpointId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('iv_photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('iv_photos')
        .getPublicUrl(fileName);

      const photoUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('iv_checkpoint_arrivals')
        .update({ photo_url: photoUrl })
        .eq('checkpoint_id', checkpointId)
        .eq('user_id', currentUserId);

      if (updateError) throw updateError;
      
      toast.success('Photo uploaded successfully');
      fetchCheckpoints();
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhotoId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading itinerary...</div>;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden border-l border-border w-full md:w-96 shadow-2xl z-[2000]">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/20 text-primary rounded-xl">
            <CalendarClock size={24} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Itinerary</h2>
        </div>
        <p className="text-sm text-muted-foreground">Track the group's progress through scheduled stops.</p>
        
        {(role === 'faculty' || role === 'admin') && (
          <button onClick={addMockCheckpoint} className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-colors border border-primary/20 text-sm">
            <Plus size={16} /> Add Stop
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
        {checkpoints.length === 0 ? (
          <div className="text-center text-muted-foreground mt-12">
            <MapPin size={48} className="mx-auto opacity-20 mb-4" />
            <p>No itinerary stops planned yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border -z-10" />
            
            {checkpoints.map((cp) => {
              const myArrival = arrivals.find(a => a.checkpoint_id === cp.id && a.user_id === currentUserId);
              const totalArrived = arrivals.filter(a => a.checkpoint_id === cp.id).length;
              
              return (
                <div key={cp.id} className="relative flex gap-4 items-start group">
                  <div className="bg-background shrink-0 mt-1">
                    {myArrival ? (
                      <CheckCircle2 size={32} className="text-emerald-500 bg-background" />
                    ) : (
                      <Circle size={32} className="text-muted-foreground bg-background" />
                    )}
                  </div>
                  
                  <div className="flex-1 bg-card border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
                    {(role === 'faculty' || role === 'admin') && (
                      <button onClick={() => deleteCheckpoint(cp.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    <h3 className={`font-bold ${myArrival ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {cp.title}
                    </h3>
                    {cp.description && <p className="text-sm text-muted-foreground mt-1">{cp.description}</p>}
                    
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded-md">
                          <MapPin size={12} /> {totalArrived} Arrived
                        </span>
                        {myArrival && (
                          <span className="text-emerald-500">
                            ✓ Checked in at {new Date(myArrival.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      
                      {myArrival && (
                        <div className="mt-1">
                          {myArrival.photo_url ? (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border mt-2 shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={myArrival.photo_url} alt="Checkpoint proof" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                            </div>
                          ) : (
                            <label className={`inline-flex items-center justify-center gap-2 mt-2 px-4 py-2 text-xs font-bold rounded-xl border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 cursor-pointer transition-colors w-full sm:w-auto ${uploadingPhotoId === cp.id ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Camera size={16} />
                              {uploadingPhotoId === cp.id ? 'Uploading...' : 'Upload Photo Proof'}
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(cp.id, e)} />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
