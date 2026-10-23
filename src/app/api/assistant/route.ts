import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { handleAssistantRequest } from '@/lib/assistant/handler';

export const maxDuration = 30;

async function handlePOST(req: Request) {
  return handleAssistantRequest(req);
}

export const POST = withApiHandler(handlePOST, { route: '/api/assistant POST', auth: true, bodySchema: z.object({}).passthrough() });
