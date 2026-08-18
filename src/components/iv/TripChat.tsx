'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${date.toLocaleDateString()} ${timeStr}`;
}

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
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const handleOnline = async () => {
      if (offlineQueue.length > 0) {
        for (const msg of offlineQueue) {
          await supabase.from('iv_messages').insert(msg);
        }
        setOfflineQueue([]);
        toast.success('Offline messages sent!');
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [offlineQueue, supabase]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('iv_messages')
      .select('*, profiles(full_name)')
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

    const dbMsg = {
      iv_trip_id: tripId,
      sender_id: currentUserId,
      content: text.trim(),
      is_broadcast: isBroadcast,
      lat,
      lng
    };

    if (!navigator.onLine) {
      setOfflineQueue(prev => [...prev, dbMsg]);
      setMessages(prev => [...prev, { ...dbMsg, id: `offline-${Date.now()}`, profiles: { full_name: userName }, created_at: new Date().toISOString(), isOffline: true }]);
      toast.info('Message queued (Offline)');
      setText('');
      return;
    }

    const { error } = await supabase.from('iv_messages').insert(dbMsg);

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
        className="absolute top-4 right-4 z-[2000] bg-background text-foreground p-4 rounded-full shadow-lg hover:bg-muted transition-colors border border-border"
      >
        <MessageSquare size={28} />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-sm">
            {unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-4 right-4 bottom-4 w-full md:w-[400px] bg-background/95 backdrop-blur-sm z-[2500] flex flex-col shadow-2xl border border-border rounded-[2rem] overflow-hidden animate-in slide-in-from-right">
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20 shadow-sm">
            <h3 className="font-bold text-xl flex items-center gap-3 text-foreground">
              <MessageSquare size={24} className="text-muted-foreground" /> CHAT
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full"><X size={20} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m) => {
              const isMe = m.sender_id === currentUserId;
              const name = m.profiles?.full_name || 'Unknown';
              const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

              return (
                <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div className="w-10 h-10 shrink-0 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground shadow-sm border border-border">
                      {initials}
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">{isMe ? 'YOU' : name.toUpperCase()}</span>
                      <span className="text-[10px] text-muted-foreground/60">{formatMessageTime(m.created_at)}</span>
                      {m.is_broadcast && <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded shadow-sm font-bold tracking-widest">BROADCAST</span>}
                    </div>
                    {m.content && (
                      <div className={`px-5 py-3 rounded-2xl text-sm font-medium ${
                        m.is_broadcast 
                          ? 'bg-destructive/10 text-destructive border-2 border-destructive/30 shadow-sm text-lg' 
                          : isMe 
                            ? 'bg-primary text-primary-foreground border border-primary shadow-sm' 
                            : 'bg-muted text-foreground border border-border'
                      }`}>
                        {m.content}
                        {m.isOffline && <span className="block text-[10px] mt-1 opacity-70">Queued...</span>}
                      </div>
                    )}
                    {m.photo_url && (
                      <img 
                        src={m.photo_url} 
                        alt="attachment" 
                        className="max-h-32 rounded-xl cursor-pointer hover:scale-105 transition-transform mt-2 border border-border shadow-sm"
                        onClick={() => setFullPhoto(m.photo_url)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-border bg-muted/20 shadow-sm">
            {(role === 'faculty' || role === 'admin') && (
              <label className="flex items-center gap-2 mb-3 text-xs font-bold text-destructive cursor-pointer uppercase tracking-wider">
                <input type="checkbox" checked={isBroadcast} onChange={e => setIsBroadcast(e.target.checked)} className="accent-destructive w-4 h-4" />
                Broadcast Alert
              </label>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-muted hover:bg-muted/80 rounded-xl text-muted-foreground transition-colors border border-border">
                <ImageIcon size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhoto} />
              
              <input 
                type="text" 
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              />
              <button onClick={handleSend} className="p-3 bg-primary text-primary-foreground rounded-xl shrink-0 shadow-sm hover:opacity-90 transition-opacity">
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
