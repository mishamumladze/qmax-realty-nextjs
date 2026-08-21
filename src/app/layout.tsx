// src/app/layout.tsx
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ThemeToggle from "@/components/ThemeToggle";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "@/app/globals.scss";
import { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "QMAX Realty - Premium Real Estate in Georgia",
  description:
    "Discover premium properties, invest with confidence. Expert real estate solutions in Tbilisi and across Georgia.",
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://qmax-realty.vercel.app"), // CHANGE THIS TO YOUR DOMAIN
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://qmax-realty.vercel.app",
    siteName: "QMAX Realty",
    title: "QMAX Realty - Premium Real Estate in Georgia",
    description:
      "Discover premium properties, invest with confidence. Expert real estate solutions in Tbilisi and across Georgia.",
    images: [
      {
        url: "/img/placeholder_1.webp", // Should be 1200x630px
        // width: 1200,
        // height: 630,
        alt: "QMAX Realty - Premium Properties",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QMAX Realty - Premium Real Estate in Georgia",
    description: "Discover premium properties, invest with confidence.",
    images: ["/img/placeholder_1.webp"],
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
