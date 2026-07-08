import { Suspense } from 'react';
import { GraduationCap, BookOpen, Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden"
      style={{ background: 'oklch(0.09 0.02 265)' }}
    >
      {/* Deep background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(oklch(1 0 0 / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, oklch(1 0 0 / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.65 0.26 285 / 0.14) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'orbFloat1 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[-8%] w-[50%] h-[50%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.65 0.2 220 / 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'orbFloat2 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[45%] right-[12%] w-[28%] h-[28%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.75 0.16 85 / 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'orbFloat1 10s ease-in-out infinite reverse',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, oklch(0.06 0.01 265 / 0.7) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 text-center" style={{ animation: 'slideUp 0.5s ease forwards' }}>
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div
                className="h-16 w-16 rounded-[22px] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.65 0.26 285) 0%, oklch(0.55 0.28 300) 100%)',
                  boxShadow: '0 0 40px oklch(0.65 0.26 285 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.2)',
                }}
              >
                <GraduationCap className="h-9 w-9 text-white" />
              </div>
              <div
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center"
                style={{ background: 'oklch(0.75 0.16 85)', boxShadow: '0 0 12px oklch(0.75 0.16 85 / 0.7)' }}
              >
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <div
                className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full"
                style={{ background: 'oklch(0.70 0.20 165)', boxShadow: '0 0 10px oklch(0.70 0.20 165 / 0.8)' }}
              />
            </div>
          </div>

          <h1
            className="text-3xl font-black tracking-tight text-white mb-1.5"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Kings EC{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, oklch(0.78 0.18 285), oklch(0.75 0.16 85))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Platform
            </span>
          </h1>
          <p className="text-sm text-white/40 flex items-center justify-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Campus Learning &amp; Management System
          </p>
        </div>

        {/* Auth slot — Suspense required for useSearchParams in children */}
        <div style={{ animation: 'slideUp 0.5s ease 0.1s both' }}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
              </div>
            }
          >
            {children}
          </Suspense>
        </div>

        <p
          className="mt-6 text-center text-xs text-white/20"
          style={{ animation: 'slideUp 0.5s ease 0.25s both' }}
        >
          © {new Date().getFullYear()} Kings Engineering College. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, 4%) scale(1.06); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-4%, -3%) scale(1.04); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
