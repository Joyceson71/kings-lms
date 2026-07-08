'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Search, Filter, Plus, ArrowRight, Megaphone, Calendar as CalendarIcon, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

type AnnouncementType = {
  id: string;
  title: string;
  content: string;
  type: 'global' | 'course';
  courseName?: string;
  author: string;
  date: string;
  color: string;
  glow: string;
  icon: React.ReactNode;
};
const initialAnnouncements = [
  {
    id: '1',
    title: 'System Maintenance Scheduled',
    content: 'The LMS will be down for scheduled maintenance on Sunday, July 15th from 2:00 AM to 4:00 AM UTC. Please ensure all assignments are submitted before this window.',
    type: 'global',
    author: 'System Administrator',
    date: '2026-07-03T10:00:00Z',
    color: 'from-amber-500 to-orange-400',
    glow: 'oklch(0.75 0.16 85 / 0.25)',
    icon: <Megaphone className="h-6 w-6 text-white" />
  },
  {
    id: '2',
    title: 'Midterm Exam Schedule Released',
    content: 'The midterm examination schedule for all Engineering courses has been released. Please check the resources section of your respective courses for detailed timetables.',
    type: 'course',
    courseName: 'EC-301: Signals and Systems',
    author: 'Dr. A. Smith',
    date: '2026-07-02T14:30:00Z',
    color: 'from-violet-600 to-fuchsia-500',
    glow: 'oklch(0.65 0.26 285 / 0.25)',
    icon: <Bell className="h-6 w-6 text-white" />
  },
  {
    id: '3',
    title: 'New Library Resources Available',
    content: 'We have added over 500 new digital textbooks to the online library. You can now access the latest editions of major IEEE publications directly through the portal.',
    type: 'global',
    author: 'Librarian',
    date: '2026-07-01T09:15:00Z',
    color: 'from-emerald-500 to-teal-400',
    glow: 'oklch(0.70 0.20 165 / 0.25)',
    icon: <CalendarIcon className="h-6 w-6 text-white" />
  }
];

export default function AnnouncementsPage() {
  const [search, setSearch] = useState('');
  const { role, profile } = useUser();
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    
    async function fetchAnnouncements() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('announcements')
        .select('*, courses(title), profiles(full_name)')
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          type: a.course_id ? ('course' as const) : ('global' as const),
          courseName: a.courses?.title,
          author: a.profiles?.full_name || 'Administrator',
          date: a.created_at,
          color: a.course_id ? 'from-violet-600 to-fuchsia-500' : 'from-amber-500 to-orange-400',
          glow: a.course_id ? 'oklch(0.65 0.26 285 / 0.25)' : 'oklch(0.75 0.16 85 / 0.25)',
          icon: a.course_id ? <Bell className="h-6 w-6 text-white" /> : <Megaphone className="h-6 w-6 text-white" />,
        }));
        setAnnouncements(formatted);
      }
      setLoading(false);
    }
    
    fetchAnnouncements();
  }, [profile]);

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Announcements</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated with the latest news and notices</p>
        </div>
        {(role === 'admin' || role === 'faculty') && (
          <Button
            id="add-announcement-btn"
            className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
          >
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            New Announcement
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Search & filter */}
      <div className="flex gap-3 animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="announcement-search"
            placeholder="Search announcements…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-secondary/40 border-border/40 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <Button variant="outline" className="h-10 border-border/40 rounded-xl gap-2 text-muted-foreground hover:text-foreground">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 gap-5">
        {filtered.map((announcement, i) => (
          <div
            key={announcement.id}
            className="animate-slide-in-up opacity-0"
            style={{ animationDelay: `${(i + 1) * 60}ms`, animationFillMode: 'forwards' }}
          >
            <TiltCard intensity={5}>
              <div
                className="glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row cursor-pointer hover:border-primary/50 transition-colors"
                style={{ boxShadow: `0 4px 24px ${announcement.glow}` }}
              >
                {/* Left color bar */}
                <div className={`w-full md:w-2 bg-gradient-to-b ${announcement.color} h-2 md:h-auto`} />

                <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                  {/* Icon */}
                  <div className={`hidden md:flex h-14 w-14 rounded-2xl flex-shrink-0 bg-gradient-to-br ${announcement.color} items-center justify-center shadow-lg`}>
                    {announcement.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={announcement.type === 'global' ? 'active' : 'secondary'} className={announcement.type === 'global' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : ''}>
                          {announcement.type === 'global' ? 'Global' : 'Course'}
                        </Badge>
                        {announcement.courseName && (
                          <span className="text-xs font-mono text-muted-foreground">{announcement.courseName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {new Date(announcement.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-3 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {announcement.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground/90 leading-relaxed mb-4">
                      {announcement.content}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="font-medium text-foreground/80">Posted by {announcement.author}</span>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="flex items-center md:items-end justify-end md:justify-center pt-4 md:pt-0 border-t md:border-t-0 border-border/30 md:border-l md:pl-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:bg-primary/10 hover:text-primary group rounded-xl"
                    >
                      Read Full
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No announcements match your search.</p>
        </div>
      )}
        </>
      )}
    </div>
  );
}
