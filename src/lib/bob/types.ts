export type BobMode = 'ask' | 'plan' | 'agent';

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: string;
  dependencies?: string[];
  status: 'pending' | 'completed' | 'in_progress';
}

export interface BobPlan {
  title: string;
  summary: string;
  steps: PlanStep[];
}

export interface BobMessageMetadata {
  mode: BobMode;
  plan?: BobPlan;
  toolActivity?: {
    toolName: string;
    status: 'running' | 'completed' | 'error';
    summary?: string;
  }[];
}
