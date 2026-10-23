'use client';

import type { AssistantStudentContext } from './assistant-context';

export type ChatMessage = { role: 'user' | 'model'; text: string };

export async function askAssistant(
  userMessage: string,
  context: AssistantStudentContext,
  history: ChatMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  try {
    const messages = [
      ...history.slice(0, -1).map(m => ({
        id: Math.random().toString(36).slice(2),
        role: m.role === 'model' ? 'assistant' : 'user' as const,
        content: m.text,
      })),
    ];

    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, {
          id: Math.random().toString(36).slice(2),
          role: 'user',
          content: userMessage,
        }],
        context: {
          currentPage: 'Dashboard',
          enrolledCourses: context.enrolledCourses.map(c => c.name).join(', '),
          attendancePercentage: context.attendanceByCourse.length > 0
            ? Math.round(
                context.attendanceByCourse.reduce((s, c) => s + c.attendancePercentage, 0) /
                context.attendanceByCourse.length
              )
            : undefined,
          weakSubjects: context.attendanceByCourse
            .filter(c => c.attendancePercentage < 75)
            .map(c => c.courseName)
            .join(', ') || 'None',
        },
      }),
    });

    if (!res.ok) {
      const body: unknown = await res.json().catch(() => null);
      const message = typeof body === 'object' && body !== null && 'error' in body
        ? typeof body.error === 'string' ? body.error : 'Kings Assistant is unavailable right now.'
        : res.status === 429 ? 'Too many requests. Please try again shortly.' : 'Kings Assistant is unavailable right now.';
      throw new Error(message);
    }

    if (!res.body) throw new Error('Kings Assistant returned an empty response.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
      if (onChunk) onChunk(result);
    }
    if (!result) throw new Error('Kings Assistant returned an empty response.');
    return result;
  } catch (err) {
    console.error('Assistant AI error:', err);
    throw err;
  }
}

export function getAssistantProactiveMessage(ctx: AssistantStudentContext): string {
  if (ctx.hasCriticalAttendance) {
    const course = ctx.attendanceByCourse.find(c => c.attendancePercentage < 60);
    if (course) {
      return `Your ${course.courseName} attendance is at ${course.attendancePercentage}%. That's in the danger zone. Let's talk about what happened and how to recover.`;
    }
  }
  if (ctx.hasCriticalDeadline) {
    const a = ctx.pendingAssignments.find(a => a.hoursUntilDue <= 6);
    if (a) {
      return `"${a.title}" is due in ${a.hoursUntilDue} hours. Do you need a rapid recap of the key concepts? I've got you.`;
    }
  }
  if (ctx.hasUpcomingDeadline) {
    const a = ctx.pendingAssignments.find(a => a.hoursUntilDue <= 24);
    if (a) {
      return `"${a.title}" for ${a.courseName} is due tomorrow. Want me to walk you through the important bits?`;
    }
  }
  if (ctx.hasLowAttendance) {
    const course = ctx.attendanceByCourse.find(c => c.attendancePercentage >= 60 && c.attendancePercentage < 75);
    if (course) {
      return `Your ${course.courseName} attendance is at ${course.attendancePercentage}%. Not critical yet - but worth a conversation. What's been going on?`;
    }
  }
  return `Hey ${ctx.studentName}! Everything looks solid on your end. Want to explore something new today, or shall I run you a quick quiz?`;
}
