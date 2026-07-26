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
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 md:p-12 animate-in fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full h-full bg-gradient-to-br from-indigo-950/80 to-purple-900/80 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-8 border-b border-white/10 bg-black/30 shadow-inner">
          <h2 className="text-3xl font-black flex items-center gap-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            <ImageIcon className="text-pink-400" size={32} /> LIVE PHOTO STREAM
          </h2>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white border border-white/20 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {photos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30 gap-6">
              <Camera size={72} className="opacity-20 animate-pulse" />
              <p className="font-bold text-xl tracking-widest uppercase">No photos yet.</p>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
              {photos.map((p) => {
                const name = p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : 'Unknown';
                return (
                  <div 
                    key={p.id} 
                    className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-3xl bg-black/50 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:-translate-y-2 transition-all duration-300"
                    onClick={() => setSelectedPhoto(p.photo_url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photo_url} alt="Gallery" className="w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 inset-x-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform">
                      <p className="text-white text-sm font-black tracking-wider truncate drop-shadow-md">{name.toUpperCase()}</p>
                      <p className="text-pink-300 font-bold text-xs mt-1 drop-shadow-md">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/40 shadow-inner flex justify-center backdrop-blur-md">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xl px-12 py-5 rounded-full shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:scale-105 transition-transform flex items-center gap-3 border-2 border-white/20"
          >
            <Camera size={28} /> ADD PHOTO TO STREAM
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
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[6000] flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-8 right-8 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 border border-white/20" onClick={() => setSelectedPhoto(null)}>
            <X size={32} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedPhoto} alt="Full view" className="max-w-full max-h-[90vh] object-contain rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,1)] border border-white/10" />
        </div>
      )}
    </div>
  );
}
