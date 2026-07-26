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
        className="absolute top-4 right-4 z-[1000] bg-primary text-primary-foreground p-3 rounded-full shadow-xl"
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-0 right-0 h-full w-full md:w-60 bg-card border-l border-border z-[1500] flex flex-col shadow-2xl transition-transform">
          <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
            <h3 className="font-bold text-lg flex items-center gap-2"><MessageSquare size={18} /> Chat</h3>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isMe = m.sender_id === currentUserId;
              const name = m.profiles ? `${m.profiles.first_name} ${m.profiles.last_name}` : 'Unknown';
              const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

              return (
                <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} ${m.is_broadcast ? 'border-2 border-yellow-500 rounded-lg p-2 bg-yellow-500/10' : ''}`}>
                  {!isMe && (
                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-bold">{isMe ? 'You' : name}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {m.is_broadcast && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold">BROADCAST</span>}
                    </div>
                    {m.content && (
                      <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                        {m.content}
                      </div>
                    )}
                    {m.photo_url && (
                      <img 
                        src={m.photo_url} 
                        alt="attachment" 
                        className="max-h-20 rounded-lg cursor-pointer hover:opacity-80 mt-1 border border-border"
                        onClick={() => setFullPhoto(m.photo_url)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-border bg-background">
            {(role === 'faculty' || role === 'admin') && (
              <label className="flex items-center gap-2 mb-2 text-xs font-bold text-yellow-600 cursor-pointer">
                <input type="checkbox" checked={isBroadcast} onChange={e => setIsBroadcast(e.target.checked)} />
                Send as Broadcast
              </label>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground">
                <ImageIcon size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhoto} />
              
              <input 
                type="text" 
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Message..."
                className="flex-1 bg-secondary/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none"
              />
              <button onClick={handleSend} className="p-2 bg-primary text-primary-foreground rounded-full shrink-0">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {fullPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[3000] flex items-center justify-center p-4" onClick={() => setFullPhoto(null)}>
          <img src={fullPhoto} alt="full" className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 right-4 text-white"><X size={32} /></button>
        </div>
      )}
    </>
  );
}
