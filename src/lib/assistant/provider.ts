import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export class AssistantConfigurationError extends Error {
  readonly code = 'ASSISTANT_CONFIGURATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'AssistantConfigurationError';
  }
}

export function createAssistantModel(): LanguageModel {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL;

  if (!apiKey) {
    throw new AssistantConfigurationError('The assistant is unavailable because GEMINI_API_KEY is not configured.');
  }
  if (!modelId) {
    throw new AssistantConfigurationError('The assistant is unavailable because GEMINI_MODEL is not configured.');
  }

  return createGoogleGenerativeAI({ apiKey })(modelId);
}
