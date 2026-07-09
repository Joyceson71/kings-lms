'use client';

import { useState} from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Building2, Hash, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const onboardingSchema = z.object({
  department: z.string().min(1, { message: 'Please select a department' }),
  year: z.string().min(1, { message: 'Please select a year' }),
  college: z.string().min(2, { message: 'College name is required' }),
  rollNumber: z.string().min(2, { message: 'Roll number is required' }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          department: data.department,
          year_of_study: parseInt(data.year, 10),
          college: data.college,
          roll_number: data.rollNumber,
          full_name: user.user_metadata?.full_name || 'Student',
          avatar_url: user.user_metadata?.avatar_url,
          role: 'student',
        });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
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
              Profile Complete!
            </h2>
            <p className="text-muted-foreground text-sm">
              Your details have been saved. Redirecting you to the dashboard…
            </p>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 animate-[shimmer_2s_linear_forwards] w-0" style={{ animation: 'grow 2s linear forwards' }} />
            </div>
          </div>
        </div>
      
    );
  }

  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.65 0.26 285 / 0.06) 0%, transparent 70%)' }}
        />

        <div className="p-8 relative z-10">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight mb-1.5" >
              Complete Your Profile
            </h2>
            <p className="text-muted-foreground text-sm">
              We need a few more details before you can access the platform.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 text-sm font-medium text-red-400 bg-red-950/40 rounded-xl border border-red-900/50 animate-slide-in-up">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl mt-2 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Save Profile'
              )}
            </Button>
          </form>
        </div>
      </div>
    
  );
}
