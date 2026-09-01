'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, FileText, Link as LinkIcon, Video, Plus, ChevronDown, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CourseDetailClient({ course, initialModules, isFaculty }: any) {
  const [modules, setModules] = useState<any[]>(initialModules);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    Object.fromEntries(initialModules.map((m: any) => [m.id, true]))
  );

  const [newModuleName, setNewModuleName] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  const toggleModule = (id: string) => {
    setExpandedModules(p => ({ ...p, [id]: !p[id] }));
  };

  const handleAddModule = async () => {
    if (!newModuleName.trim()) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('modules').insert({
        course_id: course.id,
        title: newModuleName,
        order_index: modules.length
      }).select().single();

      if (error) throw error;
      setModules([...modules, { ...data, resources: [] }]);
      setExpandedModules(p => ({ ...p, [data.id]: true }));
      setNewModuleName('');
      setIsAddingModule(false);
      toast.success('Module added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add module');
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4 text-rose-400" />;
      case 'video': return <Video className="w-4 h-4 text-purple-400" />;
      default: return <LinkIcon className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground brutalist-heading mb-2">
            {course.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {course.code} • Taught by {course.profiles?.full_name || 'Faculty'}
          </p>
          {course.description && (
            <p className="mt-4 text-sm text-foreground/80 max-w-2xl">{course.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 mt-8">
        {modules.map((mod: any) => (
          <div key={mod.id} className="glass-card rounded-xl border border-white/10 overflow-hidden">
            <button 
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors text-left"
              onClick={() => toggleModule(mod.id)}
            >
              <h3 className="font-bold text-foreground text-lg">{mod.title}</h3>
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", expandedModules[mod.id] && "rotate-180")} />
            </button>
            
            {expandedModules[mod.id] && (
              <div className="p-4 border-t border-white/5 bg-background/30 space-y-2">
                {mod.resources?.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No resources yet.</p>
                ) : (
                  mod.resources?.map((res: any) => (
                    <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-md shadow-sm">
                          {getResourceIcon(res.type)}
                        </div>
                        <div>
                          <a href={res.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                            {res.title}
                          </a>
                          {res.description && <p className="text-xs text-muted-foreground">{res.description}</p>}
                        </div>
                      </div>
                      {isFaculty && (
                        <button className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
                
                {isFaculty && (
                  <Button variant="outline" size="sm" className="w-full mt-2 border-dashed text-muted-foreground hover:text-foreground">
                    <Plus className="w-4 h-4 mr-2" /> Add Resource
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        {isFaculty && (
          <div className="mt-6">
            {isAddingModule ? (
              <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center gap-3">
                <Input 
                  value={newModuleName}
                  onChange={e => setNewModuleName(e.target.value)}
                  placeholder="Module Name (e.g. Unit 1: Introduction)"
                  className="bg-background"
                />
                <Button onClick={handleAddModule} className="glow-violet">Save</Button>
                <Button variant="ghost" onClick={() => setIsAddingModule(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full border-dashed py-8 text-muted-foreground" onClick={() => setIsAddingModule(true)}>
                <Plus className="w-5 h-5 mr-2" /> Add Module
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
