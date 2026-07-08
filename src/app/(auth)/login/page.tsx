'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight, GraduationCap, Users, ShieldCheck, Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Role = 'student' | 'faculty' | 'admin';

const roles: {
  key: Role;
  label: string;
  icon: React.ElementType;
  pill: string;
  gradient: string;
  glow: string;
}[] = [
  {
    key: 'student',
    label: 'Student',
    icon: GraduationCap,
    pill: 'border-sky-500/50 bg-sky-500/10 text-sky-300 shadow-[0_0_16px_oklch(0.65_0.2_220/0.2)]',
    gradient: 'from-sky-600 to-cyan-500',
    glow: 'hover:shadow-[0_8px_32px_oklch(0.65_0.2_220/0.45)]',
  },
  {
    key: 'faculty',
    label: 'Faculty',
    icon: Users,
    pill: 'border-violet-500/50 bg-violet-500/10 text-violet-300 shadow-[0_0_16px_oklch(0.65_0.26_285/0.2)]',
    gradient: 'from-violet-600 to-purple-500',
    glow: 'hover:shadow-[0_8px_32px_oklch(0.65_0.26_285/0.45)]',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    pill: 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_16px_oklch(0.75_0.16_85/0.2)]',
    gradient: 'from-amber-600 to-orange-500',
    glow: 'hover:shadow-[0_8px_32px_oklch(0.75_0.16_85/0.45)]',
  },
];

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';

  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeRole = roles.find((r) => r.key === role)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (authError) {
          setError(
            authError.message === 'Invalid login credentials'
              ? 'Incorrect email or password. Please try again.'
              : authError.message
          );
          return;
        }

        // Hard redirect — lets the server (middleware) re-evaluate auth state
        // with the freshly-set session cookie rather than relying on client routing.
        window.location.href = nextPath;
      } catch {
        setError('Something went wrong. Please try again.');
      }
    });
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
      },
    });
  };

  return (
    <div className="relative w-full">
      {/* Glass card */}
      <div
        className="relative rounded-3xl border border-white/8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, oklch(0.14 0.025 265 / 0.95) 0%, oklch(0.12 0.02 265 / 0.98) 100%)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.06)',
        }}
      >
        {/* Top accent line — morphs with role */}
        <div
          className={cn(
            'absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r transition-all duration-500',
            role === 'student' ? 'from-transparent via-sky-400 to-transparent' :
            role === 'faculty' ? 'from-transparent via-violet-400 to-transparent' :
            'from-transparent via-amber-400 to-transparent'
          )}
        />

        <div className="p-8 space-y-6">
          {/* Role selector */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3">Sign in as</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const Icon = r.icon;
                const isActive = role === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    id={`role-${r.key}`}
                    onClick={() => { setRole(r.key); setError(null); }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border text-xs font-semibold transition-all duration-300',
                      isActive
                        ? r.pill
                        : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/60 hover:bg-white/4'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome back
            </h2>
            <p className="text-sm text-white/45 mt-0.5">
              Access your{' '}
              <span className={cn(
                'font-semibold',
                role === 'student' ? 'text-sky-400' :
                role === 'faculty' ? 'text-violet-400' : 'text-amber-400'
              )}>
                {activeRole.label.toLowerCase()}
              </span>
              {' '}portal.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium animate-[fadeSlideIn_0.2s_ease_forwards]">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === 'student' ? 'student@kingsecc.in' :
                    role === 'faculty' ? 'faculty@kingsecc.in' : 'admin@kingsecc.in'
                  }
                  autoComplete="email"
                  disabled={isPending}
                  className="w-full pl-10 pr-4 h-11 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'oklch(0.10 0.015 265 / 0.8)',
                    border: '1px solid oklch(1 0 0 / 0.09)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = role === 'student' ? 'oklch(0.65 0.2 220 / 0.7)' :
                      role === 'faculty' ? 'oklch(0.65 0.26 285 / 0.7)' : 'oklch(0.75 0.16 85 / 0.7)';
                    e.currentTarget.style.boxShadow = role === 'student' ? '0 0 0 3px oklch(0.65 0.2 220 / 0.12)' :
                      role === 'faculty' ? '0 0 0 3px oklch(0.65 0.26 285 / 0.12)' : '0 0 0 3px oklch(0.75 0.16 85 / 0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'oklch(1 0 0 / 0.09)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-white/35 hover:text-white/60 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isPending}
                  className="w-full pl-10 pr-10 h-11 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'oklch(0.10 0.015 265 / 0.8)',
                    border: '1px solid oklch(1 0 0 / 0.09)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = role === 'student' ? 'oklch(0.65 0.2 220 / 0.7)' :
                      role === 'faculty' ? 'oklch(0.65 0.26 285 / 0.7)' : 'oklch(0.75 0.16 85 / 0.7)';
                    e.currentTarget.style.boxShadow = role === 'student' ? '0 0 0 3px oklch(0.65 0.2 220 / 0.12)' :
                      role === 'faculty' ? '0 0 0 3px oklch(0.65 0.26 285 / 0.12)' : '0 0 0 3px oklch(0.75 0.16 85 / 0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'oklch(1 0 0 / 0.09)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isPending}
              className={cn(
                'relative w-full h-12 rounded-2xl font-bold text-sm text-white transition-all duration-300 overflow-hidden group',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                activeRole.glow,
                'hover:-translate-y-0.5 active:translate-y-0'
              )}
              style={{
                background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
              }}
            >
              {/* Gradient bg applied via inline */}
              <span
                className={cn(
                  'absolute inset-0 bg-gradient-to-r transition-opacity duration-300',
                  activeRole.gradient,
                )}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in as {activeRole.label}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-white/25 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={isPending}
              className="flex items-center justify-center gap-2.5 h-11 rounded-2xl border text-sm font-semibold text-white/70 transition-all duration-200 hover:text-white hover:bg-white/6 hover:border-white/20 disabled:opacity-50"
              style={{ border: '1px solid oklch(1 0 0 / 0.09)', background: 'oklch(1 0 0 / 0.03)' }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={isPending}
              className="flex items-center justify-center gap-2.5 h-11 rounded-2xl border text-sm font-semibold text-white/70 transition-all duration-200 hover:text-white hover:bg-white/6 hover:border-white/20 disabled:opacity-50"
              style={{ border: '1px solid oklch(1 0 0 / 0.09)', background: 'oklch(1 0 0 / 0.03)' }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-white/35">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white/70 hover:text-white font-semibold transition-colors hover:underline underline-offset-4">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
