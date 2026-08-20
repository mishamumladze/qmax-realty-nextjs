// src/app/layout.tsx
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { SpeedInsights } from "@vercel/speed-insights/next"
import '@/app/globals.scss';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <SpeedInsights/>
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow transition-fade min-h-screen md:pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}