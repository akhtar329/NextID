// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { VisitorTracker } from '@/app/component/analytics/VisitorTracker';
import { ThemeProvider } from '@/app/component/ThemeProvider/ThemeProvider';
import { generateSEO } from "../app/lib/seo";

// ✅ Merge default SEO with AdSense meta
export const metadata: Metadata = {
  ...generateSEO(),
  verification: {
    google: "ca-pub-1795193201036290", // AdSense verification
  },
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
          
          {/* ✅ Only ONE tracker - VisitorTracker handles location & sessions */}
          <VisitorTracker />
          
          {/* ✅ Vercel Analytics - Optional, can keep or remove */}
          <Analytics />
          
          <Toaster 
            position="top-right"
            richColors
            closeButton
            expand={false}
            className="transform-gpu"
            duration={3000}
          />

          {/* ✅ Google Analytics (gtag) */}
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
              gtag('config', 'G-2VNFCBN0SG', {
                page_path: window.location.pathname,
                send_page_view: true
              });
            `}
          </Script>

          {/* ✅ Google AdSense Script */}
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