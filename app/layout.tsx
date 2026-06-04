// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextID - Education Platform Pakistan",
  description:
    "Latest education news, admissions, exams, and results in Pakistan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {/* MAIN CONTENT FIRST (IMPORTANT FOR LCP) */}
        {children}

        {/* Toast (keep light) */}
        <Toaster position="top-right" richColors />

        {/* SpeedInsights (DELAYED - NOT blocking) */}
        <div style={{ display: "none" }}>
          <SpeedInsights />
        </div>

        {/* 🚨 ADSENSE DELAYED (BIG FIX) */}
        <Script
          id="adsense-script"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1795193201036290"
          crossOrigin="anonymous"
        />

        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-2VNFCBN0SG"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2VNFCBN0SG');
            `,
          }}
        />
      </body>
    </html>
  );
}