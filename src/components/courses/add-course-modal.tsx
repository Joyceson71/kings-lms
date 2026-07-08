'use client';

import { useState } from 'react';
import { X, Book, Type, AlignLeft, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

const addCourseSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
});

type AddCourseFormValues = z.infer<typeof addCourseSchema>;

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseAdded: (course: Record<string, unknown>) => void;
}

export function AddCourseModal({ isOpen, onClose, onCourseAdded }: AddCourseModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCourseFormValues>({
    resolver: zodResolver(addCourseSchema),
  });

  if (!isOpen) return null;

  const onSubmit = async (data: AddCourseFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'faculty' && profile?.role !== 'admin') {
        throw new Error('Only faculty members can create courses.');
      }

      // Insert into Supabase
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert({
          title: data.title,
          description: data.description,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onCourseAdded(newCourse);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full max-w-md bg-background border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="relative p-6 sm:p-8 border-b border-border/40">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Book className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Create Course</h2>
              <p className="text-sm text-muted-foreground">Add a new course to the catalog</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-3.5 text-sm font-medium text-red-400 bg-red-950/40 rounded-xl border border-red-900/50">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">Course Title</Label>
              <div className="relative group">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="title"
                  placeholder="e.g. Data Structures and Algorithms"
                  {...register('title')}
                  className="pl-10 h-11 bg-background/40 border-border/60 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                />
              </div>
              {errors.title && (
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <div className="relative group">
                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <textarea
                  id="description"
                  placeholder="Brief overview of the course content..."
                  {...register('description')}
                  className="w-full pl-10 pr-4 py-3 min-h-[100px] bg-background/40 border border-border/60 text-foreground text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl resize-none"
                />
              </div>
              {errors.description && (
                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="rounded-xl h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Course
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
