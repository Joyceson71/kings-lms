import { Suspense } from 'react';
import { GraduationCap, CheckCircle2 } from 'lucide-react';

const features = [
  { text: 'QR-based attendance — mark in seconds' },
  { text: 'Live session tracking for every course' },
  { text: 'Assignment submissions & grading' },
  { text: 'Leaderboard, resources & announcements' },
];

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
        className="hidden lg:flex lg:w-[420px] xl:w-[500px] flex-shrink-0 flex-col justify-between p-12 relative overflow-hidden"
        style={{ borderRight: '1px solid #1a1a1d' }}
      >
        {/* Animated background orbs */}
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-20 animate-orb-float-1"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-16 -right-16 h-64 w-64 rounded-full blur-3xl opacity-15 animate-orb-float-2"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/3 h-48 w-48 rounded-full blur-3xl opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #a5b4fc 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 20px rgb(99 102 241 / 0.4)' }}
          >
            <GraduationCap className="text-white" style={{ width: '1.125rem', height: '1.125rem' }} />
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">Kings EC Platform</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-10">
          {/* Headline */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              Your campus.<br />
              <span style={{
                background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                All in one place.
              </span>
            </h2>
            <p className="text-[14px] text-zinc-400 leading-relaxed">
              From attendance to assignments — Kings Engineering College&apos;s
              unified learning platform keeps every student and faculty member connected.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-3 animate-slide-in-right opacity-0"
                style={{ animationDelay: `${i * 80 + 200}ms`, animationFillMode: 'forwards' }}
              >
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgb(99 102 241 / 0.15)', border: '1px solid rgb(99 102 241 / 0.3)' }}
                >
                  <CheckCircle2 className="h-3 w-3 text-indigo-400" />
                </div>
                <span className="text-[13px] text-zinc-300">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial & footer */}
        <div className="relative z-10 space-y-6">
          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgb(99 102 241 / 0.06)', border: '1px solid rgb(99 102 241 / 0.15)' }}
          >
            <blockquote className="text-zinc-400 text-[13px] leading-relaxed italic">
              &ldquo;The campus learning platform that keeps all of Kings Engineering College
              connected — from attendance to assignments, in one place.&rdquo;
            </blockquote>
            <div className="mt-3 flex items-center gap-2.5">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: '#312e81', color: '#a5b4fc' }}
              >
                KE
              </div>
              <div>
                <p className="text-[12px] font-medium text-white">Kings Engineering College</p>
                <p className="text-[11px] text-zinc-600">Campus Administration</p>
              </div>
            </div>
          </div>

          <p className="text-[12px] text-zinc-700">
            © {new Date().getFullYear()} Kings Engineering College
          </p>
        </div>
      </div>

      {/* Right column — auth form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 16px rgb(99 102 241 / 0.35)' }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[14px] font-semibold text-white">Kings EC Platform</span>
        </div>

        <div className="w-full max-w-[380px]">
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
