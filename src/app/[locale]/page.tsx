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
      {/* Hero Section */}
      <section
        className="relative h-[68vh] w-full md:h-[72vh]"
        aria-label={t("Hero.slideshow_aria")}
      >
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
            className="absolute inset-0 flex flex-col bg-gradient-to-t from-black/80 via-black/40
              to-transparent py-16 text-center md:py-24"
          >
            <div
              className="mx-auto mb-6 flex h-full w-4/5 flex-col items-center justify-end
                text-white"
            >
              <h1 className="mb-2 text-3xl font-bold md:text-5xl">{t("Hero.title")}</h1>
              <p className="mx-auto mb-6 max-w-2xl text-base md:text-lg">{t("Hero.subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <PrimaryButtonRounded
                label={t("Hero.buy_btn")}
                icon={<Home className="h-3 w-3 md:h-5 md:w-5" aria-hidden="true" />}
                href="/listings?offer=sale"
              />
              <PrimaryButtonRounded
                label={t("Hero.rent_btn")}
                icon={<Key className="h-3 w-3 md:h-5 md:w-5" aria-hidden="true" />}
                href="/listings?offer=rent"
              />
              <PrimaryButtonRounded
                label={t("Hero.sell_btn")}
                icon={<BadgeDollarSign className="h-3 w-3 md:h-5 md:w-5" aria-hidden="true" />}
                href="/contact?subject=selling"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Properties Carousel Section */}
      <PropertiesCarousel properties={properties} />

      {/* Why Choose Us Section */}
      <section className="section dark:bg-gray-900" aria-labelledby="why-us-heading">
        <div className="mb-12 text-center">
          <h2
            id="why-us-heading"
            className="mb-12 text-3xl font-bold text-gray-800 md:text-4xl dark:text-white"
          >
            {t("WhyUs.title")}
          </h2>

          {/* Stats Grid */}
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-3">
            <div className="text-center">
              <p className="text-brand-600 dark:text-brand-400 text-3xl font-black md:text-4xl">
                15+
              </p>
              <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                {t("WhyUs.years_excellence")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-brand-600 dark:text-brand-400 text-3xl font-black md:text-4xl">
                1,200+
              </p>
              <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                {t("WhyUs.properties_sold")}
              </p>
            </div>
            <div className="text-center max-md:col-span-2">
              <p className="text-brand-600 dark:text-brand-400 text-3xl font-black md:text-4xl">
                99%
              </p>
              <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                {t("WhyUs.client_satisfaction")}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
          {whyUsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="text-center">
                <div
                  className="bg-brand-100 dark:bg-brand-900/50 mx-auto mb-4 flex h-16 w-16
                    items-center justify-center rounded-full"
                >
                  <Icon className="text-brand-600 h-8 w-8" aria-hidden="true" />
                </div>
                <h3
                  className="mb-2 text-xs font-semibold text-gray-800 md:text-base lg:text-xl
                    dark:text-white"
                >
                  {item.title}
                  {item.hasStar && (
                    <Star
                      className="text-brand-600 ml-1 inline-block h-4 w-4 align-text-bottom"
                      aria-hidden="true"
                    />
                  )}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Contact CTA Banner */}
      <section className="section dark:bg-gray-900">
        <div className="bg-brand-600 rounded-2xl p-8 text-center text-white md:p-12">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">{t("ContactBanner.title")}</h2>
          <p className="mx-auto mb-6 max-w-xl text-lg text-white">
            {t("ContactBanner.description")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <SecondaryButton
              label={t("ContactBanner.whatsapp_btn")}
              href={CONTACT_INFO.whatsapp.href}
              icon={<Image src="/img/Logos/si-whatsapp.svg" alt="" width={20} height={20} />}
            />
            <PrimaryButton label={t("ContactBanner.view_all_btn")} href="/listings" />
          </div>
        </div>
      </section>
    </>
  );
}
