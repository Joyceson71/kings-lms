'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/use-user';

type Message = {
  id: string;
  type: 'user' | 'bot';
  content: string;
};

const MOCK_RESPONSES = [
  "I'd be happy to help with that! In Signals and Systems, the Fourier transform allows us to analyze signals in the frequency domain.",
  "Your next assignment for 'Digital Signal Processing' is due in 3 days. I recommend starting with the IIR filter design section.",
  "Great question! A Binary Tree is a tree data structure in which each node has at most two children, which are referred to as the left child and the right child.",
  "According to your attendance records, you are currently at 87%. Keep it up!",
  "I couldn't find a direct answer in your course materials, but I can suggest reading Chapter 4 of 'Network Analysis' for more context.",
];

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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), type: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI response delay
    setTimeout(() => {
      const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      const botMessage: Message = { id: (Date.now() + 1).toString(), type: 'bot', content: randomResponse };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isStudent) return null; // Only show for students for now

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] animate-in slide-in-from-bottom-5 fade-in-20 duration-300">
          <TiltCard intensity={5} glareEffect={false}>
            <div className="glass-card rounded-2xl overflow-hidden border border-primary/20 shadow-[0_8px_32px_oklch(0.65_0.26_285/0.2)] flex flex-col h-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-primary/10 border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
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
          </TiltCard>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group",
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
