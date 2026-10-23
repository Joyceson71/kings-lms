'use client';

import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssistantStore } from '@/lib/assistant/store';
import { AssistantModeSelector } from './assistant-mode-selector';
import { AssistantMessage } from './assistant-message';
import { AssistantComposer } from './assistant-composer';
import type { AssistantPlan } from '@/lib/assistant/types';
import { toast } from 'sonner';

interface AssistantWorkspaceProps {
  userName: string;
  contextData?: {
    enrolledCourses?: string;
  };
}

export function AssistantWorkspace({ userName, contextData }: AssistantWorkspaceProps) {
  const { mode } = useAssistantStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryRef = useRef<() => void>(() => {});
  const [input, setInput] = useState('');

  const chat = useChat({
    transport: new DefaultChatTransport({ api: '/api/assistant/chat', body: { mode } }),
    onError: (error: Error) => {
      toast.error('Kings Assistant is unavailable.', {
        description: error.message,
        action: { label: 'Retry', onClick: () => retryRef.current() },
      });
    },
  });
  retryRef.current = () => { void chat.regenerate(); };

  const {
    messages,
    status,
    stop,
    setMessages,
  } = chat;
  const isLoading = status === 'submitted' || status === 'streaming';
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value);
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    void chat.sendMessage({ text });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const clearChat = () => {
    setMessages([]);
  };

  const handleApprovePlan = (plan: AssistantPlan) => {
    // Send a message to agent mode telling it to execute the approved plan
    void chat.sendMessage({ text: `I approve the plan "${plan.title}". Please run it now.` });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              Kings Assistant
            </span>
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Workspace
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your personal AI productivity and learning assistant
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {contextData?.enrolledCourses && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="truncate max-w-[200px]">{contextData.enrolledCourses}</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearChat}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear Chat</span>
          </Button>
        </div>
      </div>

      <AssistantModeSelector />

      {/* Chat container */}
      <div className="flex-1 overflow-y-auto rounded-3xl border border-border/40 bg-card/50 backdrop-blur-xl p-4 sm:p-6 space-y-2 relative shadow-2xl flex flex-col custom-scrollbar">
        {status === 'error' && (
          <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <span>Kings Assistant is unavailable. {chat.error?.message}</span>
            <Button variant="outline" size="sm" onClick={() => void chat.regenerate()}>Retry</Button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 max-w-md mx-auto my-auto opacity-80">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Welcome to your AI Workspace, {userName.split(' ')[0]}!</p>
              <p className="text-sm mt-2">
                Use <strong>Ask</strong> for questions, <strong>Plan</strong> to map out complex tasks, and <strong>Agent</strong> to take action on your behalf.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AssistantMessage message={msg} onApprovePlan={handleApprovePlan} />
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input area */}
      <div className="mt-4">
        <AssistantComposer 
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          placeholder={`Ask Assistant in ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode...`}
        />
      </div>
    </div>
  );
}
