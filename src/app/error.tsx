'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#0A0A14] text-foreground min-h-screen flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">Unexpected Error</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            An unexpected error occurred. You can retry or head back to the home page.
          </p>

          <div className="flex justify-center gap-3">
            <Button
              onClick={() => reset()}
              className="gap-2 bg-primary text-primary-foreground font-semibold px-5"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            
            <Link href="/">
              <Button
                variant="outline"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
