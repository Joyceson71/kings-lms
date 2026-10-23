'use client';

import { useEffect } from 'react';
import SegmentError from '@/components/dashboard/segment-error';

export default function AtRiskError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('At-risk students page error:', error); }, [error]);
  return <SegmentError error={error} reset={reset} />;
}
