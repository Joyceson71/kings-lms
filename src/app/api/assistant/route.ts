import { NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface AssistantContext {
  enrolledCourses?: string;
  courseIds?: string[];
  attendancePercentage?: number;
  weakSubjects?: string;
}

interface RequestPayload {
  message: string;
  context: AssistantContext;
  messages: Message[];
}

type IntentHandler = (payload: RequestPayload) => string | null;

// ============================================================================
// Intent Matchers
// ============================================================================
const intents: IntentHandler[] = [
  // 1. Greeting Intent
  (payload) => {
    if (/\\b(hello|hi|hey|greetings)\\b/i.test(payload.message)) {
      return `Hello there! I'm IBM Bob. I see you are enrolled in **${payload.context.enrolledCourses || 'some courses'}**. How can I help you study today?`;
    }
    return null;
  },
  
  // 2. Attendance Intent
  (payload) => {
    if (/\\b(attendance|absent|present|skip)\\b/i.test(payload.message)) {
      const pct = payload.context.attendancePercentage;
      if (pct !== undefined) {
        if (pct < 75) {
          return `Your attendance is currently **${pct}%**, which is below the 75% threshold! 🚨 You need to attend your upcoming sessions to avoid academic penalties.`;
        }
        return `Your attendance is currently **${pct}%**. You're doing great! Keep it up.`;
      }
      return 'I am unable to pull your attendance right now, but always try to maintain above 75% to stay safe!';
    }
    return null;
  },

  // 3. Weak Subjects / Study Help Intent
  (payload) => {
    if (/\\b(weak|struggling|fail|study|help me)\\b/i.test(payload.message)) {
      if (payload.context.weakSubjects && payload.context.weakSubjects !== 'None') {
        return `Based on your internal marks, you seem to be struggling with **${payload.context.weakSubjects}**. I recommend reviewing the latest resources uploaded for these modules and attempting practice quizzes!`;
      }
      return `Your marks look solid across the board! However, if you want to optimize your study time, try breaking your sessions into 25-minute Pomodoro intervals using the timer in the dashboard.`;
    }
    return null;
  },

  // 4. Exam Preparation Intent
  (payload) => {
    if (/\\b(exam|test|quiz|prep)\\b/i.test(payload.message)) {
      return `**Exam Preparation Tips:**\\n1. **Active Recall:** Don't just read notes, test yourself.\\n2. **Spaced Repetition:** Review topics over increasing intervals.\\n3. **Rest:** Ensure you get 7-8 hours of sleep before the exam.\\n\\nWould you like me to generate a practice quiz for your enrolled courses?`;
    }
    return null;
  }
];

// Fallback logic if no intent matches, but conversational history exists
const generateFallback = (payload: RequestPayload): string => {
  const isQuestion = payload.message.includes('?');
  const prevMessage = payload.messages.length > 1 ? payload.messages[payload.messages.length - 2].content : '';

  if (isQuestion) {
    return `That's an interesting question about "${payload.message}". As your IBM Study Assistant, I recommend checking the **Resources** tab in your courses for detailed materials on this topic.`;
  }
  
  if (prevMessage.includes('Pomodoro')) {
    return 'The Pomodoro technique is highly effective! You can find the timer in the top navigation bar.';
  }

  return `I'm here to help you succeed! Let me know if you need help with anything specific like tracking attendance, improving weak subjects, or preparing for exams.`;
};

export async function POST(request: Request) {
  try {
    const body: RequestPayload = await request.json();
    
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

    let reply = '';

    // Iterate through intent matchers to find a suitable response
    for (const intent of intents) {
      const result = intent(body);
      if (result) {
        reply = result;
        break;
      }
    }

    // Use fallback if no intent matched
    if (!reply) {
      reply = generateFallback(body);
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
