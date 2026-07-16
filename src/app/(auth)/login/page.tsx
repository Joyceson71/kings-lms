'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ── Reusable focused-input style helper ── */
const inputBase =
  'w-full h-10 px-3 rounded-lg text-[13px] text-white placeholder:text-zinc-600 outline-none transition-all duration-200 disabled:opacity-50 ' +
  'bg-[#111113] border border-[#1f1f23] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'student' | 'faculty'>('student');
  const [isPending, startTransition] = useTransition();

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
              ? 'Incorrect email or password.'
              : authError.message,
          );
          return;
        }

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
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}` },
    });
  };

  return (
    <div>
      {/* Heading — stagger 0 */}
      <div className="mb-6 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <h1 className="text-[24px] font-bold tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Welcome back
        </h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          Sign in to continue to Kings EC Platform
        </p>
      </div>

      {/* Tabs - stagger 0.5 */}
      <div className="flex bg-[#111113] p-1 rounded-lg border border-[#1f1f23] mb-6 animate-slide-in-up opacity-0" style={{ animationDelay: '30ms', animationFillMode: 'forwards' }}>
        <button
          type="button"
          onClick={() => { setLoginType('student'); setError(null); }}
          className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 ${
            loginType === 'student' ? 'bg-[#1f1f23] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => { setLoginType('faculty'); setError(null); }}
          className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 ${
            loginType === 'faculty' ? 'bg-[#1f1f23] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Faculty / Admin
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-red-400 mb-5 animate-bounce-in"
          style={{ background: 'rgb(239 68 68 / 0.08)', border: '1px solid rgb(239 68 68 / 0.2)' }}
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* OAuth — stagger 1 */}
      {loginType === 'student' && (
        <div
          className="grid grid-cols-2 gap-2 mb-5 animate-slide-in-up opacity-0"
          style={{ animationDelay: '60ms', animationFillMode: 'forwards' }}
        >
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={isPending}
          className="flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium text-zinc-300 transition-all duration-200 hover:text-white hover:bg-[#1a1a1d] disabled:opacity-40 bg-[#111113] border border-[#1f1f23] hover:border-[#2a2a2e]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
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
          className="flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium text-zinc-300 transition-all duration-200 hover:text-white hover:bg-[#1a1a1d] disabled:opacity-40 bg-[#111113] border border-[#1f1f23] hover:border-[#2a2a2e]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 fill-white">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
          </svg>
          GitHub
        </button>
        </div>
      )}

      {/* Divider — stagger 2 */}
      {loginType === 'student' && (
        <div
          className="flex items-center gap-3 mb-5 animate-slide-in-up opacity-0"
          style={{ animationDelay: '120ms', animationFillMode: 'forwards' }}
        >
          <div className="flex-1 h-px" style={{ background: '#1a1a1d' }} />
          <span className="text-[11px] text-zinc-600 font-medium">or continue with email</span>
          <div className="flex-1 h-px" style={{ background: '#1a1a1d' }} />
        </div>
      )}

      {/* Form — stagger 3 */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 animate-slide-in-up opacity-0"
        style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}
      >
        {loginType === 'faculty' && (
          <div
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-[12px] text-indigo-400 mb-2"
            style={{ background: 'rgb(99 102 241 / 0.08)', border: '1px solid rgb(99 102 241 / 0.2)' }}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Faculty accounts are pre-created by the administration to prevent fraud. Please use your official credentials.</span>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-[12px] font-medium text-zinc-400 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@kingsecc.in"
            autoComplete="email"
            disabled={isPending}
            className={inputBase}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-[12px] font-medium text-zinc-400">
              Password
            </label>
            <Link href="/reset-password" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              disabled={isPending}
              className={`${inputBase} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              tabIndex={-1}
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
          className="w-full h-10 rounded-lg text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group mt-1 hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            boxShadow: isPending ? 'none' : '0 0 20px rgb(99 102 241 / 0.25)',
            border: '1px solid rgb(99 102 241 / 0.5)',
          }}
        >
          {isPending ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing in…</>
          ) : (
            <>Continue <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" /></>
          )}
        </button>
      </form>

      {/* Sign up — stagger 4 */}
      {loginType === 'student' && (
        <p
          className="mt-6 text-center text-[13px] text-zinc-600 animate-slide-in-up opacity-0"
          style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}
        >
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Sign up
          </Link>
        </p>
      )}
    </div>
  );
}
