'use client';

import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-dot opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 animate-slide-in-up">
        <div className="bg-[#111113] border border-[#1f1f23] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
            
            {/* 404 Graphic */}
            <div className="relative mb-8 flex justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground via-primary to-background drop-shadow-sm" >
                404
              </h1>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3" >
              Page not found
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or perhaps it never existed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => window.history.back()} variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-xl border-border/40 hover:bg-secondary/60">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        
      </div>
    </div>
  );
}
