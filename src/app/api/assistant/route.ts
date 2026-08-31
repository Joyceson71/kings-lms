import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    let historyMessages = messages || [];
    // Remove the welcome message to ensure history starts with user if needed
    if (historyMessages.length > 0 && historyMessages[0].id === 'welcome') {
      historyMessages = historyMessages.slice(1);
    }

    const userMessageContent = historyMessages.length > 0 
      ? historyMessages[historyMessages.length - 1].content 
      : message;

    // RAG Pipeline Implementation
    let ragContextStr = '';
    try {
      if (process.env.GEMINI_API_KEY && context?.courseIds?.length > 0) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        
        // Generate embedding for user message
        const result = await embeddingModel.embedContent(userMessageContent);
        const embedding = result.embedding.values;
        
        // Search Supabase pgvector using our new RPC
        const { data: chunks, error } = await supabase.rpc('match_course_materials', {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 3,
          filter_course_ids: context.courseIds
        });
        
        if (!error && chunks && chunks.length > 0) {
          ragContextStr = '\n\nReference Course Materials:\n';
          chunks.forEach((chunk: any, i: number) => {
            ragContextStr += `[Source ${i+1}]: ${chunk.content}\n\n`;
          });
        }
      }
    } catch (e) {
      console.error("RAG embedding error:", e);
      // Fail gracefully so normal chat still works
    }

    const systemPrompt = `You are IBM Bob, a highly advanced, expert study assistant for Kings Engineering College students. 
${contextStr}${ragContextStr ? `\nUse the following extracted course material to answer the student's question accurately. If the answer is found in the material, cite it (e.g. "According to your course material..."). If not, answer generally.${ragContextStr}` : ''}
You possess deep knowledge across all engineering disciplines. Answer academic questions in a highly detailed, step-by-step, and concise manner. Focus on helping with coursework, exam preparation, and concept explanations. Provide code examples, formulas, and diagrams where applicable.
If the student asks about their weak subjects or attendance, use the provided context to guide them. Suggest comprehensive study plans based on weak areas. Generate practice questions per syllabus unit if requested. If their attendance is close to the 75% cutoff, gently but firmly remind them to attend classes to avoid penalties.
Keep responses beautifully formatted using Markdown, with clear headings, bullet points, and code blocks when needed. If asked about topics outside academics, politely redirect to academic help.`;
      
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const formattedHistory = historyMessages.slice(0, -1).map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I will act as IBM Bob.' }] },
            ...formattedHistory
          ]
        });

        const result = await chat.sendMessage(userMessageContent);
        const reply = result.response.text();

        return NextResponse.json({ reply });
      } catch (geminiErr) {
        console.error('Gemini completion error:', geminiErr);
        throw new Error('Gemini API error');
      }
    } else {
      // Fallback mock response for Hackathon pitch if no API key is provided
      const mockReply = `**(Mock Response)** Hello! I am IBM Bob. It looks like you haven't configured a \`GEMINI_API_KEY\` in your \`.env.local\` file yet.\n\nTo make this AI Learning Assistant fully functional, please add a Gemini API key. In the meantime, I can confirm that your context includes:\n\n${contextStr}\n${ragContextStr}`;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json({ reply: mockReply });
    }
  } catch (err) {
    console.error('AI assistant error:', err);
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
