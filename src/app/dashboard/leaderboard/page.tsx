import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LeaderboardClient from './client';
import { getProfile } from '@/lib/supabase/queries';

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(supabase, user.id);
  
  // Fetch top 10 leaderboard
  const { data: topUsers } = await supabase
    .from('user_xp')
    .select('student_id, total_xp, current_level, profiles(full_name, avatar_url, department)')
    .order('total_xp', { ascending: false })
    .limit(10);

  // Normalise profiles join
  const leaderboard = (topUsers || []).map((u: any, index) => ({
    rank: index + 1,
    id: u.student_id,
    name: u.profiles?.full_name || 'Unknown User',
    department: u.profiles?.department || 'Unknown',
    avatar: u.profiles?.avatar_url,
    xp: u.total_xp,
    level: u.current_level
  }));

  // Find current user's rank
  let currentUserRank = leaderboard.find(u => u.id === user.id);
  if (!currentUserRank && profile?.role === 'student') {
    // Current user is not in top 10, fetch their specific rank
    // Note: A true rank requires a window function or counting users with higher XP.
    const { data: myXp } = await supabase.from('user_xp').select('total_xp, current_level').eq('student_id', user.id).single();
    if (myXp) {
      const { count } = await supabase.from('user_xp').select('*', { count: 'exact', head: true }).gt('total_xp', myXp.total_xp);
      currentUserRank = {
        rank: (count || 0) + 1,
        id: user.id,
        name: profile.full_name || 'You',
        department: profile.department || '',
        avatar: profile.avatar_url || '',
        xp: myXp.total_xp,
        level: myXp.current_level
      };
    }
  }

  return (
    <LeaderboardClient 
      leaderboard={leaderboard} 
      currentUserRank={currentUserRank}
      isStudent={profile?.role === 'student'}
    />
  );
}
