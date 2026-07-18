import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SidebarProvider } from '@/components/layout/sidebar-provider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('department, college')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.department || !profile?.college) redirect('/onboarding');

  return (
    <SidebarProvider>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: '#04040c' }}
      >
        {/* Desktop Sidebar — icon rail, hover expands */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />

          <main className="flex-1 overflow-y-auto relative">
            {/* Cosmic mesh background */}
            <div className="absolute inset-0 bg-mesh pointer-events-none" />
            <div className="absolute inset-0 bg-dot pointer-events-none opacity-60" />

            {/* Content — extra bottom padding on mobile for bottom nav */}
            <div className="relative z-10 p-4 sm:p-5 pb-24 md:pb-6">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </SidebarProvider>
  );
}
