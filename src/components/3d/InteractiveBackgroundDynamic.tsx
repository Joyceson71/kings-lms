'use client';

import dynamic from 'next/dynamic';

export const InteractiveBackgroundDynamic = dynamic(
  () => import('./InteractiveBackground').then(mod => mod.InteractiveBackground),
  { ssr: false }
);
