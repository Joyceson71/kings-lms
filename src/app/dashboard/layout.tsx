import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SidebarProvider } from '@/components/layout/sidebar-provider';
import { PomodoroTimer } from '@/components/ui/pomodoro-timer';

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
      {/* ── Anime energy bar — top of viewport ── */}
      <div className="fixed top-0 left-0 right-0 z-[9999] energy-bar" style={{ height: '2px' }} />

      <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A14' }}>

        {/* ── Layered spatial background ── */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Deep grid */}
          <div className="absolute inset-0 bg-grid-sm opacity-40" />
          {/* Anime orbs */}
          <div
            className="absolute w-[600px] h-[600px] rounded-full animate-orb-float-1 opacity-60"
            style={{
              top: '-10%', left: '-5%',
              background: 'radial-gradient(circle, rgb(255 0 110 / 0.18) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full animate-orb-float-2 opacity-50"
            style={{
              bottom: '-5%', right: '-5%',
              background: 'radial-gradient(circle, rgb(0 245 255 / 0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full animate-orb-float-3 opacity-40"
            style={{
              top: '40%', left: '50%',
              background: 'radial-gradient(circle, rgb(191 0 255 / 0.1) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          {/* Scan lines */}
          <div className="absolute inset-0 bg-scanlines opacity-60" />
        </div>

        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative z-10">
          <Header />

          <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full">
            {/* Content — extra bottom padding on mobile for bottom nav */}
            <div className="relative z-10 p-4 sm:p-5 pb-28 md:pb-6">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />

      {/* Floating Pomodoro Focus Timer */}
      <PomodoroTimer />
    </SidebarProvider>
  );
}

