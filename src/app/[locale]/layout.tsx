import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import ThemeToggle from "@/components/ThemeToggle";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "@/app/globals.scss";

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is supported
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Obtain all localization messages for client components
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <template
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <SpeedInsights />
      <body className="flex min-h-screen flex-col dark:bg-gray-900 dark:text-gray-100">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="focus:bg-brand-600 sr-only focus:not-sr-only focus:absolute focus:z-50
              focus:m-2 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Navbar />
          <ThemeToggle />
          <main
            id="main-content"
            className="transition-fade min-h-screen flex-grow pb-20 md:pt-16 md:pb-0"
          >
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
