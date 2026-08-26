import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, CheckCircle2, AlertCircle, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const notifs = notifications || [];

  return (
    <div className="p-8 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with alerts and announcements.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {notifs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p>You have no notifications at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifs.map((notif: any) => (
              <div
                key={notif.id}
                className={`p-5 flex gap-4 transition-colors hover:bg-secondary/40 ${!notif.read ? 'bg-primary/5' : ''}`}
              >
                <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                  notif.type === 'warning' || notif.type === 'attendance_warning' ? 'bg-red-500/10 text-red-400' :
                  'bg-sky-500/10 text-sky-400'
                }`}>
                  {notif.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                   notif.type === 'warning' || notif.type === 'attendance_warning' ? <AlertCircle className="h-5 w-5" /> :
                   <Bell className="h-5 w-5" />}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold ${notif.read ? 'text-foreground/80' : 'text-foreground'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notif.body}</p>
                  
                  {notif.link && (
                    <a href={notif.link} className="text-xs text-primary font-medium hover:underline">
                      View details &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
