import { Suspense } from 'react';
import { GraduationCap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen"
      style={{ background: '#0a0a0b' }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Left column — branding (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 flex-col justify-between p-12"
        style={{ borderRight: '1px solid #1a1a1d' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: '#6366f1' }}
          >
            <GraduationCap className="h-4.5 w-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">Kings EC Platform</span>
        </div>

        {/* Testimonial / quote */}
        <div>
          <blockquote className="text-zinc-400 text-[15px] leading-relaxed">
            &ldquo;The campus learning platform that keeps all of Kings Engineering College
            connected — from attendance to assignments, in one place.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
              style={{ background: '#312e81', color: '#a5b4fc' }}
            >
              KE
            </div>
            <div>
              <p className="text-[13px] font-medium text-white">Kings Engineering College</p>
              <p className="text-[12px] text-zinc-600">Campus Administration</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[12px] text-zinc-700">
          © {new Date().getFullYear()} Kings Engineering College
        </p>
      </div>

      {/* Right column — auth form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: '#6366f1' }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[14px] font-semibold text-white">Kings EC Platform</span>
        </div>

        <div className="w-full max-w-[360px]">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-48">
                <div
                  className="h-6 w-6 rounded-full border-2 border-zinc-800 border-t-indigo-500 animate-spin"
                />
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
