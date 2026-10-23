import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { awardXP } from '@/lib/xp';

async function handlePOST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, relatedId } = await req.json();

    await awardXP(supabase, user.id, action, relatedId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withApiHandler(handlePOST, { route: '/api/xp POST', auth: true, bodySchema: z.object({ action: z.string().min(1), relatedId: z.string().optional() }) });
