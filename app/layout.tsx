// =====================================================
// IMPORTS
// =====================================================

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";


// =====================================================
// FONT CONFIGURATION
// =====================================================

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["Arial", "Helvetica", "sans-serif"],
});


// =====================================================
// ENVIRONMENT VARIABLES (No Throw Errors)
// =====================================================

const SITE_NAME = "NextID";
const SITE_URL = "https://www.nextid.pk";
const SITE_DESCRIPTION =
  "Pakistan's trusted education portal for admissions, results, scholarships, universities, colleges, schools, jobs, educational news and career updates.";

const SITE_KEYWORDS = [
  "Pakistan Education",
  "Admissions",
  "Results",
  "Scholarships",
  "Universities",
  "Colleges",
  "Schools",
  "Education News",
  "Board Results",
  "Jobs",
  "NextID",
];

// Environment variables with fallback (no crashes)
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";


// =====================================================
// VIEWPORT
// =====================================================

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F172A",
  colorScheme: "light",
};


// =====================================================
// GLOBAL METADATA
// =====================================================

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} - Pakistan Education Portal`,
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Education",
  referrer: "origin-when-cross-origin",

  authors: [
    {
      name: "NextID Editorial Team",
      url: SITE_URL,
    },
  ],

  alternates: {
    canonical: SITE_URL,
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
    locale: "en_PK",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Pakistan Education Portal`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Pakistan Education Portal`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Pakistan Education Portal`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/images/og-image.jpg`],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
  },
};


// =====================================================
// ROOT LAYOUT
// =====================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD Data (without empty social profiles)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description: SITE_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressCountry: "PK",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,

  };

  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* =====================================================
            DNS PREFETCH - Third Party Domains
        ===================================================== */}
        <link rel="dns-prefetch" href="//pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        {/* =====================================================
            GOOGLE SITE VERIFICATION
        ===================================================== */}
        {/* Add actual verification codes before deployment */}
        {/* <meta name="google-site-verification" content="YOUR_ACTUAL_CODE" /> */}
        {/* <meta name="msvalidate.01" content="YOUR_ACTUAL_BING_CODE" /> */}

        {/* =====================================================
            GOOGLE ADSENSE ACCOUNT - In HEAD (✅ Correct)
        ===================================================== */}
        {ADSENSE_CLIENT && (
          <meta
            name="google-adsense-account"
            content={ADSENSE_CLIENT}
          />
        )}
      </head>

      <body>
        {/* =====================================================
            PAGE CONTENT
        ===================================================== */}
        {children}

        {/* =====================================================
            TOASTER
        ===================================================== */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
        />

        {/* =====================================================
            ORGANIZATION JSON-LD
        ===================================================== */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        {/* =====================================================
            WEBSITE JSON-LD
        ===================================================== */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />

        {/* =====================================================
            GOOGLE ADSENSE SCRIPT - Conditional
        ===================================================== */}
        {ADSENSE_CLIENT && (
          <Script
            id="adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}

        {/* =====================================================
            GOOGLE ANALYTICS 4 - Conditional
        ===================================================== */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    page_path: window.location.pathname,
                    send_page_view: true
                  });
                `,
              }}
            />
          </>
        )}

        {/* =====================================================
            VERCEL ANALYTICS & SPEED INSIGHTS (Last)
        ===================================================== */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}