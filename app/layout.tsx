import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GoogleAnalytics from "@/components/google/GoogleAnalytics";

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
      <head>
        {/* PRECONNECT & DNS PREFETCH */}
        <link
          rel="preconnect"
          href="https://ep-round-resonance-ahwsjtcv-pooler.us-east-1.aws.neon.tech"
        />
        <link
          rel="dns-prefetch"
          href="https://ep-round-resonance-ahwsjtcv-pooler.us-east-1.aws.neon.tech"
        />
        <link rel="preconnect" href="https://www.nextid.pk" />
        <link rel="dns-prefetch" href="https://www.nextid.pk" />

        {/* GOOGLE ADS PREFETCH */}
        <link
          rel="preconnect"
          href="https://pagead2.googlesyndication.com"
        />
        <link
          rel="dns-prefetch"
          href="https://pagead2.googlesyndication.com"
        />
      </head>

      <body className={`${inter.className} antialiased`}>
        {children}

        {/* GA TRACKING */}
        <GoogleAnalytics />

        {/* TOAST */}
        <Toaster position="top-right" richColors />

        {/* SPEED INSIGHTS (non-blocking) */}
        <div style={{ display: "none" }}>
          <SpeedInsights />
        </div>

        {/* ADSENSE */}
        <Script
          id="adsense-script"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1795193201036290"
          crossOrigin="anonymous"
        />

        {/* GOOGLE ANALYTICS SCRIPT (ONLY ONCE) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-2VNFCBN0SG"
        />
      </body>
    </html>
  );
}