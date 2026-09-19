'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBobStore } from '@/lib/bob/store';
import { BobModeSelector } from './bob-mode-selector';
import { BobMessage } from './bob-message';
import { BobComposer } from './bob-composer';
import type { BobPlan } from '@/lib/bob/types';
import { toast } from 'sonner';

interface BobChatWorkspaceProps {
  userName: string;
  contextData?: {
    enrolledCourses?: string;
  };
}

export function BobChatWorkspace({ userName, contextData }: BobChatWorkspaceProps) {
  const { mode } = useBobStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = useChat({
    api: '/api/bob/chat',
    body: { mode },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to connect to Bob.');
    }
  } as any) as any;

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    append
  } = chat;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const clearChat = () => {
    setMessages([]);
  };

  const handleApprovePlan = (plan: BobPlan) => {
    // Send a message to agent mode telling it to execute the approved plan
    append({
      role: 'user',
      content: `I approve the plan "${plan.title}". Please run it now.`,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              IBM Bob
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

      <BobModeSelector />

      {/* Chat container */}
      <div className="flex-1 overflow-y-auto rounded-3xl border border-border/40 bg-card/50 backdrop-blur-xl p-4 sm:p-6 space-y-2 relative shadow-2xl flex flex-col custom-scrollbar">
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
          messages.map((msg: any, index: number) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BobMessage 
                message={msg} 
                isLast={index === messages.length - 1} 
                onApprovePlan={handleApprovePlan}
              />
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input area */}
      <div className="mt-4">
        <BobComposer 
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          placeholder={`Ask Bob in ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode...`}
        />
      </div>
    </div>
  );
}
