'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getURL } from '@/lib/utils';

const resetSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${getURL()}update-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-70" />
          <div className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight" >
              Check your email
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
              We've sent you a password reset link. Please check your inbox and spam folder.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="mt-4 w-full h-11 border-border/60 hover:bg-secondary rounded-xl"
            >
              Return to Login
            </Button>
          </div>
        </div>
      
    );
  }

  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-[0_0_20px_oklch(0.65_0.26_285/0.4)]">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight" >
              Reset Password
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Enter your email to receive a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@kingsecc.in"
                  className="pl-10 h-12 bg-background/50 border-border/60 focus-visible:border-primary focus-visible:ring-primary rounded-xl"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-base"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    
  );
}
