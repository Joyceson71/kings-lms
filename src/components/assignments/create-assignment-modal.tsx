'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, AlertCircle, BookOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAssignmentModal({ isOpen, onClose, onSuccess }: CreateAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title || !courseId || !dueDate) {
      setError('Please fill in all required fields (Title, Course ID, Due Date).');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: dbError } = await supabase
        .from('assignments')
        .insert({
          title,
          description,
          course_id: courseId,
          due_date: new Date(dueDate).toISOString(),
          created_by: user.id,
        });

      if (dbError) throw dbError;

      onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setCourseId('');
      setDescription('');
      setDueDate('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-[#111113] border-[#1f1f23] text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-indigo-400" />
            </div>
            <DialogTitle className="text-xl font-bold">New Assignment</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Create a new assignment for your students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Lab Report 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background/50 border-border/60 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseId">Course ID *</Label>
              <div className="relative group">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="courseId"
                  placeholder="UUID from courses table"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="pl-10 bg-background/50 border-border/60 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-background/50 border-border/60 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description & Instructions</Label>
            <Textarea
              id="description"
              placeholder="Provide clear instructions for the students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] bg-background/50 border-border/60 rounded-xl"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-semibold h-10 px-8 rounded-xl"
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : 'Create Assignment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
