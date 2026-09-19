import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BobComposerProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  stop: () => void;
  placeholder?: string;
}

export function BobComposer({ input, handleInputChange, handleSubmit, isLoading, stop, placeholder }: BobComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder || "Ask Bob anything... (Enter to send)"}
            rows={1}
            disabled={isLoading}
            style={{ minHeight: '52px', overflowY: input.length > 100 ? 'auto' : 'hidden' }}
            className="w-full resize-none rounded-2xl border border-border/50 bg-secondary/30 px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background outline-none transition-all duration-200 disabled:opacity-50 shadow-sm"
          />
          <div className="absolute right-4 bottom-4">
            <Sparkles className="h-4 w-4 text-primary/40" />
          </div>
        </div>
        
        {isLoading ? (
          <Button
            type="button"
            onClick={stop}
            size="icon"
            className="h-[52px] w-[52px] rounded-2xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-all duration-200 flex-shrink-0"
            aria-label="Stop generating"
          >
            <StopCircle className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim()}
            className="h-[52px] w-[52px] rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,180,216,0.3)] transition-all duration-200 flex-shrink-0 p-0"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </form>
    </div>
  );
}
