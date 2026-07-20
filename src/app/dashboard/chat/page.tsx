import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GlobalChatClient from './chat-client';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function GlobalChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch current user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // Fetch the last 100 messages
  const { data: rawMessages } = await supabase
    .from('global_messages')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles (
        full_name,
        role,
        avatar_url,
        department
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  // We want chronological order for rendering (oldest first)
  const initialMessages = (rawMessages || []).reverse().map((m: any) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    user_id: m.user_id,
    user_name: m.profiles?.full_name || 'Unknown User',
    user_role: m.profiles?.role || 'student',
    user_avatar: m.profiles?.avatar_url || null,
    user_department: m.profiles?.department || null,
  }));

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <GlobalChatClient 
        initialMessages={initialMessages} 
        currentUserId={user.id} 
        currentUserRole={profile.role}
      />
    </Suspense>
  );
}
