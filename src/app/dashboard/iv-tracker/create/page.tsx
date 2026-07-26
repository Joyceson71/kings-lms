import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreateTripModal from '@/components/iv/CreateTripModal';

export default async function CreateTripPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['faculty', 'admin'].includes(profile.role)) {
    redirect('/dashboard/iv-tracker');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <CreateTripModal />
    </div>
  );
}
