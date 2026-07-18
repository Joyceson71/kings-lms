'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/use-user';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  type: 'user' | 'bot';
  content: string;
};

const INITIAL_MESSAGE: Message = {
  id: '1',
  type: 'bot',
  content: 'Hi! I\'m your **AI Course Assistant**. Ask me anything about your courses, assignments, or campus life! 🎓',
};

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex gap-2 mr-auto">
      <div
        className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: 'rgb(129 140 248 / 0.15)', border: '1px solid rgb(129 140 248 / 0.2)' }}
      >
        <Bot className="h-3 w-3 text-indigo-300" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5"
        style={{ background: '#0f0f28', border: '1px solid #1a1a3a' }}
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#818cf8',
              animation: `bounce 1.2s ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
});

export const AIAssistant = memo(function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile, isStudent } = useUser();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleClear = useCallback(() => {
    setMessages([{ ...INITIAL_MESSAGE, id: Date.now().toString() }]);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), type: 'user', content: input };
    const currentMessages = [...messages, userMessage];

    setMessages(currentMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, profile }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch response');

      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: data.reply }]);
    } catch (error: any) {
      const errContent = error.message?.includes('GEMINI_API_KEY')
        ? '⚠️ AI isn\'t configured yet! Ask your administrator to add the API key.'
        : 'Sorry, I ran into an error. Please try again later.';
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: errContent }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, profile]);

  if (!isStudent) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end">
      {/* Chat window */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] animate-slide-in-up opacity-0"
          style={{ animationFillMode: 'forwards' }}>
          <div
            className="overflow-hidden flex flex-col"
            style={{
              height: '500px',
              background: '#06060f',
              border: '1px solid #1a1a3a',
              borderRadius: '20px',
              boxShadow: '0 24px 64px rgb(0 0 0 / 0.8), 0 0 0 1px #1a1a3a, 0 0 60px rgb(129 140 248 / 0.08)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: 'linear-gradient(135deg, rgb(129 140 248 / 0.08), rgb(34 211 238 / 0.04))',
                borderBottom: '1px solid #1a1a3a',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgb(129 140 248 / 0.2), rgb(34 211 238 / 0.1))',
                    border: '1px solid rgb(129 140 248 / 0.3)',
                    boxShadow: '0 0 16px rgb(129 140 248 / 0.2)',
                  }}
                >
                  <Bot className="h-4 w-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                    Course AI
                    <Sparkles className="h-3 w-3 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }} />
                  </h3>
                  <p className="text-[10px] text-slate-500">Always ready to help</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon"
                  onClick={handleClear}
                  className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-600"
                  title="Clear Chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 hover:bg-slate-800 rounded-lg text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2 max-w-[85%]',
                    msg.type === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto',
                  )}
                >
                  <div
                    className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                    )}
                    style={msg.type === 'user'
                      ? { background: '#0f0f28', border: '1px solid #1a1a3a' }
                      : { background: 'rgb(129 140 248 / 0.15)', border: '1px solid rgb(129 140 248 / 0.2)' }
                    }
                  >
                    {msg.type === 'user'
                      ? <User className="h-3 w-3 text-slate-400" />
                      : <Bot className="h-3 w-3 text-indigo-300" />
                    }
                  </div>
                  <div
                    className={cn('p-3 rounded-2xl text-[13px] leading-relaxed')}
                    style={msg.type === 'user'
                      ? {
                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                        color: '#fff',
                        borderTopRightRadius: '4px',
                        boxShadow: '0 4px 16px rgb(129 140 248 / 0.3)',
                      }
                      : {
                        background: '#0f0f28',
                        border: '1px solid #1a1a3a',
                        color: '#cbd5e1',
                        borderTopLeftRadius: '4px',
                      }
                    }
                  >
                    {msg.type === 'user' ? (
                      msg.content
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-a:text-indigo-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-3"
              style={{ borderTop: '1px solid #1a1a3a', background: 'rgba(4, 4, 12, 0.6)' }}
            >
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center gap-2"
              >
                <Input
                  placeholder="Ask about a course..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 h-10 rounded-xl text-[13px] placeholder:text-slate-700 border-[#1a1a3a] bg-[#080818] focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 text-white"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isTyping}
                  className="h-10 w-10 rounded-xl flex-shrink-0 disabled:opacity-30 transition-all"
                  style={{
                    background: input.trim() && !isTyping
                      ? 'linear-gradient(135deg, #818cf8, #6366f1)'
                      : '#0f0f28',
                    border: '1px solid #1a1a3a',
                    boxShadow: input.trim() && !isTyping ? '0 0 16px rgb(129 140 248 / 0.4)' : 'none',
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FAB Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300',
          'hover:scale-105 active:scale-95',
        )}
        style={{
          background: isOpen
            ? '#0f0f28'
            : 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
          border: '1px solid',
          borderColor: isOpen ? '#1a1a3a' : 'rgb(129 140 248 / 0.4)',
          boxShadow: isOpen
            ? '0 4px 16px rgb(0 0 0 / 0.4)'
            : '0 0 24px rgb(129 140 248 / 0.5), 0 8px 32px rgb(0 0 0 / 0.4)',
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-slate-300 transition-transform rotate-0 hover:rotate-90" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-white" />
            <Zap
              className="h-3 w-3 absolute -top-1.5 -right-2 text-amber-300"
              style={{ filter: 'drop-shadow(0 0 4px #fbbf24)', animation: 'pulse 2s ease-in-out infinite' }}
            />
          </div>
        )}
      </button>
    </div>
  );
});
