import { CheckCircle2, Circle, Clock, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BobPlan } from '@/lib/bob/types';
import { useBobStore } from '@/lib/bob/store';

interface BobPlanProps {
  plan: BobPlan;
  onApprove?: () => void;
}

export function BobPlanCard({ plan, onApprove }: BobPlanProps) {
  const { setMode } = useBobStore();
  
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden my-4">
      <div className="bg-primary/10 border-b border-border/50 p-4">
        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {plan.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{plan.summary}</p>
      </div>
      
      <div className="p-4 space-y-3">
        {plan.steps.map((step, idx) => (
          <div key={step.id} className="flex gap-3 bg-secondary/20 p-3 rounded-lg border border-border/30">
            <div className="mt-0.5">
              {step.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : step.status === 'in_progress' ? (
                <Activity className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm">{idx + 1}. {step.title}</h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full border ${
                    step.priority === 'High' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    step.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    {step.priority}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/50">
                    <Clock className="h-3 w-3" />
                    {step.effort}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {onApprove && (
        <div className="bg-secondary/30 p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" size="sm">Edit</Button>
          <Button 
            size="sm"
            onClick={() => {
              onApprove();
              setMode('agent'); // Transition to agent mode after approval
            }}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            Approve & Run with Agent
          </Button>
        </div>
      )}
    </div>
  );
}
