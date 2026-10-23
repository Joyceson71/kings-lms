import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { handleAssistantRequest } from '@/lib/assistant/handler';

export const maxDuration = 60;

async function handlePOST(req: Request) {
  return handleAssistantRequest(req, 'ui');
}

export const POST = withApiHandler(handlePOST, { route: '/api/assistant/chat POST', auth: true, bodySchema: z.object({}).passthrough() });
