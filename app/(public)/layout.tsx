// app/(public)/layout.tsx
import Header from '@/app/component/layout/Header';
import Footer from '@/app/component/layout/Footer';
import { generateSEO } from "../../app/lib/seo";

export const metadata = generateSEO();

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
    </>
  );
}