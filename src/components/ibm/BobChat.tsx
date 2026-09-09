'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, User, Sparkles, Loader2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AnimatePresence, motion } from 'framer-motion';

interface BobChatProps {
  userRole: 'student' | 'faculty' | 'admin';
  userName: string;
  context?: {
    courses?: string[];
    currentPage?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function BobChat({ userRole, userName, context }: BobChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi ${userName.split(' ')[0]}! I'm **IBM Bob**, your AI Study Assistant.\n\nI see you are currently viewing **${context?.currentPage || 'your dashboard'}**.\n\nWhat would you like to learn today?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          context: {
            currentPage: context?.currentPage,
            enrolledCourses: context?.courses?.join(', '),
          }
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Too many requests. Please wait a moment.');
        }
        throw new Error('Failed to get response');
      }

      if (!res.body) return;
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantContent;
          return updated;
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error(error);
        setMessages((prev) => [
          ...prev, 
          { id: Date.now().toString(), role: 'assistant', content: `❌ ${error.message || 'Sorry, I encountered an error.'}` }
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Bob — AI Study Assistant"
            className="bob-trigger"
          >
            <div className="bob-avatar">B</div>
            <span className="bob-label">Ask Bob</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh] bg-background border border-border shadow-2xl rounded-2xl flex flex-col z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/5 border-b border-border p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  B
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">IBM Bob</h3>
                  <p className="text-xs text-muted-foreground">AI Study Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary/80 text-muted-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-background/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
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
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm'
                        : 'bg-secondary/40 border border-border/50 text-foreground rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-foreground prose-strong:text-foreground">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code(props) {
                              const {children, className, node, ref, ...rest} = props
                              const match = /language-(\w+)/.exec(className || '')
                              return match ? (
                                <SyntaxHighlighter
                                  {...rest}
                                  PreTag="div"
                                  language={match[1]}
                                  style={vscDarkPlus}
                                  className="rounded-lg border border-border/50 text-[12px] my-2"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code ref={ref as any} {...rest} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="bg-secondary/40 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-background border-t border-border/50 shrink-0">
              <form 
                onSubmit={handleSubmit}
                className="flex gap-2 items-end relative"
              >
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() && !isLoading) {
                          handleSubmit();
                        }
                      }
                    }}
                    placeholder={`Ask Bob about ${context?.currentPage || 'anything'}...`}
                    rows={1}
                    disabled={isLoading}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    className="w-full resize-none rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 scrollbar-thin"
                  />
                  <div className="absolute right-3 top-3 text-primary/40">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
                {isLoading ? (
                  <Button
                    type="button"
                    onClick={stopGenerating}
                    size="icon"
                    className="h-[44px] w-[44px] rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shrink-0 transition-all duration-200"
                  >
                    <StopCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!input.trim()}
                    size="icon"
                    className="h-[44px] w-[44px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
