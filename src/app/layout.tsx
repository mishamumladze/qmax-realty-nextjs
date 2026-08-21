// src/app/layout.tsx
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ThemeToggle from "@/components/ThemeToggle";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "@/app/globals.scss";
import type { Metadata, Viewport } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
// app/layout.tsx

export const viewport: Viewport = {
  themeColor: "#4285f4",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://qmax-realty.vercel.app"),
  title: {
    default: "QMAX Realty - Premium Real Estate in Georgia",
    template: "%s - QMAX Realty",
  },
  description:
    "Discover premium properties, invest with confidence. Expert real estate solutions in Tbilisi and across Georgia.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://qmax-realty.vercel.app",
    siteName: "QMAX Realty",
    title: "QMAX Realty - Premium Real Estate in Georgia",
    description:
      "Discover premium real estate with expert guidance and unmatched service. Buy, sell, or rent properties in Georgia.",
    images: [
      {
        url: "/img/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Premium Properties - QMAX Realty",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@qmaxrealty", // Replace with actual X/Twitter handle
    creator: "@qmaxrealty",
    title: "QMAX Realty - Premium Real Estate in Georgia",
    description: "Discover premium properties, invest with confidence.",
    images: ["/img/og-image.webp"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <SpeedInsights />
      <body className="flex min-h-screen flex-col dark:bg-gray-900 dark:text-gray-100">
        <a
          href="#main-content"
          className="focus:bg-brand-600 sr-only focus:not-sr-only focus:absolute focus:z-50
            focus:m-2 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <ThemeToggle />
        <main id="main-content" className="min-h-screen flex-grow pb-20 md:pt-16 md:pb-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
