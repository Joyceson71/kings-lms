'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, User, Bot, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  id: string;
};

export default function AssistantPage() {
  const { profile } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm your AI Study Assistant powered by Gemini.\n\nI can help you with:\n- **Concept explanations** for your courses\n- **Exam preparation** and revision tips\n- **Problem solving** and worked examples\n- **Study strategies** and time management\n\nWhat would you like to learn today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [courseContext, setCourseContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch enrolled courses for context
  useEffect(() => {
    if (!profile?.id) return;
    const supabase = createClient();
    supabase
      .from('course_enrollments')
      .select('courses(title)')
      .eq('student_id', profile.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const titles = data
            .map((e: any) => e.courses?.title)
            .filter(Boolean)
            .join(', ');
          setCourseContext(titles);
        }
      });
  }, [profile?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, courseContext }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'AI service error');

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get AI response.';
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: `❌ ${msg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-4 animate-slide-in-up opacity-0"
        style={{ animationFillMode: 'forwards' }}
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="gradient-text">AI Assistant</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your personal study companion powered by Gemini
          </p>
        </div>
        {courseContext && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="truncate max-w-[200px]">{courseContext}</span>
          </div>
        )}
      </div>

      {/* Chat container */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl border border-border/30 bg-[#0a0a1a] p-4 space-y-4 animate-slide-in-up opacity-0"
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm'
                  : 'bg-secondary/30 border border-border/30 text-foreground rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-foreground prose-strong:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="bg-secondary/30 border border-border/30 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="mt-3 flex gap-2 animate-slide-in-up opacity-0"
        style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
      >
        <div className="flex-1 relative">
          <textarea
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your courses… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-border/40 bg-[#0f0f28] px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 disabled:opacity-50"
          />
          <div className="absolute right-3 bottom-3">
            <Sparkles className="h-4 w-4 text-primary/40" />
          </div>
        </div>
        <Button
          id="assistant-send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="h-auto px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
