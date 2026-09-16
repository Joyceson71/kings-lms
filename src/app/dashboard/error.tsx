'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-4 shadow-lg">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {error?.message || 'We encountered an error loading this dashboard view. Please try again or return to the main overview.'}
      </p>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="gap-2 bg-primary text-primary-foreground font-semibold px-5"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        
        <Button
          asChild
          variant="outline"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>
        </Button>
      </div>
    </div>
  );
}
