'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function SegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard segment error:', error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold">This section could not load</h2>
      <p className="text-sm text-muted-foreground">Please try again. Your data is safe.</p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  );
}
