import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const buildAssistantTools = async (userId: string, role: string) => {
  return {
    get_user_profile: tool({
      description: 'Get the current user profile information.',
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = await createClient();
        const { data, error } = await supabase.from('profiles').select('id, full_name, role, department').eq('id', userId).single();
        if (error) return { error: error.message };
        return { profile: data };
      }
    }),
    
    get_courses: tool({
      description: 'Get the courses the user is enrolled in (if student) or teaching (if faculty).',
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = await createClient();
        if (role === 'student') {
          const { data, error } = await supabase
            .from('course_enrollments')
            .select('course_id, courses(*)')
            .eq('student_id', userId);
          if (error) return { error: error.message };
          return { courses: data.map(d => d.courses) };
        } else if (role === 'faculty') {
          const { data, error } = await supabase.from('courses').select('*').eq('created_by', userId);
          if (error) return { error: error.message };
          return { courses: data };
        } else if (role === 'admin') {
          const { data, error } = await supabase.from('courses').select('*');
          if (error) return { error: error.message };
          return { courses: data };
        }
        return { courses: [] };
      }
    }),

    get_assignments: tool({
      description: 'Get pending or completed assignments for the user.',
      inputSchema: z.object({
        status: z.enum(['pending', 'completed']).optional().describe('Filter by assignment status')
      }),
      execute: async ({ status: _status }) => {
        const supabase = await createClient();
        if (role === 'student') {
          const { data: enrollments, error: enrollmentError } = await supabase
            .from('course_enrollments').select('course_id').eq('student_id', userId);
          if (enrollmentError) return { error: enrollmentError.message };
          const courseIds = enrollments.map(enrollment => enrollment.course_id);
          if (courseIds.length === 0) return { assignments: [] };
          const { data, error } = await supabase
            .from('assignments').select('*, courses(title)').in('course_id', courseIds);
          if (error) return { error: error.message };
          return { assignments: data };
        }
        if (role === 'faculty') {
          const { data: courses, error: courseError } = await supabase
            .from('courses').select('id').eq('created_by', userId);
          if (courseError) return { error: courseError.message };
          const courseIds = courses.map(course => course.id);
          if (courseIds.length === 0) return { assignments: [] };
          const { data, error } = await supabase.from('assignments').select('*, courses(title)').in('course_id', courseIds);
          if (error) return { error: error.message };
          return { assignments: data };
        }
        if (role === 'admin') {
          const { data, error } = await supabase.from('assignments').select('*, courses(title)');
          if (error) return { error: error.message };
          return { assignments: data };
        }
        return { assignments: [] };
      }
    }),
    
    generate_study_plan: tool({
      description: 'Emit a structured study plan. Use this tool specifically when in PLAN mode to output the structured JSON plan.',
      inputSchema: z.object({
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
      execute: async (plan) => {
        // Just return the plan so the UI can render it via toolInvocation
        return plan;
      }
    }),

    search_materials: tool({
      description: 'Search for course materials, syllabus, or lecture notes by query. Returns mocked results for the demo.',
      inputSchema: z.object({
        query: z.string().describe('Search query for the materials'),
        course_id: z.string().optional().describe('Filter by specific course ID')
      }),
      execute: async ({ query, course_id }) => {
        // Mock response for demo purposes
        return {
          results: [
            { title: `Lecture Notes on ${query}`, type: 'pdf', link: '/materials/notes.pdf' },
            { title: `Syllabus Overview`, type: 'document', link: '/materials/syllabus.pdf' }
          ],
          query,
          course_id
        };
      }
    }),

    schedule_reminder: tool({
      description: 'Schedule a reminder for an upcoming assignment or exam.',
      inputSchema: z.object({
        task_name: z.string().describe('Name of the task to remind about'),
        date: z.string().describe('Date of the reminder in YYYY-MM-DD format')
      }),
      execute: async ({ task_name, date }) => {
        // Mock successful scheduling
        return {
          success: true,
          message: `Reminder for "${task_name}" scheduled on ${date}.`
        };
      }
    })
  };
};
