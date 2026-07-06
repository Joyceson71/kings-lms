'use client';

import { Bell, CheckCircle2, Clock, AlertCircle, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { getNotifications, markNotificationRead } from '@/lib/supabase/queries';
import { useUser } from '@/lib/hooks/use-user';
import { useEffect, useState } from 'react';

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'warning' | 'info';
  read: boolean;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Assignment Graded',
    message: 'Your assignment "Binary Tree Implementation" was graded: A+',
    time: '2 mins ago',
    type: 'success',
    read: false,
  },
  {
    id: '2',
    title: 'Live Session Starting',
    message: 'Digital Signal Processing starts in 10 minutes.',
    time: '10 mins ago',
    type: 'info',
    read: false,
  },
  {
    id: '3',
    title: 'Attendance Warning',
    message: 'Your attendance in EC-303 dropped below 75%.',
    time: '1 hour ago',
    type: 'warning',
    read: true,
  },
];

export function NotificationsPopover({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useUser();

  useEffect(() => {
    async function loadNotifications() {
      if (!profile?.id) return;
      const supabase = createClient();
      const notifs = await getNotifications(supabase, profile.id);
      setNotifications(notifs.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: new Date(n.created_at).toLocaleDateString(),
        type: n.type === 'error' ? 'warning' : n.type,
        read: n.is_read,
      })));
      setIsLoading(false);
    }
    loadNotifications();
  }, [profile]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    const supabase = createClient();
    await markNotificationRead(supabase, id);
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    const supabase = createClient();
    for (const n of notifications.filter(notif => !notif.read)) {
      await markNotificationRead(supabase, n.id);
    }
  };

  return (
    <div 
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border/60 shadow-2xl z-50 overflow-hidden animate-slide-in-up"
      style={{ background: 'oklch(0.11 0.02 265)', backdropFilter: 'blur(20px)' }}
    >
      <div className="p-3 border-b border-border/50 flex items-center justify-between bg-secondary/20">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="active" className="px-1.5 py-0 h-4 text-[10px]">{unreadCount} New</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[10px] text-primary hover:text-primary/80 font-medium px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs">
            No notifications yet
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "p-3 flex items-start gap-3 border-b border-border/20 text-left transition-colors hover:bg-secondary/40 relative group",
                  !notif.read && "bg-primary/5"
                )}
              >
                {!notif.read && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                
                <div className={cn(
                  "mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  notif.type === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                  notif.type === 'warning' ? "bg-red-500/10 text-red-400" :
                  "bg-sky-500/10 text-sky-400"
                )}>
                  {notif.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                   notif.type === 'warning' ? <AlertCircle className="h-4 w-4" /> :
                   <Clock className="h-4 w-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold truncate", notif.read ? "text-foreground/80" : "text-foreground")}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
                    {notif.time}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
