import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
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

    const response = await fetch('https://api.us-east.bob.ibm.com/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOB_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'ibm/granite-13b-chat-v2', // Or default if they don't specify
        messages: [
          { role: 'system', content: systemInstruction },
          ...history,
          { role: 'user', content: userMessage }
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
    const replyText = data.choices[0].message.content;

    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while communicating with the AI.' },
      { status: 500 }
    );
  }
}
