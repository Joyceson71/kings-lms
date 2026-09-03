import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
// NOTE: BOB_API_KEY is currently used as an enable-guard only.
// The assistant uses a local intent-matching engine — no IBM API call is made.
// ============================================================================
const intents: IntentHandler[] = [
  // 1. Greeting Intent
  (payload) => {
    if (/\b(hello|hi|hey|greetings)\b/i.test(payload.message)) {
      return `Hello there! I'm Bob, your academic study assistant. I see you are enrolled in **${payload.context.enrolledCourses || 'some courses'}**. How can I help you study today?`;
    }
    return null;
  },

  // 2. Attendance Intent
  (payload) => {
    if (/\b(attendance|absent|present|skip)\b/i.test(payload.message)) {
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
    if (/\b(weak|struggling|fail|study|help me)\b/i.test(payload.message)) {
      if (payload.context.weakSubjects && payload.context.weakSubjects !== 'None') {
        return `Based on your internal marks, you seem to be struggling with **${payload.context.weakSubjects}**. I recommend reviewing the latest resources uploaded for these modules and attempting practice quizzes!`;
      }
      return `Your marks look solid across the board! However, if you want to optimize your study time, try breaking your sessions into 25-minute Pomodoro intervals using the timer in the dashboard.`;
    }
    return null;
  },

  // 4. Exam Preparation Intent
  (payload) => {
    if (/\b(exam|test|quiz|prep)\b/i.test(payload.message)) {
      return `**Exam Preparation Tips:**\n1. **Active Recall:** Don't just read notes, test yourself.\n2. **Spaced Repetition:** Review topics over increasing intervals.\n3. **Rest:** Ensure you get 7-8 hours of sleep before the exam.\n\nWould you like me to generate a practice quiz for your enrolled courses?`;
    }
    return null;
  },

  // 5. Assignment / Priority Intent
  (payload) => {
    if (/\b(assignment|deadline|due|submit|task)\b/i.test(payload.message)) {
      return `To stay on top of assignments:\n1. Check the **Assignments** tab to see all pending tasks sorted by deadline.\n2. Use **Smart Sort** to prioritize by urgency and weight.\n3. Break large assignments into smaller milestones using the Pomodoro timer.`;
    }
    return null;
  },
];

// Fallback if no intent matches
const generateFallback = (payload: RequestPayload): string => {
  const isQuestion = payload.message.includes('?');
  const prevMessage = payload.messages.length > 1 ? payload.messages[payload.messages.length - 2].content : '';

  if (isQuestion) {
    return `That's a good question about "${payload.message.substring(0, 60)}". As your study assistant, I recommend checking the **Resources** tab in your courses for detailed materials on this topic.`;
  }

  if (prevMessage.includes('Pomodoro')) {
    return 'The Pomodoro technique is highly effective! You can find the timer in the bottom-right of the dashboard.';
  }

  return `I'm here to help you succeed! Let me know if you need help with tracking attendance, improving weak subjects, assignment priorities, or preparing for exams.`;
};

export async function POST(request: Request) {
  try {
    // ── Auth check — reject unauthenticated callers ──────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── BOB_API_KEY gate — if the key is not set, the assistant is disabled ──
    const bobApiKey = process.env.BOB_API_KEY;
    if (!bobApiKey) {
      return NextResponse.json(
        { error: 'Study assistant is not configured. Please contact your administrator.' },
        { status: 503 }
      );
    }

    const body: RequestPayload = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Invalid request: message is required.' }, { status: 400 });
    }

    // Sanitise message length
    const sanitisedMessage = body.message.trim().slice(0, 500);
    const payload: RequestPayload = { ...body, message: sanitisedMessage };

    let reply = '';

    for (const intent of intents) {
      const result = intent(payload);
      if (result) {
        reply = result;
        break;
      }
    }

    if (!reply) {
      reply = generateFallback(payload);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[assistant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
