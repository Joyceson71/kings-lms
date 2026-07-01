'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiltCard } from '@/components/ui/tilt-card';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock, User, ArrowRight } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Excellent', color: 'bg-emerald-400' };
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [watchedPassword, setWatchedPassword] = useState('');
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  const passwordStrength = getPasswordStrength(watchedPassword);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TiltCard intensity={6}>
      <div className="glass-card rounded-2xl overflow-hidden relative">
        {/* Top gradient line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

        {/* Inner glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.65 0.26 285 / 0.06) 0%, transparent 70%)' }}
        />

        <div className="p-8 relative z-10">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Create account
            </h2>
            <p className="text-muted-foreground text-sm">
              Join the Kings EC Platform today.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 text-sm font-medium text-red-400 bg-red-950/40 rounded-xl border border-red-900/50 animate-slide-in-up">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground/90">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  autoComplete="name"
                  {...register('fullName')}
                  className="pl-10 h-11 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/90">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="email"
                  type="email"
                  placeholder="student@kingsecc.in"
                  autoComplete="email"
                  {...register('email')}
                  className="pl-10 h-11 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/90">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  {...register('password', {
                    onChange: (e) => setWatchedPassword(e.target.value),
                  })}
                  className="pl-10 pr-10 h-11 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {watchedPassword && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength.score ? passwordStrength.color : 'bg-secondary'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength:{' '}
                    <span className={`font-semibold ${
                      passwordStrength.score <= 1 ? 'text-red-400' :
                      passwordStrength.score <= 2 ? 'text-amber-400' :
                      passwordStrength.score <= 3 ? 'text-yellow-400' :
                      'text-emerald-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/90">Confirm Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="pl-10 pr-10 h-11 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                id="signup-submit-btn"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account…</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Bottom line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </TiltCard>
  );
}
