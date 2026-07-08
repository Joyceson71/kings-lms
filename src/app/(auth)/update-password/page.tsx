'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiltCard } from '@/components/ui/tilt-card';
import { Loader2, Lock, CheckCircle, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const updateSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
  });

  const onSubmit = async (data: UpdateFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
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
              Password Updated
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
              Your password has been changed successfully. Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </TiltCard>
    );
  }

  return (
    <TiltCard intensity={4}>
      <div className="glass-card rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-[0_0_20px_oklch(0.65_0.26_285/0.4)]">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Update Password
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Enter a new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-background/50 border-border/60 focus-visible:border-primary focus-visible:ring-primary rounded-xl"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-background/50 border-border/60 focus-visible:border-primary focus-visible:ring-primary rounded-xl"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-base mt-2"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </div>
      </div>
    </TiltCard>
  );
}
