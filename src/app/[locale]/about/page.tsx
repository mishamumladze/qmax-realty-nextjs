// app/about/page.tsx
import { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CONTACT_INFO } from "@/config/contact";
import { Button, PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import {
  Award,
  Building2,
  BadgeCheck,
  MapPin,
  Globe,
  ShieldCheck,
  Handshake,
  Clock,
  House,
  KeyRound,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.About.Metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

// Stats data - unified across pages
const STATS = [
  { value: "15+", labelKey: "years_excellence", icon: Award },
  { value: "1,200+", labelKey: "properties_sold", icon: Building2 },
  { value: "99%", labelKey: "client_satisfaction", icon: BadgeCheck },
];

const SERVICES = [
  { icon: House, slug: "buying" },
  { icon: KeyRound, slug: "selling" },
  { icon: Building2, slug: "renting" },
  { icon: TrendingUp, slug: "investing" },
];

const WHY_CHOOSE_US = [
  { icon: MapPin, slug: "local_expertise" },
  { icon: Globe, slug: "multilingual_team" },
  { icon: ShieldCheck, slug: "transparent_deals" },
  { icon: Handshake, slug: "personal_service" },
  { icon: Clock, slug: "fast_response" },
  { icon: BadgeCheck, slug: "verified_listings" },
];

export default async function AboutPage() {
  const t = await getTranslations("Pages.About");

  return (
    <>
      {/* Hero — brand gradient band */}
      <section
        aria-labelledby="about-hero-heading"
        className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800
          to-brand-800 text-white"
      >
        {/* decorative glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"/>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 md:py-20 lg:py-24">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/25
              bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-brand-50 uppercase"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-200"/>
            QMAX Realty
          </span>
          <h1 id="about-hero-heading" className="mt-5 text-h1 font-bold text-balance">
            {t("Hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-50/90 md:text-lg">
            {t("Hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Our Story — white */}
      <section
        aria-labelledby="about-story-heading"
        className="bg-white py-12 md:py-20 lg:py-24 dark:bg-gray-900"
      >
        <div
          className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2
            lg:gap-14"
        >
          {/* Image with overlapping badge */}
          <div className="relative pb-8 lg:pb-0">
            <div
              className="overflow-hidden rounded-2xl border border-gray-100 shadow-lg
                dark:border-gray-700"
            >
              <Image
                src="/img/hero.webp"
                alt={t("Story.image_alt")}
                width={1200}
                height={800}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-64 w-full object-cover sm:h-80 lg:h-[480px]"
              />
            </div>
            <div
              className="absolute bottom-0 left-4 flex items-center gap-3 rounded-2xl border
                border-gray-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:left-6
                dark:border-gray-700 dark:bg-gray-800/95"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                  bg-brand-50 dark:bg-brand-900/40"
              >
                <BadgeCheck
                  className="h-5 w-5 text-brand-700 dark:text-brand-300"
                  aria-hidden="true"
                />
              </span>
              <span>
                <span className="block text-lg leading-none font-extrabold text-gray-900 dark:text-white">
                  15+
                </span>
                <span className="mt-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  {t("Stats.years_excellence")}
                </span>
              </span>
            </div>
          </div>

          {/* Copy */}
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-brand-200
                bg-brand-50 px-3 py-1 text-xs font-bold tracking-[0.18em] text-brand-800 uppercase
                dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
            >
              QMAX Realty
            </span>
            <h2
              id="about-story-heading"
              className="mt-4 text-h2 font-bold text-gray-900 text-balance dark:text-white"
            >
              {t("Story.title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
              {t("Story.p1")}
            </p>
            <p className="mt-4 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
              {t("Story.p2")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton
                label={t("Buttons.browse")}
                href="/listings"
                size="lg"
                className="w-full min-h-[44px] sm:w-auto"
              />
              <SecondaryButton
                label={t("Buttons.get_in_touch")}
                href="/contact"
                size="lg"
                className="w-full min-h-[44px] sm:w-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats — gray band, fixed 3-col */}
      <section
        aria-labelledby="about-stats-heading"
        className="border-y border-gray-100 bg-gray-50 py-12 md:py-20 dark:border-gray-700
          dark:bg-gray-800"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="about-stats-heading" className="sr-only">
            {`${t("Stats.years_excellence")} · ${t("Stats.properties_sold")} · ${t(
              "Stats.client_satisfaction"
            )}`}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.labelKey}
                  className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm
                    transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg
                    dark:border-gray-600 dark:bg-gray-700/40"
                >
                  <div
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl
                      bg-brand-50 dark:bg-brand-900/40"
                  >
                    <Icon
                      className="h-5 w-5 text-brand-700 dark:text-brand-300"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-3xl font-extrabold text-brand-700 md:text-4xl dark:text-brand-300">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t(`Stats.${stat.labelKey}`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Do — white, 4-up on desktop */}
      <section
        aria-labelledby="about-services-heading"
        className="bg-white py-12 md:py-20 lg:py-24 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-brand-200
                bg-brand-50 px-3 py-1 text-xs font-bold tracking-[0.18em] text-brand-800 uppercase
                dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
            >
              QMAX Realty
            </span>
            <h2
              id="about-services-heading"
              className="mt-4 text-h2 font-bold text-gray-900 text-balance dark:text-white"
            >
              {t("WhatWeDo.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
              {t("WhatWeDo.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.slug}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6
                    text-left shadow-sm transition-all duration-200 motion-safe:hover:-translate-y-0.5
                    hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50
                      dark:bg-brand-900/40"
                  >
                    <Icon
                      className="h-5 w-5 text-brand-700 dark:text-brand-300"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t(`Services.${service.slug}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {t(`Services.${service.slug}.text`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us — gray band, top-aligned icons */}
      <section
        aria-labelledby="about-why-heading"
        className="border-y border-gray-100 bg-gray-50 py-12 md:py-20 lg:py-24 dark:border-gray-700
          dark:bg-gray-800"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-brand-200
                bg-white px-3 py-1 text-xs font-bold tracking-[0.18em] text-brand-800 uppercase
                dark:border-gray-700 dark:bg-gray-800 dark:text-brand-200"
            >
              QMAX Realty
            </span>
            <h2
              id="about-why-heading"
              className="mt-4 text-h2 font-bold text-gray-900 text-balance dark:text-white"
            >
              {t("WhyChoose.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
              {t("WhyChoose.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WHY_CHOOSE_US.map((reason) => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.slug}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all
                    duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg
                    dark:border-gray-600 dark:bg-gray-700/40"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                        bg-brand-50 dark:bg-brand-900/40"
                    >
                      <Icon
                        className="h-5 w-5 text-brand-700 dark:text-brand-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base leading-snug font-semibold text-gray-900 sm:text-lg dark:text-white">
                        {t(`WhyUs.${reason.slug}.title`)}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {t(`WhyUs.${reason.slug}.text`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — dark brand-800 card, distinct from Hero gradient */}
      <section
        aria-labelledby="about-cta-heading"
        className="bg-white py-12 md:py-20 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="relative overflow-hidden rounded-3xl border border-brand-700 bg-brand-800 px-6
              py-10 shadow-xl sm:px-10 md:p-14"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"/>
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"/>
            </div>
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_auto]">
              <div>
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/25
                    bg-white/10 px-3 py-1 text-xs font-bold tracking-[0.18em] text-brand-50 uppercase"
                >
                  QMAX Realty
                </span>
                <h2 id="about-cta-heading" className="mt-4 text-h2 font-bold text-white text-balance">
                  {t("ReadyCta.title")}
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-brand-50/85 md:text-lg">
                  {t("ReadyCta.subtitle")}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                <SecondaryButton
                  label={t("Buttons.whatsapp")}
                  href={CONTACT_INFO.whatsapp.href}
                  size="lg"
                  className="w-full min-h-[44px] border-white sm:w-auto lg:w-full"
                  icon={
                    <Image src="/img/Logos/si-whatsapp.svg" alt="" width={20} height={20}/>
                  }
                />
                <Button
                  variant="tertiary"
                  size="lg"
                  href="/contact"
                  label={t("Buttons.contact")}
                  className="w-full min-h-[44px] border-2 border-white/30 sm:w-auto lg:w-full"
                  icon={<ArrowRight className="h-5 w-5" aria-hidden="true"/>}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
