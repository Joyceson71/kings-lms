import { Suspense } from 'react';
import { GraduationCap, CheckCircle2, Zap, Shield, BarChart3, Bell } from 'lucide-react';

const features = [
  { icon: CheckCircle2, text: 'QR-based attendance — mark in seconds',      color: '#34d399' },
  { icon: Zap,          text: 'Live session tracking for every course',       color: '#818cf8' },
  { icon: BarChart3,    text: 'Assignment submissions & real-time grading',   color: '#22d3ee' },
  { icon: Bell,         text: 'Leaderboard, resources & announcements',       color: '#fbbf24' },
  { icon: Shield,       text: 'Role-based access — students, faculty, admin', color: '#f87171' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen"
      style={{ background: '#04040c' }}
    >
      {/* Background mesh + grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-60" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 50%, rgb(129 140 248 / 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 20%, rgb(34 211 238 / 0.08) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 100%, rgb(52 211 153 / 0.06) 0%, transparent 40%)
          `,
        }}
      />

      {/* ── Left panel — branding (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[460px] xl:w-[520px] flex-shrink-0 flex-col justify-between p-12 relative overflow-hidden"
        style={{ borderRight: '1px solid #1a1a3a' }}
      >
        {/* Animated orbs */}
        <div
          className="absolute -top-32 -left-32 h-80 w-80 rounded-full blur-3xl opacity-25 animate-orb-float-1"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 65%)' }}
        />
        <div
          className="absolute bottom-16 -right-24 h-72 w-72 rounded-full blur-3xl opacity-20 animate-orb-float-2"
          style={{ background: 'radial-gradient(circle, #22d3ee 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full blur-3xl opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 65%)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              boxShadow: '0 0 24px rgb(129 140 248 / 0.5), 0 0 60px rgb(129 140 248 / 0.15)',
            }}
          >
            <GraduationCap className="text-white h-5 w-5" />
          </div>
          <div>
            <span className="text-[16px] font-black tracking-tight text-white block"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              Kings EC
            </span>
            <span className="text-[10px] text-slate-500 tracking-wider font-semibold uppercase">Platform</span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgb(129 140 248 / 0.08)', border: '1px solid rgb(129 140 248 / 0.2)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-status-pulse" />
              <span className="text-[11px] font-semibold text-indigo-300 tracking-wider">Campus Learning Platform</span>
            </div>

            <h2
              className="text-4xl font-black tracking-tight text-white leading-[1.1] mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Your campus.
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 40%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                All in one place.
              </span>
            </h2>
            <p className="text-[14px] text-slate-400 leading-relaxed max-w-sm">
              From attendance to assignments — Kings Engineering College&apos;s
              unified learning platform keeps every student and faculty member connected.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-3 animate-slide-in-right opacity-0"
                style={{ animationDelay: `${i * 80 + 200}ms`, animationFillMode: 'forwards' }}
              >
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${f.color}18`,
                    border: `1px solid ${f.color}30`,
                  }}
                >
                  <f.icon className="h-3.5 w-3.5" style={{ color: f.color }} />
                </div>
                <span className="text-[13px] text-slate-300 font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer testimonial */}
        <div className="relative z-10 space-y-4">
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgb(129 140 248 / 0.06), rgb(34 211 238 / 0.04))',
              border: '1px solid rgb(129 140 248 / 0.15)',
              boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.04)',
            }}
          >
            <blockquote className="text-slate-400 text-[13px] leading-relaxed italic">
              &ldquo;The campus learning platform that keeps all of Kings Engineering College
              connected — from attendance to assignments, in one place.&rdquo;
            </blockquote>
            <div className="mt-3 flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center text-[11px] font-black"
                style={{
                  background: 'linear-gradient(135deg, #312e81, #1e1b4b)',
                  color: '#a5b4fc',
                  border: '1px solid rgb(129 140 248 / 0.2)',
                }}
              >
                KE
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">Kings Engineering College</p>
                <p className="text-[11px] text-slate-600">Campus Administration</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-700">
            © {new Date().getFullYear()} Kings Engineering College. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel — auth form ── */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 relative">

        {/* Mobile: top logo */}
        <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              boxShadow: '0 0 24px rgb(129 140 248 / 0.5)',
            }}
          >
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <span className="text-[17px] font-black text-white block" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Kings EC Platform
            </span>
            <span className="text-[11px] text-slate-500">Campus Learning & Management</span>
          </div>
        </div>

        {/* Form container */}
        <div
          className="w-full max-w-[400px] rounded-3xl p-8"
          style={{
            background: 'rgba(8, 8, 24, 0.9)',
            border: '1px solid #1a1a3a',
            boxShadow: '0 24px 80px rgb(0 0 0 / 0.6), 0 0 0 1px #1a1a3a, inset 0 1px 0 rgb(255 255 255 / 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-48">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-900 border-t-indigo-400 animate-spin" />
                  <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 16px rgb(129 140 248 / 0.3)' }} />
                </div>
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
