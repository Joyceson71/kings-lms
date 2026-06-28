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
import { Loader2 } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-2xl text-foreground shadow-2xl overflow-hidden ring-1 ring-white/10 relative transition-all duration-500">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          Create an account
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base">
          Join the Kings EC Platform today.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm font-medium text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
              {error}
            </div>
          )}
          <div className="space-y-2 group">
            <Label htmlFor="fullName" className="text-foreground/90 transition-colors group-focus-within:text-primary">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              {...register('fullName')}
              className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 transition-all"
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-foreground/90 transition-colors group-focus-within:text-primary">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@kingsecc.in"
              {...register('email')}
              className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 transition-all"
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2 group">
            <Label htmlFor="password" className="text-foreground/90 transition-colors group-focus-within:text-primary">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 transition-all"
            />
            {errors.password && (
              <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2 group">
            <Label htmlFor="confirmPassword" className="text-foreground/90 transition-colors group-focus-within:text-primary">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary h-12 transition-all"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg group"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create account'}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground hover:text-primary transition-colors font-medium hover:underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
