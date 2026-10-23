import { User, Bot } from 'lucide-react';
import { isToolUIPart, type UIMessage } from 'ai';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AssistantPlan } from '@/lib/assistant/types';
import { AssistantPlanCard } from './assistant-plan';
import { AssistantAgentActivity } from './assistant-agent-activity';

interface AssistantMessageProps {
  message: UIMessage;
  onApprovePlan?: (plan: AssistantPlan) => void;
}

const generatedPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['High', 'Medium', 'Low']),
    effort: z.string(),
    dependencies: z.array(z.string()).optional(),
  })),
});

function parseGeneratedPlan(value: unknown): AssistantPlan | null {
  const result = generatedPlanSchema.safeParse(value);
  if (!result.success) return null;
  return {
    ...result.data,
    steps: result.data.steps.map(step => ({ ...step, status: 'pending' })),
  };
}

export function AssistantMessage({ message, onApprovePlan }: AssistantMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} my-4`}>
      <div className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center ${isUser ? 'bg-primary/20 text-primary' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser ? 'bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm' : 'bg-secondary/40 border border-border/50 text-foreground rounded-tl-sm'}`}>
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <div key={`text-${index}`} className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-foreground prose-strong:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
              </div>
            );
          }

          if (!isToolUIPart(part)) return null;
          const toolName = 'toolName' in part ? part.toolName : part.type.replace(/^tool-/, '');
          const isPlanTool = toolName === 'generate_study_plan';
          if (isPlanTool && part.state === 'output-available') {
            const plan = parseGeneratedPlan(part.output);
            return plan ? <AssistantPlanCard key={part.toolCallId} plan={plan} onApprove={() => onApprovePlan?.(plan)} /> : null;
          }

          return (
            <AssistantAgentActivity
              key={part.toolCallId}
              toolName={toolName}
              status={part.state === 'output-error' ? 'error' : part.state === 'output-available' ? 'completed' : 'running'}
              summary={part.state === 'output-error' ? part.errorText : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
