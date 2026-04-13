// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { VisitorTracker } from '@/app/component/analytics/VisitorTracker';
import { ThemeProvider } from '@/app/component/ThemeProvider/ThemeProvider';

const inter = Inter({ subsets: ["latin"] });

// ✅ Correct way - AdSense meta in metadata
export const metadata: Metadata = {
  title: 'NextID - Education Platform Pakistan',
  description: 'Latest education news, admissions, exams, and results in Pakistan',
  verification: {
    google: 'ca-pub-1795193201036290', // ✅ AdSense verification
    other: {
      'google-adsense-account': ['ca-pub-1795193201036290'],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
          <VisitorTracker />
          <Analytics />
          <Toaster 
            position="top-right"
            richColors
            closeButton
            expand={false}
            className="transform-gpu"
            duration={3000}
          />

          {/* Google Analytics */}
          <Script
            strategy="afterInteractive"
            src="https://www.googletagmanager.com/gtag/js?id=G-2VNFCBN0SG"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2VNFCBN0SG');
            `}
          </Script>

          {/* ✅ Google AdSense Script - Required for ads */}
          <Script
            strategy="afterInteractive"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1795193201036290"
            crossOrigin="anonymous"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}