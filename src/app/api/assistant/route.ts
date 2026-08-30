import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context, messages } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let contextStr = '';
    if (context) {
      contextStr += `Student Context:\n`;
      if (context.enrolledCourses) contextStr += `- Enrolled in: ${context.enrolledCourses}\n`;
      if (context.attendancePercentage) contextStr += `- Overall Attendance: ${context.attendancePercentage}%\n`;
      if (context.weakSubjects) contextStr += `- Weak Subjects (below 50% internal marks): ${context.weakSubjects}\n`;
    }

    const systemPrompt = `You are IBM Bob, a highly advanced, expert study assistant for Kings Engineering College students. 
${contextStr}
You possess deep knowledge across all engineering disciplines. Answer academic questions in a highly detailed, step-by-step, and concise manner. Focus on helping with coursework, exam preparation, and concept explanations. Provide code examples, formulas, and diagrams where applicable.
If the student asks about their weak subjects or attendance, use the provided context to guide them. Suggest comprehensive study plans based on weak areas. Generate practice questions per syllabus unit if requested. If their attendance is close to the 75% cutoff, gently but firmly remind them to attend classes to avoid penalties.
Keep responses beautifully formatted using Markdown, with clear headings, bullet points, and code blocks when needed. If asked about topics outside academics, politely redirect to academic help.`;

    let historyMessages = messages || [];
    // Remove the welcome message to ensure history starts with user if needed
    if (historyMessages.length > 0 && historyMessages[0].id === 'welcome') {
      historyMessages = historyMessages.slice(1);
    }

    const userMessageContent = historyMessages.length > 0 
      ? historyMessages[historyMessages.length - 1].content 
      : message;
      
    const history = historyMessages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userMessageContent }] }
      ],
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const reply = response.text;

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('AI assistant error:', err);
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
