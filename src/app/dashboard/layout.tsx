import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/components/layout/sidebar-provider';
import { OnboardingGuard } from '@/components/auth/onboarding-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto relative">
            {/* Subtle background grid */}
            <div className="absolute inset-0 bg-dot opacity-30 pointer-events-none" />
            {/* Subtle top glow */}
            <div
              className="absolute top-0 inset-x-0 h-40 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, oklch(0.65 0.26 285 / 0.04) 0%, transparent 100%)' }}
            />
            <div className="relative z-10 p-3 sm:p-6">
              <div className="mx-auto max-w-7xl">
                <OnboardingGuard>
                  {children}
                </OnboardingGuard>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
