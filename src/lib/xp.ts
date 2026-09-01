import { SupabaseClient } from '@supabase/supabase-js';

const XP_RULES = {
  attendance: 10,
  assignment_submitted: 20,
  assignment_graded_80plus: 30,
  quiz_passed: 50,
  course_complete: 200,
};

export async function awardXP(supabase: SupabaseClient, studentId: string, action: keyof typeof XP_RULES, relatedId?: string) {
  const xp = XP_RULES[action];
  
  // Insert log
  const { error: logError } = await supabase.from('xp_logs').insert({ 
    student_id: studentId, 
    action, 
    xp_gained: xp, 
    related_id: relatedId 
  });

  if (logError) {
    console.error('Error logging XP:', logError);
    return;
  }

  // Increment total XP
  const { error: rpcError } = await supabase.rpc('increment_xp', { 
    p_student_id: studentId, 
    p_xp: xp 
  });

  if (rpcError) {
    console.error('Error incrementing XP:', rpcError);
  }
}
