'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type AssignmentStatus = 'pending' | 'submitted' | 'graded';

interface Assignment {
  id: string;
  title: string;
  course: string;
  code: string;
  due: string;
  status: AssignmentStatus;
  grade?: string;
  description: string;
  icon: string;
}

interface SubmissionModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (assignmentId: string) => void;
}

export function SubmissionModal({ assignment, isOpen, onClose, onSuccess }: SubmissionModalProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!assignment) return null;

  const handleSubmit = async () => {
    if (!content && !file) {
      setError('Please provide a text response or attach a file.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If there's a file, we could upload it to storage. For this demo/improvement,
      const { error: dbError } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignment.id,
          student_id: user.id,
          content: content,
          status: 'submitted'
        });

      if (dbError) throw dbError;

      onSuccess(assignment.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = assignment.status === 'pending';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-[#111113] border-[#1f1f23] text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{assignment.icon}</span>
            <DialogTitle className="text-xl font-bold">{assignment.title}</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            {assignment.course} ({assignment.code}) • Due: {assignment.due}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 text-[13px] leading-relaxed text-zinc-300">
            {assignment.description || 'No description provided.'}
          </div>

          {!isPending ? (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-[13px] font-semibold text-emerald-400">Assignment Submitted</p>
                {assignment.status === 'graded' && (
                  <p className="text-[12px] mt-1 text-emerald-400/80">Grade: {assignment.grade}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="content">Your Submission</Label>
                <Textarea
                  id="content"
                  placeholder="Type your answer or paste a link here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] bg-background/50 border-border/60 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Attachment (Optional)</Label>
                <Label 
                  htmlFor="file-upload"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl transition-all cursor-pointer group",
                    file ? "border-primary bg-primary/10" : "border-border/60 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50"
                  )}
                >
                  {file ? (
                    <div className="text-primary text-[13px] font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {file.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500 group-hover:text-zinc-400 transition-colors">
                      <Upload className="h-5 w-5 mb-1.5" />
                      <span className="text-[12px] font-medium">Click to upload or drag and drop</span>
                    </div>
                  )}
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </Label>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 px-8 rounded-xl"
                >
                  {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Assignment'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
