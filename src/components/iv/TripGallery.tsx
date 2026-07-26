'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface TripGalleryProps {
  tripId: string;
  currentUserId: string;
  onClose: () => void;
}

export default function TripGallery({ tripId, currentUserId, onClose }: TripGalleryProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('iv_messages')
      .select('*, profiles(first_name, last_name)')
      .eq('iv_trip_id', tripId)
      .not('photo_url', 'is', null)
      .order('created_at', { ascending: false }); // newest first
    
    if (data) setPhotos(data);
  };

  useEffect(() => {
    fetchPhotos();

    const channel = supabase.channel(`gallery-${tripId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iv_messages', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
        if (payload.new.photo_url) {
          // We need to fetch the profile info for the new message to display the name
          supabase.from('profiles').select('first_name, last_name').eq('id', payload.new.sender_id).single().then(({ data }) => {
            const enriched = { ...payload.new, profiles: data };
            setPhotos(prev => [enriched, ...prev]);
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading('Uploading to gallery...', { id: 'gallery-upload' });

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('iv-photos')
      .upload(`trips/${tripId}/${fileName}`, file);

    if (uploadError) {
      toast.error('Upload failed', { id: 'gallery-upload' });
      return;
    }

    const { data: publicUrl } = supabase.storage.from('iv-photos').getPublicUrl(data.path);

    let lat = null, lng = null;
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (_) {}
    }

    await supabase.from('iv_messages').insert({
      iv_trip_id: tripId,
      sender_id: currentUserId,
      photo_url: publicUrl.publicUrl,
      is_broadcast: false,
      lat,
      lng
    });

    toast.success('Photo added to gallery', { id: 'gallery-upload' });
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-background flex flex-col animate-in slide-in-from-bottom">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ImageIcon className="text-primary" /> Live Photo Stream
        </h2>
        <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:bg-secondary/80">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
            <Camera size={48} className="opacity-20" />
            <p>No photos yet. Be the first to add one!</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {photos.map((p) => {
              const name = p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : 'Unknown';
              return (
                <div 
                  key={p.id} 
                  className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-xl bg-secondary/50 border border-border"
                  onClick={() => setSelectedPhoto(p.photo_url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo_url} alt="Gallery" className="w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                    <p className="text-white text-xs font-bold truncate">{name}</p>
                    <p className="text-white/70 text-[10px]">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card flex justify-center">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-full shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Camera size={20} /> Add Photo
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleUpload} 
        />
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 z-[3000] flex flex-col items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70" onClick={() => setSelectedPhoto(null)}>
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedPhoto} alt="Full view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
