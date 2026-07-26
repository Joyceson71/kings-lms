'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface TripChatProps {
  tripId: string;
  currentUserId: string;
  role: 'student' | 'faculty' | 'admin';
  userName: string;
}

export default function TripChat({ tripId, currentUserId, role, userName }: TripChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fullPhoto, setFullPhoto] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('iv_messages')
      .select('*, profiles(first_name, last_name)')
      .eq('iv_trip_id', tripId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
    }
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel(`chat-${tripId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iv_messages', filter: `iv_trip_id=eq.${tripId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        if (!isOpen) setUnreadCount(c => c + 1);
        setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!text.trim()) return;
    
    let lat = null, lng = null;
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        // ignore location error for messages
      }
    }

    const { error } = await supabase.from('iv_messages').insert({
      iv_trip_id: tripId,
      sender_id: currentUserId,
      content: text.trim(),
      is_broadcast: isBroadcast,
      lat,
      lng
    });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    if (isBroadcast) {
      fetch('/api/iv/broadcast-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iv_trip_id: tripId, message: text.trim(), sender_name: userName })
      });
    }

    setText('');
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading('Uploading photo...', { id: 'photo-upload' });

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('iv-photos')
      .upload(`trips/${tripId}/${fileName}`, file);

    if (uploadError) {
      toast.error('Upload failed', { id: 'photo-upload' });
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

    toast.success('Photo sent', { id: 'photo-upload' });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 right-4 z-[2000] bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:scale-110 transition-transform border-2 border-white/20"
      >
        <MessageSquare size={28} />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-black w-7 h-7 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(250,204,21,1)] border-2 border-black">
            {unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-4 right-4 bottom-4 w-full md:w-[400px] bg-gradient-to-br from-indigo-950/80 to-purple-900/80 backdrop-blur-3xl z-[2500] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/20 rounded-[2rem] overflow-hidden animate-in slide-in-from-right">
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/30 shadow-inner">
            <h3 className="font-black text-2xl flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              <MessageSquare size={24} className="text-pink-400" /> CHAT
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full"><X size={24} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m) => {
              const isMe = m.sender_id === currentUserId;
              const name = m.profiles ? `${m.profiles.first_name} ${m.profiles.last_name}` : 'Unknown';
              const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

              return (
                <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-sm font-black text-white shadow-lg border-2 border-white/20">
                      {initials}
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-bold text-white/70">{isMe ? 'YOU' : name.toUpperCase()}</span>
                      <span className="text-[10px] text-white/40">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {m.is_broadcast && <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(250,204,21,0.8)] font-black tracking-widest">BROADCAST</span>}
                    </div>
                    {m.content && (
                      <div className={`px-5 py-3 rounded-3xl text-sm font-medium ${
                        m.is_broadcast 
                          ? 'bg-yellow-400/20 text-yellow-100 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] text-lg' 
                          : isMe 
                            ? 'bg-pink-600/50 text-white border border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                            : 'bg-white/10 text-white border border-white/20 backdrop-blur-md'
                      }`}>
                        {m.content}
                      </div>
                    )}
                    {m.photo_url && (
                      <img 
                        src={m.photo_url} 
                        alt="attachment" 
                        className="max-h-32 rounded-2xl cursor-pointer hover:scale-105 transition-transform mt-2 border-2 border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        onClick={() => setFullPhoto(m.photo_url)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/10 bg-black/40 shadow-inner">
            {(role === 'faculty' || role === 'admin') && (
              <label className="flex items-center gap-2 mb-3 text-xs font-black text-yellow-400 cursor-pointer uppercase tracking-wider">
                <input type="checkbox" checked={isBroadcast} onChange={e => setIsBroadcast(e.target.checked)} className="accent-yellow-400 w-4 h-4" />
                Broadcast Alert
              </label>
            )}
            <div className="flex items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/20">
                <ImageIcon size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhoto} />
              
              <input 
                type="text" 
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-black/50 border border-white/20 rounded-full px-5 py-3 text-white text-sm focus:outline-none focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.5)] placeholder:text-white/30"
              />
              <button onClick={handleSend} className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:scale-105 transition-transform border border-white/20">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {fullPhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[5000] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setFullPhoto(null)}>
          <img src={fullPhoto} alt="full" className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10" />
          <button className="absolute top-8 right-8 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 border border-white/20"><X size={32} /></button>
        </div>
      )}
    </>
  );
}
