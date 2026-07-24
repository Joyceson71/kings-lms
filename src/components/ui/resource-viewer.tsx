'use client';

import { X, Maximize2, Download, FileText, Globe, PlaySquare, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export interface ResourceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'web' | 'archive' | 'image' | (string & {});
}

export function ResourceViewer({ isOpen, onClose, title, url, type }: ResourceViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedType = type.toLowerCase();

  // Security: Sanitize URL to prevent XSS via javascript: or vbscript: URIs
  const safeUrl = (() => {
    const trimmedUrl = url?.trim() || '';
    const lowerUrl = trimmedUrl.toLowerCase();
    if (
      lowerUrl.startsWith('javascript:') || 
      lowerUrl.startsWith('vbscript:') || 
      lowerUrl.startsWith('data:text/html')
    ) {
      return 'about:blank';
    }
    return trimmedUrl;
  })();

  const renderContent = () => {
    if (normalizedType === 'video') {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <iframe 
            src={safeUrl} 
            className="w-full h-full aspect-video max-w-5xl border-0"
            allowFullScreen
            title={title}
            sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
          />
        </div>
      );
    }
    
    if (normalizedType === 'image') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black/5 p-4 overflow-auto relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={safeUrl} 
            alt={title} 
            className="max-w-full max-h-full object-contain shadow-sm bg-white" 
          />
        </div>
      );
    }
    
    if (normalizedType === 'pdf' || normalizedType === 'web' || normalizedType === 'link') {
      return (
        <div className="w-full h-full bg-white relative flex flex-col">
          <div className="w-full bg-secondary/50 border-b border-border/50 py-2 px-4 flex justify-between items-center text-xs text-muted-foreground z-10 shrink-0 shadow-sm">
            <span>If the document doesn't display correctly, you can view it directly.</span>
            <a 
              href={safeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
            </a>
          </div>
          {/* We use an iframe. Note that some real websites block iframes, but this simulates the in-app viewer experience */}
          <iframe 
            src={safeUrl}
            className="flex-1 w-full border-0 bg-white"
            title={title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      );
    }

    // Fallback for archives/others
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/20 p-6 text-center">
        <FileText className="h-20 w-20 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold text-foreground">Preview not available</h3>
        <p className="text-muted-foreground mt-2 text-sm max-w-md">
          This file type ({type}) cannot be previewed directly in the browser.
        </p>
        <Button 
          className="mt-6 gap-2"
          onClick={() => {
            const a = document.createElement('a');
            a.href = safeUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.download = title;
            a.click();
          }}
        >
          <Download className="h-4 w-4" />
          Download File
        </Button>
      </div>
    );
  };

  const Icon = normalizedType === 'pdf' ? FileText : 
               normalizedType === 'video' ? PlaySquare : 
               normalizedType === 'image' ? ImageIcon : Globe;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="resource-viewer-title">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
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
            <div className="p-2 rounded-lg bg-secondary/50 shrink-0" aria-hidden="true">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h2 id="resource-viewer-title" className="font-semibold text-foreground text-sm truncate" title={title}>
              {title}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-9 px-3 text-muted-foreground hover:text-foreground hidden sm:flex gap-2"
              onClick={() => window.open(safeUrl, '_blank', 'noopener,noreferrer')}
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
                a.href = safeUrl;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
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
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onClose}
              aria-label="Close resource viewer"
              title="Close"
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
