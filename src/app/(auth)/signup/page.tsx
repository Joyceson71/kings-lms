'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiltCard } from '@/components/ui/tilt-card';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock, User, ArrowRight, CheckCircle, Building2, Hash, BookOpen, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getURL } from '@/lib/utils';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
  department: z.string().min(1, { message: 'Please select a department' }),
  year: z.string().min(1, { message: 'Please select a year' }),
  college: z.string().min(2, { message: 'College name is required' }),
  rollNumber: z.string().min(2, { message: 'Roll number is required' }),
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
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    // Check if we already have a session parsed from the URL or local storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        router.replace('/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

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
      // Prevent registering with reserved admin email
      if (data.email.trim().toLowerCase() === 'joycesondanielraj28@gmail.com') {
        setError('This email address is reserved. Please use a different email.');
        setIsLoading(false);
        return;
      }

      // Simulate brief network delay for UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Save new user to localStorage (demo registration)
      const stored = localStorage.getItem('kings_lms_registered_users');
      const users: Array<any> = stored ? JSON.parse(stored) : [];

      const existing = users.find((u: any) => u.email.toLowerCase() === data.email.trim().toLowerCase());
      if (existing) {
        setError('An account with this email already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      users.push({ 
        email: data.email.trim().toLowerCase(), 
        password: data.password, 
        fullName: data.fullName,
        department: data.department,
        year: data.year,
        college: data.college,
        rollNumber: data.rollNumber
      });
      localStorage.setItem('kings_lms_registered_users', JSON.stringify(users));

      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getURL(),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
      setIsLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: getURL(),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with GitHub');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <TiltCard intensity={6}>
        <div className="glass-card rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-70" />
          <div className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Account Created!
            </h2>
            <p className="text-muted-foreground text-sm">
              Your account has been registered. Redirecting you to the login page…
            </p>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 animate-[shimmer_2s_linear_forwards] w-0" style={{ animation: 'grow 2s linear forwards' }} />
            </div>
          </div>
        </div>
      </TiltCard>
    );
  }

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Roll Number */}
              <div className="space-y-1.5">
                <Label htmlFor="rollNumber" className="text-sm font-medium text-foreground/90">Roll Number</Label>
                <div className="relative group">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                  <Input
                    id="rollNumber"
                    placeholder="e.g. 21CS01"
                    {...register('rollNumber')}
                    className="pl-10 h-11 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                  />
                </div>
                {errors.rollNumber && (
                  <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.rollNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-sm font-medium text-foreground/90">Department</Label>
                <div className="relative group">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                  <select
                    id="department"
                    {...register('department')}
                    className="w-full pl-10 pr-4 h-11 bg-background/40 border-border/60 text-foreground text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl outline-none appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled className="text-muted-foreground bg-background">Select Department</option>
                    <option value="ECE" className="bg-background text-foreground">ECE</option>
                    <option value="CSE" className="bg-background text-foreground">CSE</option>
                    <option value="IT" className="bg-background text-foreground">IT</option>
                    <option value="AIDS" className="bg-background text-foreground">AIDS</option>
                    <option value="AIML" className="bg-background text-foreground">AIML</option>
                    <option value="RAA" className="bg-background text-foreground">RAA</option>
                    <option value="MECH" className="bg-background text-foreground">MECH</option>
                    <option value="BME" className="bg-background text-foreground">BME</option>
                  </select>
                </div>
                {errors.department && (
                  <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.department.message}
                  </p>
                )}
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <Label htmlFor="year" className="text-sm font-medium text-foreground/90">Year of Study</Label>
                <div className="relative group">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                  <select
                    id="year"
                    {...register('year')}
                    className="w-full pl-10 pr-4 h-11 bg-background/40 border-border/60 text-foreground text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl outline-none appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled className="text-muted-foreground bg-background">Select Year</option>
                    <option value="1" className="bg-background text-foreground">1st Year</option>
                    <option value="2" className="bg-background text-foreground">2nd Year</option>
                    <option value="3" className="bg-background text-foreground">3rd Year</option>
                    <option value="4" className="bg-background text-foreground">4th Year</option>
                  </select>
                </div>
                {errors.year && (
                  <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.year.message}
                  </p>
                )}
              </div>
            </div>

            {/* College */}
            <div className="space-y-1.5">
              <Label htmlFor="college" className="text-sm font-medium text-foreground/90">College</Label>
              <div className="relative group">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="college"
                  defaultValue="Kings Engineering College"
                  {...register('college')}
                  className="pl-10 h-11 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                />
              </div>
              {errors.college && (
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.college.message}
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

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-muted-foreground" style={{ background: 'oklch(0.11 0.02 265)' }}>OR</span>
            </div>
          </div>

          {/* OAuth Providers */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full h-11 rounded-xl border-border/60 hover:bg-secondary/40 font-semibold gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleGithubSignup}
              disabled={isLoading}
              className="w-full h-11 rounded-xl border-border/60 hover:bg-secondary/40 font-semibold gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-foreground" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </Button>
          </div>

          {/* Sign in link */}
          <p className="text-sm text-center text-muted-foreground">
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
