import { NextResponse } from 'next/server';
import { stepCountIs, streamText } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getRole } from '@/lib/getRole';
import { buildAssistantTools } from '@/lib/assistant/tools';
import { getSystemPrompt } from '@/lib/assistant/prompts';
import { AssistantConfigurationError, createAssistantModel } from '@/lib/assistant/provider';

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string().optional(),
  parts: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1),
  mode: z.enum(['ask', 'plan', 'agent']).default('ask'),
  context: z.object({
    currentPage: z.string().optional(),
    enrolledCourses: z.string().optional(),
    attendancePercentage: z.number().optional(),
    weakSubjects: z.string().optional(),
  }).optional(),
});

export async function handleAssistantRequest(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawBody: unknown = await req.json();
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { messages, mode, context } = parsed.data;
    const normalizedMessages = messages
      .filter(message => message.id !== 'welcome')
      .map(message => ({
        role: message.role,
        content: message.content ?? message.parts?.filter(part => part.type === 'text').map(part => part.text ?? '').join('') ?? '',
      }))
      .filter(message => message.content.length > 0);
    if (!normalizedMessages.length) return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });

    const role = await getRole(supabase, user.id);
    const tools = await buildAssistantTools(user.id, role);
    const contextPrompt = [
      context?.currentPage ? `The user is viewing ${context.currentPage}.` : '',
      context?.enrolledCourses ? `Enrolled courses: ${context.enrolledCourses}.` : '',
      context?.attendancePercentage !== undefined ? `Overall attendance: ${context.attendancePercentage}%.` : '',
      context?.weakSubjects && context.weakSubjects !== 'None' ? `Subjects to focus on: ${context.weakSubjects}.` : '',
    ].filter(Boolean).join('\n');

    const result = await streamText({
      model: createAssistantModel(),
      system: [getSystemPrompt(mode), contextPrompt].filter(Boolean).join('\n'),
      messages: normalizedMessages,
      tools: mode === 'agent' || mode === 'plan' ? tools : undefined,
      stopWhen: stepCountIs(5),
    });
    return result.toTextStreamResponse();
  } catch (error) {
    if (error instanceof AssistantConfigurationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 503 });
    }
    console.error('[assistant] request failed', error);
    return NextResponse.json({ error: 'The assistant could not process this request.' }, { status: 500 });
  }
}
