import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { messages, profile } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is missing. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Format history for Gemini
    // We assume the last message is the user prompt
    const userMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    let systemInstruction = "You are Kings AI, an expert engineering course assistant for students at Kings Engineering College. You are helpful, encouraging, and provide concise, accurate technical answers.";
    if (profile) {
      const yearStr = profile.year_of_study ? `${profile.year_of_study}${profile.year_of_study === 1 ? 'st' : profile.year_of_study === 2 ? 'nd' : profile.year_of_study === 3 ? 'rd' : 'th'} year ` : '';
      const deptStr = profile.department ? `${profile.department} ` : '';
      systemInstruction = `You are Kings AI, an expert engineering course assistant. You are currently helping a ${yearStr}${deptStr}student at Kings Engineering College. You are helpful, encouraging, and provide concise, accurate technical answers relevant to their specific department when possible.`;
    }

    // Use Gemini 2.5 Flash for fast chat responses
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text;

    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while communicating with the AI.' },
      { status: 500 }
    );
  }
}
