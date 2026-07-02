'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TiltCard } from '@/components/ui/tilt-card';
import { Button } from '@/components/ui/button';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-dot opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 animate-slide-in-up">
        <TiltCard intensity={15}>
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden border-red-500/20">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />
            
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertOctagon className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
              We encountered an unexpected error while trying to load this page. Our team has been notified.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={reset} variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
