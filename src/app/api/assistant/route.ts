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

    const { message, courseContext } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `You are a helpful study assistant for Kings Engineering College students. 
${courseContext ? `The student is currently enrolled in: ${courseContext}.` : ''}
Answer academic questions clearly and concisely. Focus on helping with coursework, exam preparation, and concept explanations.
Keep responses well-structured with clear headings when needed. If asked about topics outside academics, politely redirect to academic help.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${systemPrompt}\n\nStudent: ${message}`,
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
