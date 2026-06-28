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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (_err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-2xl text-foreground shadow-2xl overflow-hidden ring-1 ring-white/10 relative transition-all duration-500">
      {/* Subtle top gradient line for depth */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
      
      <CardHeader className="space-y-2 pt-8 px-8">
        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          Welcome back
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base">
          Enter your credentials to access your portal.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8">
        <CardContent className="space-y-5 p-0 mt-4">
          {error && (
            <div className="p-4 text-sm font-medium text-red-400 bg-red-950/50 rounded-lg border border-red-900/50">
              {error}
            </div>
          )}
          
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-foreground/90 transition-colors group-focus-within:text-primary">
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="student@kingsecc.in"
                autoComplete="email"
                {...register('email')}
                className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2 group">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground/90 transition-colors group-focus-within:text-primary">
                Password
              </Label>
              <Link href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-4">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 transition-all"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-6 p-0 mt-8">
          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg group"
            disabled={isLoading || !isValid}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center justify-center">
                Sign in
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </span>
            )}
          </Button>
          
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-foreground hover:text-primary transition-colors font-medium hover:underline underline-offset-4">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
