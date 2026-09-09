import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

const RequestSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    enrolledCourses: z.string().optional(),
    courseIds: z.array(z.string()).optional(),
    attendancePercentage: z.number().optional(),
    weakSubjects: z.string().optional(),
  }).optional(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      id: z.string().optional(),
    })
  ).optional(),
});

type RequestPayload = z.infer<typeof RequestSchema>;

export async function POST(request: Request) {
  try {
    // ── Auth check — reject unauthenticated callers ──────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse payload using Zod for increased code stability
    const bodyText = await request.text();
    let bodyJson;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = RequestSchema.safeParse(bodyJson);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request payload', details: validation.error.format() }, { status: 400 });
    }

    const payload = validation.data;
    
    // We are now using GEMINI_API_KEY for the real AI model
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: 'AI model is not configured. Please add a valid GEMINI_API_KEY to your environment variables.' },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); 

    // Build the system context
    const contextStr = [
      'You are "IBM Bob", an academic study assistant helping a student.',
      payload.context?.enrolledCourses ? `The student is enrolled in: ${payload.context.enrolledCourses}.` : '',
      payload.context?.attendancePercentage !== undefined ? `Their overall attendance is ${payload.context.attendancePercentage}%. (Note: Below 75% is critical).` : '',
      payload.context?.weakSubjects && payload.context.weakSubjects !== 'None' ? `Their weak subjects are: ${payload.context.weakSubjects}.` : '',
      'Provide concise, supportive, and helpful academic advice using Markdown.'
    ].filter(Boolean).join('\n');

    // Build chat history for Gemini
    const history = (payload.messages || []).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Start a chat session, injecting system context in the history
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: `System Context: ${contextStr}` }] },
        { role: 'model', parts: [{ text: 'Understood. I am IBM Bob, the study assistant. I will use this context to help the student and provide responses in Markdown.' }] },
        ...history.slice(0, -1) // Exclude the latest user message as it will be sent via sendMessage
      ]
    });

    const result = await chat.sendMessage(payload.message);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('[assistant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again later.' },
      { status: 500 }
    );
  }
}
