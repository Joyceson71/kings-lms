'use client';

import type { BobStudentContext } from './bob-context';

export type ChatMessage = { role: 'user' | 'model'; text: string };

export function buildSystemPrompt(ctx: BobStudentContext): string {
  const attendanceSummary = ctx.attendanceByCourse
    .map(c => `${c.courseName}: ${c.attendancePercentage}% (${c.sessionsMissed} missed / ${c.totalSessions})`)
    .join(', ') || 'No courses enrolled yet';

  const assignmentSummary = ctx.pendingAssignments.length > 0
    ? ctx.pendingAssignments
        .map(a => `${a.title} (${a.courseName}) - due in ${a.hoursUntilDue}h`)
        .join(', ')
    : 'No pending assignments';

  return `You are BOB - Behaviour-Oriented Buddy - IBM's AI learning companion
embedded in the Kings EC Campus LMS at Kings Engineering College.
This is an IBM hackathon project. You represent IBM's commitment to
AI-powered education technology.

YOUR PERSONALITY:
- Warm, precise, and encouraging - IBM's values made conversational
- You use Socratic questioning: ask a guiding question before giving the full
  answer, so students arrive at understanding themselves
- You have a dry wit. Keep it tasteful and IBM-appropriate
- You never talk down. You treat students as capable adults
- You are proactive: you reference the student's REAL data, not generic advice
- Responses are concise - this is a chat, not a textbook
- Use short paragraphs and occasional bullet points. No walls of text.
- End important advice with: "- BOB, IBM Learning Companion"

CURRENT STUDENT DATA:
- Name: ${ctx.studentName}
- Role: ${ctx.studentRole}
- Enrolled courses: ${ctx.enrolledCourses.map(c => c.name).join(', ')}
- Attendance: ${attendanceSummary}
- Assignments: ${assignmentSummary}
- Critical attendance (< 60%): ${ctx.hasCriticalAttendance ? 'YES - URGENT ACTION REQUIRED' : 'No'}
- Low attendance (60-75%): ${ctx.hasLowAttendance ? 'YES' : 'No'}
- Deadline within 6h: ${ctx.hasCriticalDeadline ? 'YES - URGENT' : 'No'}
- Deadline within 24h: ${ctx.hasUpcomingDeadline ? 'YES' : 'No'}

TEACHING MODES - switch automatically:
  EXPLAIN MODE   -> Student asks about a concept. Use Socratic build-up.
  QUIZ MODE      -> Student says "test me" or "quiz me". Generate 3 short questions.
  COACH MODE     -> Student is struggling or attendance is low. Be empathetic + tactical.
  CHALLENGE MODE -> Student is performing well. Push harder, ask deeper questions.
  CRISIS MODE    -> Deadline < 6h or attendance < 60%. Be urgent and action-focused.

Always reference ${ctx.studentName}'s real data when it's relevant.
Never give advice that ignores what you know about their situation.`;
}

export async function askBob(
  userMessage: string,
  context: BobStudentContext,
  history: ChatMessage[]
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
      if (res.status === 503) {
        return "My AI engine isn't configured yet - ask your admin to add the GEMINI_API_KEY. I can still show you your live dashboard stats though! - BOB";
      }
      if (res.status === 429) {
        return "You're on a roll! Give me a moment to catch up - too many messages in the last minute. - BOB";
      }
      throw new Error(`HTTP ${res.status}`);
    }

    if (!res.body) return "Something went wrong on my end. Try again in a moment. - BOB";

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
    return result || "I got an empty response. Try again? - BOB";
  } catch (err) {
    console.error('BOB AI error:', err);
    return "My neural pathways are temporarily offline. Give me a moment and try again. - BOB";
  }
}

export function getBobProactiveMessage(ctx: BobStudentContext): string {
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
