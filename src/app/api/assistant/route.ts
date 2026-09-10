import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 20;
const WINDOW_MS = 60 * 1000;

const RequestSchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })),
  context: z.object({
    currentPage: z.string().optional(),
    enrolledCourses: z.string().optional(),
    attendancePercentage: z.number().optional(),
    weakSubjects: z.string().optional()
  }).optional()
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    const rateLimitEntry = rateLimitMap.get(user.id);
    if (!rateLimitEntry || now > rateLimitEntry.resetAt) {
      rateLimitMap.set(user.id, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      rateLimitEntry.count += 1;
      if (rateLimitEntry.count > MAX_REQUESTS) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment before asking again.' },
          { status: 429 }
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set — AI features disabled');
      return NextResponse.json(
        { error: 'AI features disabled. GEMINI_API_KEY not set.' },
        { status: 503 }
      );
    }

    const bodyText = await req.text();
    let bodyJson;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = RequestSchema.safeParse(bodyJson);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { messages, context } = validation.data;

    const systemPrompt = [
      'You are "IBM Bob", an academic study assistant helping a student.',
      context?.currentPage ? `The student is currently viewing the following page: ${context.currentPage}. Provide contextually relevant advice for this page if they ask about it.` : '',
      context?.enrolledCourses ? `The student is enrolled in: ${context.enrolledCourses}.` : '',
      context?.attendancePercentage !== undefined ? `Their overall attendance is ${context.attendancePercentage}%. (Note: Below 75% is critical).` : '',
      context?.weakSubjects && context.weakSubjects !== 'None' ? `Their weak subjects are: ${context.weakSubjects}.` : '',
      'Provide concise, supportive, and helpful academic advice using Markdown.'
    ].filter(Boolean).join('\n');

    const filteredMessages = messages.filter((m) => m.id !== 'welcome');
    if (filteredMessages.length === 0) {
       return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: filteredMessages as any,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[assistant] Error:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
