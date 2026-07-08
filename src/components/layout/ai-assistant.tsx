'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/use-user';

type Message = {
  id: string;
  type: 'user' | 'bot';
  content: string;
};

// Removed MOCK_RESPONSES

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'bot', content: 'Hi there! I am your AI Course Assistant. How can I help you with your studies today?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { displayName, isStudent } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
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
        body: JSON.stringify({ messages: currentMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      const botMessage: Message = { id: (Date.now() + 1).toString(), type: 'bot', content: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        type: 'bot', 
        content: error.message === 'Gemini API key is missing. Please add GEMINI_API_KEY to your .env.local file.'
          ? "⚠️ Looks like the AI isn't configured yet! Please ask your administrator to add a GEMINI_API_KEY to the environment variables."
          : "Sorry, I ran into an error connecting to my brain. Please try again later."
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isStudent) return null; // Only show for students for now

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] animate-in slide-in-from-bottom-5 fade-in-20 duration-300">
          <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl overflow-hidden border border-primary/20 shadow-[0_8px_32px_oklch(0.65_0.26_285/0.2)] flex flex-col h-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-primary/10 border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5" >
                      Course AI <Sparkles className="h-3 w-3 text-amber-400" />
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Always ready to help</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-secondary/60 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", msg.type === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1", 
                      msg.type === 'user' ? "bg-secondary" : "bg-primary/20"
                    )}>
                      {msg.type === 'user' ? <User className="h-3 w-3 text-foreground" /> : <Bot className="h-3 w-3 text-primary" />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm leading-relaxed",
                      msg.type === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-secondary/60 text-foreground border border-border/40 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2 max-w-[85%] mr-auto">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border/40 rounded-tl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-border/40 bg-background/50">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center"
                >
                  <Input 
                    placeholder="Ask about a course..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="pr-10 h-10 rounded-xl bg-secondary/40 border-border/40 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim() || isTyping}
                    className="absolute right-1 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group",
          isOpen ? "bg-secondary text-foreground border border-border" : "bg-primary shadow-[0_8px_24px_oklch(0.65_0.26_285/0.5)]"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform group-hover:rotate-90" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-2 text-amber-300 animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
