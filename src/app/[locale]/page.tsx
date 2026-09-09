import Image from "next/image";
import { getTranslations } from "next-intl/server";
import PropertiesCarousel from "@/components/PropertiesCarousel";
import { getActiveProperties } from "@/lib/db";
import { PrimaryButton, PrimaryButtonRounded, SecondaryButton } from "@/components/ui/Buttons";
import { CONTACT_INFO } from "@/config/contact";

import { Home, Key, BadgeDollarSign, Building2, Star, Handshake, ShieldCheck } from "lucide-react";
import { Metadata } from "next";

// 1. Dynamic localized Metadata scoped to "HomePage.Metadata"
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.HomePage.Metadata");

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "https://qmax-realty.vercel.app",
    },
    openGraph: {
      title: `${t("title")} - QMAX Realty`,
      description: t("description"),
      url: "https://qmax-realty.vercel.app",
      images: [
        {
          url: "https://qmax-realty.vercel.app/img/og-image.webp",
          width: 1200,
          height: 630,
          alt: t("og_alt"),
          type: "image/webp",
        },
      ],
    },
  };
}

export default async function HomePage() {
  // Scope translations to "HomePage"
  const t = await getTranslations("Pages.HomePage");
  const properties = getActiveProperties().slice(0, 6);

  const whyUsItems = [
    {
      icon: Building2,
      title: t("WhyUs.experts_title"),
      hasStar: false,
      desc: t("WhyUs.experts_desc"),
    },
    {
      icon: Star,
      title: t("WhyUs.service_title"),
      hasStar: true,
      desc: t("WhyUs.service_desc"),
    },
    {
      icon: Handshake,
      title: t("WhyUs.approach_title"),
      hasStar: false,
      desc: t("WhyUs.approach_desc"),
    },
    {
      icon: ShieldCheck,
      title: t("WhyUs.trusted_title"),
      hasStar: false,
      desc: t("WhyUs.trusted_desc"),
    },
  ];

  return (
    <>
      {/* Hero Section — image-based */}
      <section aria-labelledby="home-hero-heading" className="relative h-[62svh] w-full md:h-[72vh]">
        <div className="relative h-full w-full">
          <Image
            src="/img/hero.webp"
            alt={t("Hero.image_alt")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_35%]"
          />
          <div
            className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80
              via-black/40 to-transparent text-center"
          >
            <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 md:pb-16">
              <span
                className="inline-flex items-center gap-2 rounded-full border border-white/25
                  bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-brand-50 uppercase"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-200"/>
                QMAX Realty
              </span>
              <h1
                id="home-hero-heading"
                className="mx-auto mt-5 max-w-2xl text-h1 font-bold text-balance text-white"
              >
                {t("Hero.title")}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
                {t("Hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
                <PrimaryButtonRounded
                  label={t("Hero.buy_btn")}
                  icon={<Home className="h-5 w-5" aria-hidden="true"/>}
                  href="/listings?offer=sale"
                  size="lg"
                  className="w-full min-h-[44px] sm:w-auto"
                />
                <PrimaryButtonRounded
                  label={t("Hero.rent_btn")}
                  icon={<Key className="h-5 w-5" aria-hidden="true"/>}
                  href="/listings?offer=rent"
                  size="lg"
                  className="w-full min-h-[44px] sm:w-auto"
                />
                <PrimaryButtonRounded
                  label={t("Hero.sell_btn")}
                  icon={<BadgeDollarSign className="h-5 w-5" aria-hidden="true"/>}
                  href="/contact?subject=selling"
                  size="lg"
                  className="w-full min-h-[44px] sm:w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Carousel Section */}
      <PropertiesCarousel properties={properties}/>

      {/* Why Choose Us Section — gray band */}
      <section
        aria-labelledby="why-us-heading"
        className="border-y border-gray-100 bg-gray-50 py-12 md:py-20 dark:border-gray-700
          dark:bg-gray-800"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <h2
              id="why-us-heading"
              className="text-h2 font-bold text-balance text-gray-900 dark:text-white"
            >
              {t("WhyUs.title")}
            </h2>

            {/* Stats Grid */}
            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-brand-700 md:text-4xl dark:text-brand-300">
                  15+
                </p>
                <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                  {t("WhyUs.years_excellence")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-brand-700 md:text-4xl dark:text-brand-300">
                  1,200+
                </p>
                <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                  {t("WhyUs.properties_sold")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-brand-700 md:text-4xl dark:text-brand-300">
                  99%
                </p>
                <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                  {t("WhyUs.client_satisfaction")}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {whyUsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm
                    transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg
                    dark:border-gray-600 dark:bg-gray-700/40"
                >
                  <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl
                      bg-brand-50 dark:bg-brand-900/40"
                  >
                    <Icon
                      className="h-6 w-6 text-brand-700 dark:text-brand-300"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                    {item.title}
                    {item.hasStar && (
                      <Star
                        className="ml-1 inline-block h-4 w-4 align-text-bottom text-brand-700
                          dark:text-brand-300"
                        aria-hidden="true"
                      />
                    )}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Contact CTA Banner */}
      <section
        aria-labelledby="home-cta-heading"
        className="bg-white py-12 md:py-20 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="relative overflow-hidden rounded-3xl border border-brand-700 bg-brand-800
              px-6 py-10 shadow-xl sm:px-10 md:p-14"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"/>
            </div>
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_auto]">
              <div>
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/25
                    bg-white/10 px-3 py-1 text-xs font-bold tracking-[0.18em] text-brand-50 uppercase"
                >
                  QMAX Realty
                </span>
                <h2
                  id="home-cta-heading"
                  className="mt-4 text-h2 font-bold text-balance text-white"
                >
                  {t("ContactBanner.title")}
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-brand-50/85 md:text-lg">
                  {t("ContactBanner.description")}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                <SecondaryButton
                  label={t("ContactBanner.whatsapp_btn")}
                  href={CONTACT_INFO.whatsapp.href}
                  size="lg"
                  className="w-full min-h-[44px] border-white sm:w-auto lg:w-full"
                  icon={<Image src="/img/Logos/si-whatsapp.svg" alt="" width={20} height={20}/>}
                />
                <PrimaryButton
                  label={t("ContactBanner.view_all_btn")}
                  href="/listings"
                  size="lg"
                  className="w-full min-h-[44px] sm:w-auto lg:w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
