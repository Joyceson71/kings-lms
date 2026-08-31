import { NextRequest, NextResponse } from 'next/server';
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

    if (!process.env.BOB_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured. BOB_API_KEY is missing.' }, { status: 503 });
    }

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
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const response = await fetch('https://api.us-east.bob.ibm.com/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOB_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'ibm/granite-13b-chat-v2', // Or default if they don't specify
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessageContent }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IBM Bob API error:', errorText);
      throw new Error(`IBM Bob API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('AI assistant error:', err);
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
