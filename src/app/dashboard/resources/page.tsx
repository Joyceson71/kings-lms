'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResourceViewer } from '@/components/ui/resource-viewer';
import { Input } from '@/components/ui/input';
import { 
  FileText, Download, Upload, Search, Filter, 
  ExternalLink, File, FileArchive, FileImage, 
  PlaySquare, MoreVertical, Loader2, Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { UploadModal } from '@/components/resources/upload-modal';

// Helper for icons based on resource type
const getIconForType = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'pdf': return FileText;
    case 'video': return PlaySquare;
    case 'archive': return FileArchive;
    case 'image': return FileImage;
    case 'link': return ExternalLink;
    default: return File;
  }
};

const getBadgeForType = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'pdf': return 'destructive'; 
    case 'video': return 'warning'; 
    case 'archive': return 'secondary'; 
    case 'link': return 'active'; 
    default: return 'default';
  }
};

export default function ResourcesPage() {
  const { isStudent, profile, loading: userLoading } = useUser();
  const supabase = createClient();
  
  const [resources, setResources] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [filters, setFilters] = useState<string[]>(['All']);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTypeFilter, setActiveTypeFilter] = useState('All');
  
  const [viewerUrl, setViewerUrl] = useState<{url: string, title: string, type: string} | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch materials (RLS ensures users only see what they are allowed to)
    const { data: materialsData, error: materialsError } = await supabase
      .from('course_materials')
      .select('*, courses(title, code), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (!materialsError && materialsData) {
      setResources(materialsData);
      
      // Extract unique course codes for filters
      const uniqueCourses = Array.from(new Set(materialsData.map((r: any) => r.courses?.code))).filter(Boolean);
      setFilters(['All', ...(uniqueCourses as string[])]);
    }

    // Fetch courses for the faculty upload modal
    if (!isStudent && profile?.id) {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, code')
        .eq('created_by', profile.id);
        
      if (coursesData) {
        setMyCourses(coursesData);
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (!userLoading) {
      fetchData();
     
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, isStudent, profile?.id]);

  // Filter logic
  const filteredResources = resources.filter(resource => {
    const courseCode = resource.courses?.code || '';
    const title = resource.title || '';
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || courseCode === activeFilter;
    const matchesType = activeTypeFilter === 'All' || (resource.type && resource.type.toLowerCase() === activeTypeFilter.toLowerCase());
    
    return matchesSearch && matchesFilter && matchesType;
  });

  const handleDelete = async (resourceId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;
    
    try {
      if (filePath && filePath.includes('/storage/v1/object/public/course_materials/')) {
        const pathParts = filePath.split('/course_materials/');
        if (pathParts.length > 1) {
          const storagePath = pathParts[1];
          await supabase.storage.from('course_materials').remove([storagePath]);
        }
      }

      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
      
      setResources(prev => prev.filter(r => r.id !== resourceId));
    } catch (err) {
      console.error('Failed to delete resource:', err);
      alert('Failed to delete resource.');
    }
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" >
            <span className="gradient-text">Study Materials</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse and download course notes, lecture slides, and reference materials.
          </p>
        </div>
        
        {/* Upload Button (hidden for students) */}
        {!isStudent && !userLoading && (
          <Button 
            onClick={() => setIsUploadOpen(true)}
            id="upload-resource-btn"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_oklch(0.65_0.26_285/0.3)] gap-2 rounded-xl h-10 w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            <span className="font-semibold">Upload Resource</span>
          </Button>
        )}
      </div>

      {/* Toolbar: Search and Filter */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between animate-slide-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
          <Input 
            placeholder="Search resources by title or course code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-secondary/50 border-border/40 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 rounded-xl w-full"
          />
        </div>

        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar snap-x">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-1" />
            <span className="text-xs text-muted-foreground/70 font-semibold mr-1">Course:</span>
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 whitespace-nowrap snap-start',
                  activeFilter === filter
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar snap-x">
            <Filter className="h-4 w-4 text-transparent flex-shrink-0 mr-1" />
            <span className="text-xs text-muted-foreground/70 font-semibold mr-1">Type:</span>
            {['All', 'PDF', 'Video', 'Archive', 'Link'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTypeFilter(type)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 whitespace-nowrap snap-start',
                  activeTypeFilter === type
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredResources.length > 0 ? (
        /* Resources Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredResources.map((resource, i) => {
            const Icon = getIconForType(resource.type);
            const badgeVariant = getBadgeForType(resource.type) as any;
            
            return (
              <div 
                key={resource.id} 
                className="animate-slide-in-up opacity-0"
                style={{ animationDelay: `${200 + (Math.min(i, 10) * 60)}ms`, animationFillMode: 'forwards' }}
              >
                <div className="bg-[#111113] border border-[#1f1f23] rounded-2xl p-5 h-full flex flex-col group border border-border/40 hover:border-primary/30 transition-colors">
                    
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-5 w-5 text-foreground/70" />
                        </div>
                        <div>
                          <Badge variant="secondary" className="mb-1 text-[10px] uppercase font-bold tracking-wider">
                            {resource.courses?.code}
                          </Badge>
                          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2" title={resource.title}>
                            {resource.title}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Context Menu (Hidden for students) */}
                      {!isStudent && (profile?.id === resource.uploaded_by || profile?.role === 'admin') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground p-1.5 transition-colors rounded-lg hover:bg-secondary cursor-pointer border-none outline-none">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/50 shadow-xl bg-background/95 backdrop-blur-md p-1">
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
                              onClick={() => handleDelete(resource.id, resource.file_path)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="mt-auto pt-4 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={badgeVariant} className="text-[9px] px-1.5 py-0">
                          {resource.type}
                        </Badge>
                        {(resource.tags || []).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 border-border/50 text-muted-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground/80">{resource.profiles?.full_name || 'Unknown'}</span>
                          <span className="text-[10px]">
                            {new Date(resource.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        
                        {/* Download / Action button */}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors group/btn"
                          onClick={() => {
                            if (resource.type === 'Link') {
                                window.open(resource.file_path, '_blank');
                            } else {
                                setViewerUrl({
                                  url: resource.file_path,
                                  title: resource.title,
                                  type: 'pdf' // The resource viewer currently works best with PDF/images in iframe
                                });
                            }
                          }}
                        >
                          <span className="mr-1.5 font-medium">{resource.size}</span>
                          {resource.type === 'Link' ? (
                            <ExternalLink className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          ) : (
                            <Download className="h-3.5 w-3.5 group-hover/btn:translate-y-0.5 transition-transform" />
                          )}
                        </Button>
                      </div>
                    </div>

                  </div>
                
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No resources found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {searchQuery || activeFilter !== 'All' 
              ? "We couldn't find any materials matching your search criteria. Try clearing your filters."
              : "No study materials have been uploaded yet."}
          </p>
          {(searchQuery || activeFilter !== 'All') && (
            <Button 
              variant="outline" 
              className="mt-6 border-border/40 rounded-xl"
              onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Resource Viewer Modal */}
      {viewerUrl && (
        <ResourceViewer
          isOpen={!!viewerUrl}
          onClose={() => setViewerUrl(null)}
          title={viewerUrl.title}
          url={viewerUrl.url}
          type={viewerUrl.type}
        />
      )}

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courses={myCourses}
        onSuccess={fetchData}
      />
    </div>
  );
}
