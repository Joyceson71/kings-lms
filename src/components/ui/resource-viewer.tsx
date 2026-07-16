'use client';

import { X, Maximize2, Download, FileText, Globe, PlaySquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export interface ResourceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'web' | 'archive' | 'image' | string;
}

export function ResourceViewer({ isOpen, onClose, title, url, type }: ResourceViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderContent = () => {
    if (type.toLowerCase() === 'video') {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <iframe 
            src={url} 
            className="w-full h-full aspect-video max-w-5xl"
            allowFullScreen
          />
        </div>
      );
    }
    
    if (type.toLowerCase() === 'pdf' || type.toLowerCase() === 'web' || type.toLowerCase() === 'link') {
      return (
        <div className="w-full h-full bg-white relative flex flex-col">
          <div className="w-full bg-secondary/50 border-b border-border/50 py-2 px-4 flex justify-between items-center text-xs text-muted-foreground z-10 shrink-0 shadow-sm">
            <span>If the document doesn't display correctly, you can view it directly.</span>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
            </a>
          </div>
          {/* We use an iframe. Note that some real websites block iframes, but this simulates the in-app viewer experience */}
          <iframe 
            src={url}
            className="flex-1 w-full border-0"
            title={title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      );
    }

    // Fallback for archives/images
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/20">
        <FileText className="h-20 w-20 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold text-foreground">Preview not available</h3>
        <p className="text-muted-foreground mt-2 text-sm">This file type cannot be previewed directly in the browser.</p>
        <Button className="mt-6 gap-2 bg-primary text-primary-foreground">
          <Download className="h-4 w-4" />
          Download File
        </Button>
      </div>
    );
  };

  const Icon = type.toLowerCase() === 'pdf' ? FileText : 
               type.toLowerCase() === 'video' ? PlaySquare : Globe;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Window */}
      <div 
        className={cn(
          "relative flex flex-col bg-background border border-border/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200",
          isFullscreen ? "w-screen h-screen rounded-none" : "w-[90vw] h-[85vh] rounded-2xl"
        )}
      >
        {/* Toolbar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-secondary/30 shrink-0 gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-secondary/50 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground text-sm truncate">{title}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-9 px-3 text-muted-foreground hover:text-foreground hidden sm:flex gap-2"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs">Open</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-9 px-3 text-muted-foreground hover:text-foreground hidden sm:flex gap-2"
              onClick={() => {
                const a = document.createElement('a');
                a.href = url;
                a.download = title;
                a.click();
              }}
            >
              <Download className="h-4 w-4" />
              <span className="text-xs">Download</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-hidden relative bg-black/5">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
