import { motion } from 'framer-motion';
import { MessageSquare, ListTodo, BrainCircuit } from 'lucide-react';
import { useBobStore } from '@/lib/bob/store';
import type { BobMode } from '@/lib/bob/types';

export function BobModeSelector() {
  const { mode, setMode } = useBobStore();

  const modes: { id: BobMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'ask', label: 'Ask', icon: <MessageSquare className="h-4 w-4" />, desc: 'Chat & Learn' },
    { id: 'plan', label: 'Plan', icon: <ListTodo className="h-4 w-4" />, desc: 'Strategy' },
    { id: 'agent', label: 'Agent', icon: <BrainCircuit className="h-4 w-4" />, desc: 'Execution' }
  ];

  return (
    <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/50 shadow-inner w-fit mx-auto mb-4">
      {modes.map((m) => {
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {isActive && (
              <motion.div
                layoutId="mode-selector-bg"
                className="absolute inset-0 bg-primary rounded-lg shadow-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {m.icon}
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
