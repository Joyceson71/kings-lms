'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { BobChatWorkspace } from '@/components/bob/bob-chat';

export default function AssistantPage() {
  const { profile } = useUser();
  const [courseContext, setCourseContext] = useState<string>('');

  useEffect(() => {
    if (!profile?.id) return;
    const fetchContext = async () => {
      const supabase = createClient();
      try {
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id, courses(title)')
          .eq('student_id', profile.id);
        
        if (enrollments && enrollments.length > 0) {
          const titles = enrollments.map((e: any) => e.courses?.title).filter(Boolean).join(', ');
          setCourseContext(titles);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchContext();
  }, [profile?.id]);

  return (
    <BobChatWorkspace 
      userName={profile?.full_name || 'Student'} 
      contextData={{ enrolledCourses: courseContext }} 
    />
  );
}
