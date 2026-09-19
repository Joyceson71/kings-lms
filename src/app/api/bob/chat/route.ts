import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSystemPrompt } from '@/lib/bob/prompts';
import { buildBobTools } from '@/lib/bob/tools';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role assumption (In a real app, fetch from user profile)
    // We default to 'student' for this demo unless specified
    const role = 'student';

    const { messages, mode } = await req.json();

    if (!messages || !mode) {
      return NextResponse.json({ error: 'Messages and mode are required' }, { status: 400 });
    }

    // Choose Provider based on ENV
    let model;
    if (process.env.GEMINI_API_KEY) {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
      model = google('gemini-2.5-flash');
    } else if (process.env.IBM_BOB_API_KEY) {
      const ibmBob = createOpenAI({ apiKey: process.env.IBM_BOB_API_KEY, baseURL: 'https://bob.ibm.com/v1' });
      model = ibmBob('bob-agent');
    } else if (process.env.OPENAI_API_KEY) {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      model = openai('gpt-4o-mini');
    } else {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 });
    }

    const systemPrompt = getSystemPrompt(mode);
    const tools = await buildBobTools(user.id, role);

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      // Only attach tools in Agent or Plan mode
      tools: mode === 'agent' || mode === 'plan' ? tools : undefined,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[BobChat] Error:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
