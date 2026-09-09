import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: 'AI model is not configured. Please add a valid GEMINI_API_KEY to your environment variables.' },
        { status: 503 }
      );
    }

    const { messages, context } = await req.json();

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
    const filteredMessages = (messages || []).filter((m: any) => m.id !== 'welcome');
    
    if (filteredMessages.length === 0) {
       return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    const history = filteredMessages.slice(0, -1).map((msg: any) => ({
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
