'use client';

import { ParticlesBg } from '@/components/ui/particles-bg';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      {/* Particle canvas background */}
      <div className="absolute inset-0">
        <ParticlesBg count={80} />
      </div>

      {/* Ambient orbs */}
      <div
        className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none animate-orb-float-1"
        style={{
          background: 'radial-gradient(circle, oklch(0.65 0.26 285 / 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full pointer-events-none animate-orb-float-2"
        style={{
          background: 'radial-gradient(circle, oklch(0.75 0.16 85 / 0.09) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute top-[40%] right-[10%] w-[25%] h-[25%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.70 0.20 165 / 0.07) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orb-float-1 12s ease-in-out infinite reverse',
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center animate-slide-in-up" style={{ animationDelay: '0ms' }}>
          {/* Logo mark */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-[0_0_30px_oklch(0.65_0.26_285/0.5)] animate-pulse-glow">
                <GraduationCap className="h-9 w-9 text-white" />
              </div>
              {/* Sparkle decorations */}
              <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-amber-400 animate-spin-slow" />
              <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-emerald-400 glow-emerald animate-status-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Kings EC Platform</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center justify-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Campus Learning &amp; Management System
          </p>
        </div>

        {/* Auth card slot */}
        <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60 animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          © {new Date().getFullYear()} Kings Engineering College. All rights reserved.
        </p>
      </div>
    </div>
  );
}
