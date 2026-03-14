// app/components/ClientAnalyticsTracker.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const AnalyticsTracker = dynamic(
  () => import('@/app/component/analyticstraker/AnalyticsTracker').then(mod => mod.AnalyticsTracker),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function ClientAnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}