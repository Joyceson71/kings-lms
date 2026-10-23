export type AssistantMode = 'ask' | 'plan' | 'agent';

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: string;
  dependencies?: string[];
  status: 'pending' | 'completed' | 'in_progress';
}

export interface AssistantPlan {
  title: string;
  summary: string;
  steps: PlanStep[];
}

export interface AssistantMessageMetadata {
  mode: AssistantMode;
  plan?: AssistantPlan;
  toolActivity?: {
    toolName: string;
    status: 'running' | 'completed' | 'error';
    summary?: string;
  }[];
}
