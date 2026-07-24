'use client';

import { useState } from 'react';
import { X, UploadCloud, Link as LinkIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import confetti from 'canvas-confetti';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: { id: string, title: string, code: string }[];
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, courses, onSuccess }: UploadModalProps) {
  const { profile } = useUser();
  const supabase = createClient();
  
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [type, setType] = useState('PDF');
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.split('.')[0]);
      }
      
      const fileType = droppedFile.type;
      if (fileType.includes('pdf')) setType('PDF');
      else if (fileType.includes('video')) setType('Video');
      else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) setType('Archive');
      else if (fileType.includes('image')) setType('Image');
      else setType('File');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Auto-set title if empty
      if (!title) {
        setTitle(e.target.files[0].name.split('.')[0]);
      }
      
      // Auto-detect type
      const fileType = e.target.files[0].type;
      if (fileType.includes('pdf')) setType('PDF');
      else if (fileType.includes('video')) setType('Video');
      else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) setType('Archive');
      else if (fileType.includes('image')) setType('Image');
      else setType('File');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title || !courseId) {
      setError('Title and Course are required.');
      return;
    }

    if (type !== 'Link' && !file) {
      setError('Please select a file to upload.');
      return;
    }

    if (type === 'Link' && !linkUrl) {
      setError('Please provide a valid URL.');
      return;
    }

    setIsUploading(true);

    try {
      let filePath = linkUrl;
      let size = '--';

      if (type !== 'Link' && file) {
        // Format size
        const bytes = file.size;
        if (bytes < 1024 * 1024) size = (bytes / 1024).toFixed(1) + ' KB';
        else size = (bytes / (1024 * 1024)).toFixed(1) + ' MB';

        // Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const storagePath = `${courseId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course_materials')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('course_materials')
          .getPublicUrl(storagePath);
          
        filePath = publicUrl;
      }

      // Insert record
      const { error: dbError } = await supabase
        .from('course_materials')
        .insert({
          title,
          course_id: courseId,
          type,
          file_path: filePath,
          size,
          uploaded_by: profile?.id
        });

      if (dbError) throw dbError;

      // Premium UI: Fire confetti on successful upload!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#38bdf8', '#3ecf8e']
      });

      onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setFile(null);
      setLinkUrl('');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => !isUploading && onClose()}
      />
      
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 flex items-center justify-center animate-in zoom-in-95 duration-300 w-full max-w-md">
        <div className="bg-background/95 border border-border/50 rounded-3xl shadow-[0_20px_60px_-15px_oklch(0.65_0.26_285/0.2)] overflow-hidden w-full">
          
          <div className="p-6 border-b border-border/40 relative">
            <h2 className="text-xl font-bold font-outfit">Upload Study Material</h2>
            <button 
              onClick={onClose}
              disabled={isUploading}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Resource Type</Label>
              <div className="flex gap-2">
                {['PDF', 'Video', 'Archive', 'Link'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                      type === t 
                        ? "bg-primary/15 border-primary/30 text-primary" 
                        : "border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="course">Course</Label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border/40 bg-secondary/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                required
              >
                {courses.length === 0 && <option value="" disabled>No courses available</option>}
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>

            {type === 'Link' ? (
              <div className="space-y-1.5">
                <Label htmlFor="url">URL Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="url" 
                    type="url" 
                    placeholder="https://..." 
                    className="pl-9"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="file">File</Label>
                <div className="relative">
                  <input
                    type="file"
                    id="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Label 
                    htmlFor="file"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all cursor-pointer group",
                      isDragging 
                        ? "border-primary bg-primary/10 scale-[1.02]" 
                        : "border-border/60 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div className="flex flex-col items-center text-primary">
                        <CheckCircle2 className="h-8 w-8 mb-2 opacity-80" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs opacity-70 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                        <UploadCloud className="h-8 w-8 mb-2 opacity-50 group-hover:opacity-100" />
                        <span className="text-sm font-medium">Click to browse files</span>
                      </div>
                    )}
                  </Label>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Lecture 1 Notes" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 mt-4 font-semibold text-primary-foreground shadow-[0_8px_24px_oklch(0.65_0.26_285/0.3)]"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Resource'
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
