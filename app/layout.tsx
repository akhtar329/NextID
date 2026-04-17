import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from '@/app/component/ThemeProvider/ThemeProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'NextID - Education Platform Pakistan',
  description: 'Latest education news, admissions, exams, and results in Pakistan',
  verification: {
    google: 'ca-pub-1795193201036290',
    other: {
      'google-adsense-account': ['ca-pub-1795193201036290'],
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}

          <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
            duration={3000}
          />

          {/* AdSense ONLY (keep) */}
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