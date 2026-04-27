// app/(public)/layout.tsx
import Header from '@/app/component/layout/Header';
import Footer from '@/app/component/layout/Footer';
import type { Metadata } from 'next';

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// ==================== NEXT.JS CACHE CONFIGURATION ====================
export const revalidate = 86400; // ✅ Cache layout for 1 day (layouts rarely change)
export const dynamic = 'force-static';

// ==================== METADATA ====================
export const metadata: Metadata = {
  title: "Latest Education News, Results & Admissions in Pakistan | NextID",
  description: "Get latest education news, board results, test dates, admissions updates, and exam information across Pakistan.",
  metadataBase: new URL("https://www.nextid.pk"),
  alternates: {
    canonical: "https://www.nextid.pk",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    title: "NextID - Pakistan's Leading Education Portal",
    description: "Get latest education news, board results, test dates, admissions updates, and exam information across Pakistan.",
    siteName: "NextID",
    locale: "en_PK",
    url: "https://www.nextid.pk",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NextID - Education Portal Pakistan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextID - Pakistan's Leading Education Portal",
    description: "Get latest education news, board results, test dates, admissions updates, and exam information across Pakistan.",
    images: ["/og-image.png"],
  },
};

// ==================== LAYOUT ====================
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <Analytics />
      <SpeedInsights />
    </>
  );
}