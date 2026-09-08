'use client';

import dynamic from 'next/dynamic';

// dynamic() with ssr: false must live inside a Client Component.
// This wrapper is imported normally from layout.tsx (Server Component),
// but the actual Leaflet CSS load is deferred to the client bundle only.
const LeafletStylesInner = dynamic(
  () => import('./leaflet-styles').then((m) => m.LeafletStyles),
  { ssr: false }
);

export function LeafletStylesLoader() {
  return <LeafletStylesInner />;
}
