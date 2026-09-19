import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface BobAgentActivityProps {
  toolName: string;
  status: 'running' | 'completed' | 'error';
  summary?: string;
}

export function BobAgentActivity({ toolName, status, summary }: BobAgentActivityProps) {
  const isRunning = status === 'running';
  const isError = status === 'error';
  
  return (
    <div className="flex items-center gap-3 bg-secondary/20 border border-border/40 rounded-lg p-3 my-2 shadow-sm text-sm">
      {isRunning && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
      {!isRunning && !isError && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
      {isError && <XCircle className="h-4 w-4 text-destructive" />}
      
      <div className="flex flex-col">
        <span className={`font-medium ${isError ? 'text-destructive' : 'text-foreground'}`}>
          {isRunning ? `Executing ${toolName}...` : `Completed ${toolName}`}
        </span>
        {summary && <span className="text-xs text-muted-foreground mt-0.5">{summary}</span>}
      </div>
    </div>
  );
}
