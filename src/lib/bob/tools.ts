import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const buildBobTools = async (userId: string, role: string) => {
  return {
    get_user_profile: tool({
      description: 'Get the current user profile information.',
      parameters: z.object({}),
      // @ts-expect-error - Ignore execute type signature mismatch
      execute: async (_args: any) => {
        const supabase = await createClient();
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error) return { error: error.message };
        return { profile: data };
      }
    }),
    
    get_courses: tool({
      description: 'Get the courses the user is enrolled in (if student) or teaching (if faculty).',
      parameters: z.object({}),
      // @ts-expect-error - Ignore execute type signature mismatch
      execute: async (_args: any) => {
        const supabase = await createClient();
        if (role === 'student') {
          const { data, error } = await supabase
            .from('course_enrollments')
            .select('course_id, courses(*)')
            .eq('student_id', userId);
          if (error) return { error: error.message };
          return { courses: data.map(d => d.courses) };
        } else if (role === 'faculty') {
          // Assume faculty courses logic or all courses if admin
          const { data, error } = await supabase.from('courses').select('*');
          if (error) return { error: error.message };
          return { courses: data };
        }
        return { courses: [] };
      }
    }),

    get_assignments: tool({
      description: 'Get pending or completed assignments for the user.',
      parameters: z.object({
        status: z.enum(['pending', 'completed']).optional().describe('Filter by assignment status')
      }),
      // @ts-expect-error - Ignore execute type signature mismatch
      execute: async ({ status: _status }: { status?: 'pending' | 'completed' }) => {
        const supabase = await createClient();
        if (role === 'student') {
          // Simplification for the hackathon/demo
          const { data, error } = await supabase.from('assignments').select('*, courses(title)');
          if (error) return { error: error.message };
          return { assignments: data };
        }
        return { assignments: [] };
      }
    }),
    
    generate_study_plan: tool({
      description: 'Emit a structured study plan. Use this tool specifically when in PLAN mode to output the structured JSON plan.',
      parameters: z.object({
        title: z.string().describe('Title of the study plan'),
        summary: z.string().describe('Short summary of what this plan aims to achieve'),
        steps: z.array(z.object({
          id: z.string().describe('A unique identifier for the step'),
          title: z.string().describe('Title of the step'),
          description: z.string().describe('Detailed description of what to do in this step'),
          priority: z.enum(['High', 'Medium', 'Low']).describe('Priority level'),
          effort: z.string().describe('Estimated time or effort (e.g., "2h", "30m")'),
          dependencies: z.array(z.string()).optional().describe('IDs of steps that must be completed first'),
        }))
      }),
      // @ts-expect-error - Ignore execute type signature mismatch
      execute: async (plan: any) => {
        // Just return the plan so the UI can render it via toolInvocation
        return plan;
      }
    })
  };
};
