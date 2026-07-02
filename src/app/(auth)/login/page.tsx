'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiltCard } from '@/components/ui/tilt-card';
import {
  Loader2, ArrowRight, Eye, EyeOff, AlertCircle,
  Mail, Lock, GraduationCap, Users, ShieldCheck, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type Role = 'student' | 'faculty' | 'admin';

const roles: { key: Role; label: string; icon: React.ElementType; color: string; activeClass: string }[] = [
  {
    key: 'student',
    label: 'Student',
    icon: GraduationCap,
    color: 'text-sky-400',
    activeClass: 'border-sky-500/60 bg-sky-500/10 text-sky-300',
  },
  {
    key: 'faculty',
    label: 'Faculty',
    icon: Users,
    color: 'text-violet-400',
    activeClass: 'border-violet-500/60 bg-violet-500/10 text-violet-300',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    color: 'text-amber-400',
    activeClass: 'border-amber-500/60 bg-amber-500/10 text-amber-300',
  },
];

const demoCredentials: Record<Role, { email: string; password: string; note: string }> = {
  student: { email: 'student@kingsecc.in', password: 'student123', note: 'Student demo account' },
  faculty: { email: 'faculty@kingsecc.in', password: 'faculty123', note: 'Faculty demo account' },
  admin: { email: 'joycesondanielraj28@gmail.com', password: 'admin@712521', note: 'Administrator account' },
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [showDemo, setShowDemo] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const fillDemo = () => {
    const creds = demoCredentials[selectedRole];
    setValue('email', creds.email);
    setValue('password', creds.password);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, error: authError } = signIn(data.email, data.password);

      if (authError || !user) {
        setError(authError ?? 'Invalid email or password. Please check your credentials and try again.');
        return;
      }

      // Redirect based on role
      if (user.role === 'admin') {
        router.replace('/dashboard/admin');
      } else {
        router.replace('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeRole = roles.find((r) => r.key === selectedRole)!;

  return (
    <TiltCard intensity={8}>
      <div className="glass-card rounded-2xl overflow-hidden relative">
        {/* Top gradient line — colour changes by role */}
        <div
          className={cn(
            'absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-80 transition-all duration-500',
            selectedRole === 'student' ? 'via-sky-400' :
            selectedRole === 'faculty' ? 'via-primary' :
            'via-amber-400'
          )}
        />

        {/* Inner glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
          style={{
            background: selectedRole === 'student'
              ? 'radial-gradient(ellipse at 50% 0%, oklch(0.65 0.2 220 / 0.06) 0%, transparent 70%)'
              : selectedRole === 'admin'
              ? 'radial-gradient(ellipse at 50% 0%, oklch(0.75 0.16 85 / 0.06) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 0%, oklch(0.65 0.26 285 / 0.08) 0%, transparent 70%)',
          }}
        />

        <div className="p-8 relative z-10">
          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              I am a…
            </p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.key;
                return (
                  <button
                    key={role.key}
                    type="button"
                    id={`role-${role.key}`}
                    onClick={() => { setSelectedRole(role.key); setError(null); }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all duration-200',
                      isSelected
                        ? role.activeClass
                        : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground bg-transparent'
                    )}
                    aria-pressed={isSelected}
                  >
                    <Icon className={cn('h-4 w-4', isSelected ? '' : 'text-muted-foreground/60')} />
                    {role.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-2xl font-black tracking-tight mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in as <span className={cn('font-semibold', activeRole.color)}>{activeRole.label}</span> to access your portal.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 text-sm font-medium text-red-400 bg-red-950/40 rounded-xl border border-red-900/50 animate-slide-in-up">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/90">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    selectedRole === 'student' ? 'student@kingsecc.in' :
                    selectedRole === 'faculty' ? 'faculty@kingsecc.in' :
                    'joycesondanielraj28@gmail.com'
                  }
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/90">Password</Label>
                <Link href="#" className="text-xs text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-4 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
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
              {errors.password && (
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              id="login-submit-btn"
              className={cn(
                'w-full h-11 text-white font-semibold transition-all duration-200 rounded-xl hover:-translate-y-0.5 group',
                selectedRole === 'student'
                  ? 'bg-sky-600 hover:bg-sky-500 hover:shadow-[0_8px_24px_oklch(0.65_0.2_220/0.4)]'
                  : selectedRole === 'admin'
                  ? 'bg-amber-600 hover:bg-amber-500 hover:shadow-[0_8px_24px_oklch(0.75_0.16_85/0.4)]'
                  : 'bg-primary hover:bg-primary/90 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)]'
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in…</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in as {activeRole.label}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', showDemo ? 'rotate-180' : '')} />
              {showDemo ? 'Hide' : 'Show'} demo credentials
            </button>
            {showDemo && (
              <div className="mt-3 p-3 rounded-xl border border-border/40 bg-secondary/20 animate-slide-in-up">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {demoCredentials[selectedRole].note}
                </p>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{demoCredentials[selectedRole].email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="text-foreground">{demoCredentials[selectedRole].password}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="mt-2 text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  → Auto-fill credentials
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-muted-foreground" style={{ background: 'oklch(0.11 0.02 265)' }}>OR</span>
            </div>
          </div>

          {/* Sign up */}
          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline underline-offset-4">
              Create account
            </Link>
          </p>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </TiltCard>
  );
}
