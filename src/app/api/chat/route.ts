import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, profile } = await req.json();

    if (!process.env.BOB_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. BOB_API_KEY is missing.' },
        { status: 503 }
      );
    }

    // Format history for Bob API
    // We assume the last message is the user prompt
    const userMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    let systemInstruction = "You are IBM Bob, a highly advanced expert engineering course assistant for students at Kings Engineering College. You possess deep knowledge across all engineering disciplines. Provide highly detailed, step-by-step, and technically accurate answers. Always format your responses beautifully using Markdown.";
    if (profile) {
      const yearStr = profile.year_of_study ? `${profile.year_of_study}${profile.year_of_study === 1 ? 'st' : profile.year_of_study === 2 ? 'nd' : profile.year_of_study === 3 ? 'rd' : 'th'} year ` : '';
      const deptStr = profile.department ? `${profile.department} ` : '';
      systemInstruction = `You are IBM Bob, a highly advanced expert engineering course assistant. You are currently helping a ${yearStr}${deptStr}student at Kings Engineering College. Provide highly detailed, step-by-step, and technically accurate answers relevant to their specific department. Always format your responses beautifully using Markdown and use a supportive, encouraging tone.`;
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const formattedHistory = history.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: systemInstruction }] },
            { role: 'model', parts: [{ text: 'Understood. I will act as IBM Bob.' }] },
            ...formattedHistory
          ]
        });

        const result = await chat.sendMessage(userMessage);
        const replyText = result.response.text();

        return NextResponse.json({ reply: replyText });
      } catch (geminiErr) {
        console.error('Gemini completion error:', geminiErr);
        throw new Error('Gemini API error');
      }
    } else {
      const mockReply = `**(Mock Response)** Hello! I am IBM Bob (Global Chat). You have not configured a \`GEMINI_API_KEY\` in your \`.env.local\`. Please add one for full functionality.`;
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json({ reply: mockReply });
    }

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while communicating with the AI.' },
      { status: 500 }
    );
  }
}
