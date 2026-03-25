// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import ClientAnalyticsTracker from '@/app/component/ClientAnalyticsTracker/ClientAnalyticsTracker';

import { generateSEO } from "../app/lib/seo";

export const metadata = generateSEO();

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
          
          {/* 👇 Your custom analytics tracker - for detailed location & session data */}
          <ClientAnalyticsTracker />
          
          {/* 👇 Vercel Analytics - Auto tracks page views */}
          <Analytics />
          
          <Toaster 
            position="top-right"
            richColors
            closeButton
            expand={false}
            className="transform-gpu"
            duration={3000}
          />
        </Providers>

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
            gtag('config', 'G-2VNFCBN0SG', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}