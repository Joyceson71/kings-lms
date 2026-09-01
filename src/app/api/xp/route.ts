import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { awardXP } from '@/lib/xp';

export async function POST(req: Request) {
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
