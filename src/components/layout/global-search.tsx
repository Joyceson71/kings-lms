'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Result = { id: string; title: string; kind: string; href: string; detail: string };
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const runSearch = useCallback(async (value: string) => {
    if (value.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true); setError(false);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json() as { results?: Result[] };
      setResults(data.results ?? []);
    } catch { setError(true); setResults([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void runSearch(query); }, 250);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(value => !value); }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  const navigate = (result: Result) => { setOpen(false); setQuery(''); router.push(result.href); };
  return <>
    <button type="button" onClick={() => setOpen(true)} className="relative h-[34px] w-9 rounded-md text-left text-[13px] text-muted-foreground neo-input pl-9 pr-10 md:w-full" aria-label="Search courses, assignments, resources, and announcements"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" /><span className="hidden md:inline">Search…</span><kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 text-[10px] sm:block">⌘K</kbd></button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl p-0"><DialogHeader className="sr-only"><DialogTitle>Search Kings LMS</DialogTitle><DialogDescription>Search accessible courses, assignments, resources, and announcements.</DialogDescription></DialogHeader><div className="flex items-center gap-2 border-b px-4"><Search className="size-4 text-muted-foreground" /><Input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search courses, assignments, resources…" className="h-12 border-0 shadow-none focus-visible:ring-0" /></div><div className="max-h-[55vh] overflow-y-auto p-2">{loading && <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching…</div>}{error && <div className="p-4 text-sm text-destructive">Search failed. <button className="underline" onClick={() => void runSearch(query)}>Try again</button></div>}{!loading && !error && query.trim().length >= 2 && results.length === 0 && <p className="p-4 text-sm text-muted-foreground">No matching results.</p>}{!loading && query.trim().length < 2 && <p className="p-4 text-sm text-muted-foreground">Type at least 2 characters to search.</p>}{results.map(result => <button key={`${result.kind}:${result.id}`} onClick={() => navigate(result)} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left hover:bg-muted"><span className="truncate text-sm">{result.title}<span className="ml-2 text-xs text-muted-foreground">{result.detail}</span></span><span className="ml-3 shrink-0 rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">{result.kind}</span></button>)}</div></DialogContent></Dialog>
  </>;
}
