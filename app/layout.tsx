// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";

import { generateSEO } from "../app/lib/seo";
// ✅ Import the client wrapper instead
import ClientAnalyticsTracker from '@/app/component/ClientAnalyticsTracker/ClientAnalyticsTracker';

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
          
          {/* ✅ Use the client wrapper - no Suspense needed here */}
          <ClientAnalyticsTracker />
          
          <Toaster 
            position="top-right"
            richColors
            closeButton
            expand={false}
            className="transform-gpu"
            duration={3000}
          />
        </Providers>

        {/* GOOGLE ANALYTICS CODE - Already safe */}
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