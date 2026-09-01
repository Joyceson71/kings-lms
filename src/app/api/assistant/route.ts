import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, context, messages } = body;
    
    // Check for the IBM Bob API Key
    const bobApiKey = process.env.BOB_API_KEY;
    if (!bobApiKey) {
      return NextResponse.json(
        { error: 'IBM Bob API Key is not configured in environment variables.' },
        { status: 500 }
      );
    }

    // Simulate network delay for AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const msgLower = message.toLowerCase();
    let reply = '';

    // Advanced Mock AI Logic based on context and message
    if (msgLower.includes('hello') || msgLower.includes('hi')) {
      reply = `Hello there! I'm IBM Bob. I see you are enrolled in **${context?.enrolledCourses || 'some courses'}**. How can I help you study today?`;
    } 
    else if (msgLower.includes('attendance') || msgLower.includes('absent')) {
      if (context?.attendancePercentage !== undefined) {
        if (context.attendancePercentage < 75) {
          reply = `Your attendance is currently **${context.attendancePercentage}%**, which is below the 75% threshold! 🚨 You need to attend your upcoming sessions to avoid penalties.`;
        } else {
          reply = `Your attendance is currently **${context.attendancePercentage}%**. You're doing great! Keep it up.`;
        }
      } else {
        reply = 'I am unable to pull your attendance right now, but always try to maintain above 75% to stay safe!';
      }
    } 
    else if (msgLower.includes('weak') || msgLower.includes('help me study') || msgLower.includes('fail')) {
      if (context?.weakSubjects && context.weakSubjects !== 'None') {
        reply = `Based on your internal marks, you seem to be struggling with **${context.weakSubjects}**. I recommend reviewing the latest resources uploaded for these modules and attempting practice quizzes!`;
      } else {
        reply = `Your marks look solid across the board! However, if you're struggling, try breaking your study sessions into 25-minute Pomodoro intervals.`;
      }
    } 
    else if (msgLower.includes('exam') || msgLower.includes('test')) {
      reply = `**Exam Preparation Tips:**\n1. **Active Recall:** Don't just read notes, test yourself.\n2. **Spaced Repetition:** Review topics over increasing intervals.\n3. **Rest:** Ensure you get 7-8 hours of sleep before the exam.\n\nGood luck!`;
    }
    else {
      reply = `That's an interesting question about "${message}". As your IBM Study Assistant, I recommend checking the **Resources** tab in your courses for detailed materials on this topic. Let me know if you need help with anything specific like attendance or weak subjects!`;
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in IBM Bob Assistant Route:', error);
    return NextResponse.json(
      { error: 'Failed to process request.' },
      { status: 500 }
    );
  }
}
