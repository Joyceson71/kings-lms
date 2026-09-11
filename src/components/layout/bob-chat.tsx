"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Loader2, Send } from "lucide-react";

export function BobChat() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] p-4 bg-primary text-primary-foreground rounded-full shadow-2xl hover:scale-105 transition-transform glow-cyan flex items-center justify-center border border-white/10"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] h-[550px] z-[9999] flex flex-col clay-card bg-card/95 border border-white/10 shadow-2xl animate-slide-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-xs shadow-lg glow-violet">
                BOB
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide text-foreground">IBM Bob</h3>
                <p className="text-[10px] text-primary uppercase font-bold tracking-widest flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  Online
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                <div className="p-4 rounded-full bg-black/20 border border-white/5">
                  <MessageCircle size={32} className="opacity-70 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Hi! I'm IBM Bob.</p>
                  <p className="text-xs opacity-70 mt-1 max-w-[200px]">I'm your AI development partner powered by IBM. How can I help you today?</p>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground self-end rounded-br-sm shadow-md"
                      : "bg-secondary/50 text-secondary-foreground self-start rounded-bl-sm border border-white/5 backdrop-blur-md"
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="bg-secondary/50 text-secondary-foreground self-start p-3 rounded-2xl rounded-bl-sm border border-white/5 flex items-center">
                <Loader2 className="animate-spin text-primary" size={16} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <form onSubmit={handleSubmit} className="flex gap-2 relative items-center">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask Bob something..."
                className="neo-input bg-black/40 border-white/10 pr-12 focus:border-primary h-11 rounded-full text-sm placeholder:text-muted-foreground/70"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="absolute right-1 h-9 w-9 rounded-full bg-primary hover:bg-primary/80 transition-colors shadow-md"
              >
                <Send size={14} className="ml-0.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
