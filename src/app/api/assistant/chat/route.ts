import { handleAssistantRequest } from '@/lib/assistant/handler';

export const maxDuration = 60;

export async function POST(req: Request) {
  return handleAssistantRequest(req);
}
