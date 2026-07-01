'use client';

import { useState } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResourceViewer } from '@/components/ui/resource-viewer';
import { Input } from '@/components/ui/input';
import { 
  FileText, Download, Upload, Search, Filter, 
  ExternalLink, File, FileArchive, FileImage, 
  PlaySquare, MoreVertical, Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper for icons based on resource type
const getIconForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf': return FileText;
    case 'video': return PlaySquare;
    case 'archive': return FileArchive;
    case 'image': return FileImage;
    case 'link': return ExternalLink;
    default: return File;
  }
};

const getBadgeForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf': return 'destructive'; // Red-ish for PDF
    case 'video': return 'warning'; // Amber for Video
    case 'archive': return 'secondary'; // Gray for Archive
    case 'link': return 'active'; // Blue for Link
    default: return 'default';
  }
};

// Dummy Data with ECE subjects
const MOCK_RESOURCES = [
  { id: 1, title: 'Signals & Systems - Lecture 1', course: 'EC-301', type: 'PDF', size: '2.4 MB', uploadedBy: 'Prof. Joyceson D.', date: 'Aug 14, 2026', tags: ['Lecture', 'Unit 1'] },
  { id: 2, title: 'Digital Signal Processing Formula Sheet', course: 'EC-302', type: 'PDF', size: '1.1 MB', uploadedBy: 'Dr. A. Smith', date: 'Aug 18, 2026', tags: ['Reference', 'Cheat Sheet'] },
  { id: 3, title: 'Analog Circuits Lab Manual', course: 'EC-303', type: 'Archive', size: '15.8 MB', uploadedBy: 'Prof. M. Raj', date: 'Jul 22, 2026', tags: ['Lab', 'Manual'] },
  { id: 4, title: 'Microprocessors Architecture Deep Dive', course: 'EC-304', type: 'Video', size: '142 MB', uploadedBy: 'Dr. Kumar', date: 'Aug 05, 2026', tags: ['Lecture Recording'] },
  { id: 5, title: 'Communication Systems Assignment 1 Guidelines', course: 'EC-305', type: 'PDF', size: '0.8 MB', uploadedBy: 'Dr. Smith', date: 'Aug 20, 2026', tags: ['Assignment'] },
  { id: 6, title: 'Network Analysis Theorems Visualized', course: 'EC-101', type: 'Link', size: '--', uploadedBy: 'Prof. M. Raj', date: 'Sep 01, 2026', tags: ['Interactive', 'Reference'] },
  { id: 7, title: 'Electromagnetic Fields - Maxwell Equations', course: 'EC-201', type: 'PDF', size: '4.5 MB', uploadedBy: 'Dr. Kumar', date: 'Aug 10, 2026', tags: ['Notes', 'Unit 3'] },
];

const filters = ['All', 'EC-301', 'EC-302', 'EC-303', 'EC-304', 'EC-305', 'EC-101', 'EC-201'];

export default function ResourcesPage() {
  const { isStudent } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewerUrl, setViewerUrl] = useState<{url: string, title: string, type: string} | null>(null);

  // Filter logic
  const filteredResources = MOCK_RESOURCES.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          resource.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || resource.course === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Study Materials</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse and download course notes, lecture slides, and reference materials.
          </p>
        </div>
        
        {/* Upload Button (hidden for students) */}
        {!isStudent && (
          <Button 
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

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto hide-scrollbar snap-x">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-1" />
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
      </div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredResources.map((resource, i) => {
            const Icon = getIconForType(resource.type);
            const badgeVariant = getBadgeForType(resource.type) as any;
            
            return (
              <div 
                key={resource.id} 
                className="animate-slide-in-up opacity-0"
                style={{ animationDelay: `${200 + (i * 60)}ms`, animationFillMode: 'forwards' }}
              >
                <TiltCard intensity={2} glareEffect={false}>
                  <div className="glass-card rounded-2xl p-5 h-full flex flex-col group border border-border/40 hover:border-primary/30 transition-colors">
                    
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-5 w-5 text-foreground/70" />
                        </div>
                        <div>
                          <Badge variant="secondary" className="mb-1 text-[10px] uppercase font-bold tracking-wider">
                            {resource.course}
                          </Badge>
                          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2" title={resource.title}>
                            {resource.title}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Context Menu (Hidden for students) */}
                      {!isStudent && (
                        <button className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-lg hover:bg-secondary">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="mt-auto pt-4 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={badgeVariant} className="text-[9px] px-1.5 py-0">
                          {resource.type}
                        </Badge>
                        {resource.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 border-border/50 text-muted-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground/80">{resource.uploadedBy}</span>
                          <span className="text-[10px]">{resource.date}</span>
                        </div>
                        
                        {/* Download / Action button */}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors group/btn"
                          onClick={() => setViewerUrl({
                            url: 'https://kings-lms.demo/resource/' + resource.id, // Dummy URL for demo
                            title: resource.title,
                            type: resource.type.toLowerCase() === 'link' ? 'web' : resource.type
                          })}
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
                </TiltCard>
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
            We couldn&apos;t find any materials matching your search criteria. Try clearing your filters.
          </p>
          <Button 
            variant="outline" 
            className="mt-6 border-border/40 rounded-xl"
            onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
          >
            Clear Filters
          </Button>
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
    </div>
  );
}
