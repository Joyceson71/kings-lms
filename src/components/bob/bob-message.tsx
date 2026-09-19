import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { BobPlanCard } from './bob-plan';
import { BobAgentActivity } from './bob-agent-activity';

interface BobMessageProps {
  message: any;
  isLast?: boolean;
  onApprovePlan?: (planData: any) => void;
}

export function BobMessage({ message, isLast, onApprovePlan }: BobMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} my-4`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center ${
          isUser
            ? 'bg-primary/20 text-primary'
            : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm'
            : 'bg-secondary/40 border border-border/50 text-foreground rounded-tl-sm backdrop-blur-md'
        }`}
      >
        {/* Render normal text content */}
        {message.content && (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-foreground prose-strong:text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <SyntaxHighlighter
                      {...(rest as any)}
                      PreTag="div"
                      language={match[1]}
                      style={vscDarkPlus}
                      className="rounded-lg border border-border/50 text-[13px] my-2 shadow-inner"
                    >
                      {String(children).replace(/\\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code {...rest} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-mono text-xs">
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Render tool invocations (Agent Activity / Plan) */}
        {message.toolInvocations?.map((toolInv: any) => {
          if (toolInv.toolName === 'generate_study_plan') {
            if ('result' in toolInv) {
               return <BobPlanCard key={toolInv.toolCallId} plan={toolInv.result} onApprove={() => onApprovePlan?.(toolInv.result)} />;
            }
            return (
               <div key={toolInv.toolCallId} className="italic text-muted-foreground my-2 animate-pulse">
                 Generating structured plan...
               </div>
            );
          }
          
          return (
            <BobAgentActivity
              key={toolInv.toolCallId}
              toolName={toolInv.toolName}
              status={'result' in toolInv ? 'completed' : 'running'}
            />
          );
        })}
      </div>
    </div>
  );
}
