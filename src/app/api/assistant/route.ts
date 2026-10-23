import { handleAssistantRequest } from '@/lib/assistant/handler';

export const maxDuration = 30;

export async function POST(req: Request) {
  return handleAssistantRequest(req);
}
