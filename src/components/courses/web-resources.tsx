'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Globe, PlaySquare, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceViewer } from '@/components/ui/resource-viewer';

interface WikiSummary {
  title: string;
  extract: string;
  content_urls: {
    desktop: { page: string };
  };
  thumbnail?: {
    source: string;
  };
}

export function WebResources({ topic }: { topic: string }) {
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<{url: string, title: string, type: string} | null>(null);

  useEffect(() => {
    async function fetchWiki() {
      setLoading(true);
      setError(false);
      try {
        // We clean up the topic string slightly to improve Wikipedia search matches
        // e.g. "Network Analysis I" -> "Network_analysis" (simple regex for demo purposes)
        const query = encodeURIComponent(topic.split(' I')[0].replace(/\s+/g, '_'));
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setWiki(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchWiki();
  }, [topic]);

  return (
    <div className="space-y-6">
      {/* Wikipedia Section */}
      <div className="bg-secondary/10 rounded-2xl p-5 border border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-sky-400" />
          <h3 className="font-semibold text-foreground text-sm">Web Discovery (Wikipedia)</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !wiki ? (
          <div className="text-center py-6">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Could not fetch automatic summary for this topic.</p>
            <Button variant="outline" size="sm" className="mt-3 text-xs h-7" onClick={() => setViewerUrl({
              url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(topic)}`,
              title: `Search Wikipedia: ${topic}`,
              type: 'web'
            })}>
              Search Wikipedia Manually <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            {wiki.thumbnail && (
              <img 
                src={wiki.thumbnail.source} 
                alt={wiki.title} 
                className="w-full sm:w-32 h-32 object-cover rounded-xl bg-secondary/50 flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-base mb-1">{wiki.title}</h4>
              <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-3 mb-3">
                {wiki.extract}
              </p>
              <button 
                onClick={() => setViewerUrl({
                  url: wiki.content_urls.desktop.page,
                  title: wiki.title,
                  type: 'web'
                })}
                className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Read full article <ExternalLink className="ml-1 h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* YouTube Embedded Search */}
      <div className="bg-secondary/10 rounded-2xl p-5 border border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <PlaySquare className="h-4 w-4 text-red-500" />
          <h3 className="font-semibold text-foreground text-sm">Video Lectures (YouTube)</h3>
        </div>
        
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-border/50 relative">
          <iframe 
            src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(topic + ' engineering lecture')}`}
            className="absolute top-0 left-0 w-full h-full"
            allowFullScreen
          />
        </div>
      </div>
      
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
