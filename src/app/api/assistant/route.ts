import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

export const maxDuration = 30;

// Simple in-memory rate limiter for the Assistant API
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 20; // 20 requests per minute
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

    // 1. Rate Limiting based on user ID
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
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: 'AI model is not configured. Please add a valid GEMINI_API_KEY to your environment variables.' },
        { status: 503 }
      );
    }

    // 2. Strict Request Parsing & Validation
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); 

    const systemPrompt = [
      'You are "IBM Bob", an academic study assistant helping a student.',
      context?.currentPage ? `The student is currently viewing the following page: ${context.currentPage}. Provide contextually relevant advice for this page if they ask about it.` : '',
      context?.enrolledCourses ? `The student is enrolled in: ${context.enrolledCourses}.` : '',
      context?.attendancePercentage !== undefined ? `Their overall attendance is ${context.attendancePercentage}%. (Note: Below 75% is critical).` : '',
      context?.weakSubjects && context.weakSubjects !== 'None' ? `Their weak subjects are: ${context.weakSubjects}.` : '',
      'Provide concise, supportive, and helpful academic advice using Markdown.'
    ].filter(Boolean).join('\n');

    // Filter out the welcome message if it exists so we don't confuse the model with fake history
    const filteredMessages = messages.filter((m) => m.id !== 'welcome');
    if (filteredMessages.length === 0) {
       return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    const history = filteredMessages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: `System Context: ${systemPrompt}` }] },
        { role: 'model', parts: [{ text: 'Understood. I am IBM Bob, the study assistant.' }] },
        ...history
      ]
    });

    const userMessage = filteredMessages[filteredMessages.length - 1].content;
    const result = await chat.sendMessageStream(userMessage);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('[assistant] Error:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
