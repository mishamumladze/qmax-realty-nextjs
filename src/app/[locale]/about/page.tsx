// app/about/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CONTACT_INFO } from "@/config/contact";
import {
  Award,
  Building2,
  BadgeCheck,
  Trophy,
  MapPin,
  Globe,
  ShieldCheck,
  Handshake,
  Clock,
  House,
  KeyRound,
  TrendingUp,
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
      {/* Hero */}
      <section
        className="from-brand-600 to-brand-700 dark:from-brand-700 dark:to-brand-800 relative
          overflow-hidden bg-gradient-to-r py-16 text-white md:py-24"
      >
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">{t("Hero.title")}</h1>
          <p className="mx-auto max-w-2xl text-base md:text-lg">{t("Hero.subtitle")}</p>
        </div>
      </section>

      {/* Our Story */}
      <section
        className="mx-auto my-6 grid grid-cols-1 items-center gap-10 rounded-lg px-4 py-8 md:my-8
          md:py-12 lg:grid-cols-2"
      >
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <img
            src="/img/hero.webp"
            alt={t("Story.image_alt")}
            className="h-72 w-full object-cover md:h-[420px]"
            width={4449}
            height={2965}
          />
        </div>
        <div>
          <h2 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl dark:text-white">
            {t("Story.title")}
          </h2>
          <p className="mb-4 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
            {t("Story.p1")}
          </p>
          <p className="mb-6 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
            {t("Story.p2")}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/listings"
              className="bg-brand-600 hover:bg-brand-700 rounded-lg px-6 py-3 text-center
                font-semibold text-white transition-colors duration-200"
            >
              {t("Buttons.browse")}
            </Link>
            <Link
              href="/contact"
              className="border-brand-600 text-brand-600 hover:bg-brand-50 rounded-lg border-2 px-6
                py-3 text-center font-semibold transition-colors duration-200"
            >
              {t("Buttons.get_in_touch")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        className="mx-auto my-6 grid grid-cols-2 gap-6 rounded-lg px-4 py-8 text-center md:my-8
          md:grid-cols-4 md:py-12"
      >
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.labelKey}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm
                transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div
                className="bg-brand-50 dark:bg-brand-900/40 mx-auto mb-3 flex h-12 w-12 items-center
                  justify-center rounded-xl"
              >
                <Icon className="text-brand-600 dark:text-brand-400 h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-gray-800 md:text-3xl dark:text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t(`Stats.${stat.labelKey}`)}
              </p>
            </div>
          );
        })}
      </section>

      {/* What We Do */}
      <section className="mx-auto my-6 rounded-lg px-4 py-8 text-center md:my-8 md:py-12">
        <h2 className="mb-2 text-3xl font-bold text-gray-800 md:text-4xl dark:text-white">
          {t("WhatWeDo.title")}
        </h2>
        <p className="mb-8 text-base text-gray-600 md:text-lg dark:text-gray-300">
          {t("WhatWeDo.subtitle")}
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.slug}
                className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm
                  transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div
                  className="bg-brand-50 dark:bg-brand-900/40 mx-auto mb-3 flex h-12 w-12
                    items-center justify-center rounded-xl"
                >
                  <Icon className="text-brand-600 dark:text-brand-400 h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-800 md:text-2xl dark:text-white">
                  {t(`Services.${service.slug}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t(`Services.${service.slug}.text`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        className="mx-auto my-6 rounded-2xl rounded-lg bg-gray-50 px-4 py-8 text-center md:my-8
          md:py-12 dark:bg-gray-900"
      >
        <h2
          className="mb-2 text-center text-3xl font-bold text-gray-800 md:text-4xl dark:text-white"
        >
          {t("WhyChoose.title")}
        </h2>
        <p className="mb-10 text-center text-base text-gray-600 md:text-lg dark:text-gray-300">
          {t("WhyChoose.subtitle")}
        </p>
        <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE_US.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.slug}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm
                  transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-3 flex items-center gap-3 text-center">
                  <div className="flex w-full items-center justify-center">
                    <div
                      className="bg-brand-50 dark:bg-brand-900/40 flex h-10 w-10 flex-shrink-0
                        items-center justify-center rounded-lg"
                    >
                      <Icon
                        className="text-brand-600 dark:text-brand-400 h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>
                    <h3
                      className="text-center text-xl font-semibold text-gray-800 md:text-2xl
                        dark:text-white"
                    >
                      {t(`WhyUs.${reason.slug}.title`)}
                    </h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t(`WhyUs.${reason.slug}.text`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section
        className="from-brand-600 to-brand-700 mx-auto my-6 rounded-lg bg-gradient-to-r px-4 py-8
          text-center text-white md:my-8 md:py-12"
      >
        <h2 className="mb-3 text-2xl font-bold md:text-3xl">{t("ReadyCta.title")}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-base md:text-lg">{t("ReadyCta.subtitle")}</p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href={CONTACT_INFO.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 hover:bg-brand-50 rounded-lg bg-white px-6 py-3 font-semibold
              transition-colors duration-200"
          >
            {t("Buttons.whatsapp")}
          </a>
          <Link
            href="/contact"
            className="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white
              transition-colors duration-200 hover:bg-white/10"
          >
            {t("Buttons.contact")}
          </Link>
        </div>
      </section>
    </>
  );
}
