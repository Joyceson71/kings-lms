'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GraduationCap, CheckCircle, Loader2 } from 'lucide-react';

export default function OnboardingClient({ user, profile, departments, courses }: any) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || user?.user_metadata?.full_name || '',
    department: profile?.department || '',
    rollNumber: profile?.roll_number || '',
    employeeId: profile?.employee_id || '',
    courses: [] as string[],
  });

  const role = profile?.role || 'student';

  const handleNext = () => {
    if (step === 1 && !formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setStep(s => s + 1);
  };

  const handleComplete = async () => {
    if (!formData.department) {
      toast.error('Department is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (id: string) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.includes(id) 
        ? prev.courses.filter(c => c !== id)
        : [...prev.courses, id]
    }));
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="glass-card p-8 rounded-2xl border border-white/10"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Welcome to Kings EC</h1>
              <p className="text-muted-foreground mt-2 text-center text-sm">Let's set up your profile to get started.</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter your full name" 
                />
              </div>
            </div>

            <Button className="w-full glow-violet" onClick={handleNext}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="glass-card p-8 rounded-2xl border border-white/10"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground capitalize">{role} Setup</h2>
              <p className="text-muted-foreground text-sm mt-1">Complete your academic details.</p>
            </div>

            <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md text-sm text-foreground focus:outline-none focus:border-primary appearance-none"
                >
                  <option value="" className="bg-background">Select a department...</option>
                  {departments.map((d: any) => (
                    <option key={d.code} value={d.code} className="bg-background">
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {role === 'student' && (
                <div className="space-y-2">
                  <Label>Roll Number</Label>
                  <input 
                    type="text" 
                    value={formData.rollNumber} 
                    onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. 2024ECE101" 
                  />
                </div>
              )}

              {role === 'faculty' && (
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <input 
                    type="text" 
                    value={formData.employeeId} 
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. FAC1042" 
                  />
                </div>
              )}

              {(role === 'student' || role === 'faculty') && (
                <div className="space-y-3 pt-2">
                  <Label>{role === 'student' ? 'Enroll in Courses' : 'Select Courses you Teach'}</Label>
                  <div className="space-y-2">
                    {courses.map((course: any) => (
                      <label key={course.id} className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                        <input 
                          type="checkbox"
                          checked={formData.courses.includes(course.id)}
                          onChange={() => toggleCourse(course.id)}
                          className="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary focus:ring-offset-background" 
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{course.code}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{course.title}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="w-1/3" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button className="w-2/3 glow-violet" onClick={handleComplete} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Setup'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3" 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 rounded-2xl border border-white/10 text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">You're All Set!</h2>
            <p className="text-muted-foreground text-sm mb-8">Your profile has been fully configured.</p>
            <Button className="w-full glow-violet" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
