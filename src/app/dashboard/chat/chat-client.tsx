'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2, MessageSquare, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_role: string;
  user_avatar: string | null;
  user_department: string | null;
}

export default function GlobalChatClient({ 
  initialMessages, 
  currentUserId,
  currentUserRole
}: { 
  initialMessages: ChatMessage[],
  currentUserId: string,
  currentUserRole: string
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Scroll to bottom on load
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });

    // Set up Realtime subscription
    const channel = supabase.channel('global_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_messages' },
        async (payload) => {
          // We need to fetch the profile data for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role, avatar_url, department')
            .eq('id', payload.new.user_id)
            .single();

          const incomingMsg: ChatMessage = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            user_name: profile?.full_name || 'Unknown User',
            user_role: profile?.role || 'student',
            user_avatar: profile?.avatar_url || null,
            user_department: profile?.department || null,
          };

          setMessages((prev) => {
            // Avoid duplicates in case local state updated first
            if (prev.find(m => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'global_messages' },
        (payload) => {
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage(''); // optimistic clear

    startTransition(async () => {
      const { error } = await supabase
        .from('global_messages')
        .insert({ content, user_id: currentUserId });
      
      if (error) {
        console.error('Failed to send message:', error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (currentUserRole !== 'admin') return;
    
    // Optimistic UI update
    setMessages(prev => prev.filter(m => m.id !== id));
    
    await supabase
      .from('global_messages')
      .delete()
      .eq('id', id);
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <ShieldCheck className="w-3 h-3 text-amber-400" />;
    if (role === 'faculty') return <UserCheck className="w-3 h-3 text-violet-400" />;
    return <GraduationCap className="w-3 h-3 text-indigo-400" />;
  };

  const getRoleColor = (role: string) => {
    if (role === 'admin') return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
    if (role === 'faculty') return 'text-violet-400 border-violet-400/20 bg-violet-400/10';
    return 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-border/40 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-black tracking-tight" >
              <span className="gradient-text">Global Chat</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">Join the discussion with students and faculty.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1.5 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Real-time Active
          </Badge>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto py-6 pr-4 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.user_id === currentUserId;
            const timeStr = new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={msg.id} className={`flex gap-4 group ${isSelf ? 'flex-row-reverse' : ''}`}>
                <Avatar 
                  name={msg.user_name} 
                  src={msg.user_avatar || undefined} 
                  size="md" 
                  className="shrink-0 mt-1" 
                />
                
                <div className={`flex flex-col max-w-[75%] ${isSelf ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1.5 ${isSelf ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-semibold text-foreground">
                      {isSelf ? 'You' : msg.user_name}
                    </span>
                    <Badge variant="outline" className={`h-5 text-[10px] px-1.5 flex items-center gap-1 font-medium ${getRoleColor(msg.user_role)}`}>
                      {getRoleIcon(msg.user_role)}
                      {msg.user_role.charAt(0).toUpperCase() + msg.user_role.slice(1)}
                    </Badge>
                    {!isSelf && msg.user_department && (
                      <span className="text-xs text-muted-foreground">{msg.user_department}</span>
                    )}
                    <span className="text-xs text-muted-foreground/60">{timeStr}</span>
                  </div>
                  
                  <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isSelf 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-[#111113] border border-[#1f1f23] text-foreground rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                    
                    {currentUserRole === 'admin' && (
                      <button 
                        onClick={() => handleDelete(msg.id)}
                        className={`absolute top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isSelf ? '-left-10' : '-right-10'}`}
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="pt-4 shrink-0 mt-auto flex gap-3 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 bg-secondary/40 border-border/40 h-12 rounded-xl px-4 focus-visible:ring-1"
          maxLength={1000}
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || pending}
          className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all"
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
      </form>
    </div>
  );
}
