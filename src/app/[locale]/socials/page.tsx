import { Metadata } from "next";
import { CONTACT_INFO, SOCIAL_MEDIAS } from "@/config/contact";
import NewsletterForm from "@/components/NewsletterForm";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { siTelegram, siWhatsapp } from "simple-icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages.Socials.Metadata" });
  const canonical =
    locale === "en"
      ? "https://qmax-realty.vercel.app/socials"
      : `https://qmax-realty.vercel.app/${locale}/socials`;
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          l === "en"
            ? "https://qmax-realty.vercel.app/socials"
            : `https://qmax-realty.vercel.app/${l}/socials`,
        ])
      ),
    },
    openGraph: {
      title: `${t("title")} - QMAX Realty`,
      description: t("description"),
      url: canonical,
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

function SimpleIcon({
  path,
  className = "h-6 w-6",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={path}/>
    </svg>
  );
}

export default async function SocialsPage() {
  const t = await getTranslations("Pages.Socials");

  const contactCards = [
    {
      key: "email",
      label: CONTACT_INFO.email.display,
      href: CONTACT_INFO.email.href,
      icon: <Mail className="h-5 w-5 shrink-0" aria-hidden="true"/>,
    },
    {
      key: "phone",
      label: CONTACT_INFO.phone.display,
      href: CONTACT_INFO.phone.href,
      icon: <Phone className="h-5 w-5 shrink-0" aria-hidden="true"/>,
    },
    {
      key: "whatsapp",
      label: CONTACT_INFO.whatsapp.display,
      href: CONTACT_INFO.whatsapp.href,
      external: true,
      icon: <SimpleIcon path={siWhatsapp.path} className="h-5 w-5 shrink-0"/>,
    },
    {
      key: "telegram",
      label: CONTACT_INFO.telegram.display,
      href: CONTACT_INFO.telegram.href,
      external: true,
      icon: <SimpleIcon path={siTelegram.path} className="h-5 w-5 shrink-0"/>,
    },
  ];

  return (
    <main className="bg-white dark:bg-gray-900">
      <section
        aria-labelledby="socials-hero-heading"
        className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-800 text-white"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"/>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-brand-50 uppercase">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-200"/>
            QMAX Realty
          </span>
          <h1 id="socials-hero-heading" className="mt-5 text-h1 font-bold text-balance">
            {t("Hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-50/90 md:text-lg">
            {t("Hero.subtitle")}
          </p>
        </div>
      </section>

      <section aria-labelledby="socials-grid-heading" className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <h2 id="socials-grid-heading" className="sr-only">
            {t("Hero.title")}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {SOCIAL_MEDIAS.map((s, index) => (
              <article
                key={s.key}
                className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br ${s.gradient} p-6 text-white shadow-lg ring-1 ring-white/20 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-2xl md:p-8 ${
                  index === 0 ? "md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent"
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/10"/>
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        >
                          <path d={s.icon.path}/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold">{s.name}</h3>
                        <p className="truncate text-sm text-white/85">{s.handle}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                      {t(`SocialCards.${s.key}.tagline`)}
                    </span>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-white/90">
                    {t(`SocialCards.${s.key}.description`)}
                  </p>
                </div>

                <div className="relative flex items-center justify-end border-t border-white/20 pt-4">
                  <a
                    href={s.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.name} ${t(`SocialCards.${s.key}.cta_text`)} (new tab)`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 text-sm font-bold text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {t(`SocialCards.${s.key}.cta_text`)}
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true"/>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="socials-contact-heading" className="bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 md:py-20">
          <h2 id="socials-contact-heading" className="text-h2 font-bold text-gray-900 dark:text-white">
            {t("GetInTouch.title")}
          </h2>
          <p className="mx-auto mt-4 mb-8 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
            {t("GetInTouch.subtitle")}
          </p>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {contactCards.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 font-medium text-gray-800 shadow-sm transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  {item.icon}
                </span>
                <span className="truncate text-sm font-semibold">{item.label}</span>
              </a>
            ))}
            <a
              href={CONTACT_INFO.address.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 font-medium text-gray-800 shadow-sm transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                <MapPin className="h-5 w-5 shrink-0" aria-hidden="true"/>
              </span>
              <span className="text-sm font-semibold">{CONTACT_INFO.address.display}</span>
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="socials-newsletter-heading" className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <div className="rounded-3xl border border-brand-700 bg-brand-800 px-6 py-12 text-center shadow-xl md:p-14">
            <h2 id="socials-newsletter-heading" className="text-h2 font-bold text-white">
              {t("StayUpdated.title")}
            </h2>
            <p className="mx-auto mt-4 mb-8 max-w-2xl text-base leading-relaxed text-brand-50/90 md:text-lg">
              {t("StayUpdated.subtitle")}
            </p>
            <NewsletterForm/>
          </div>
        </div>
      </section>
    </main>
  );
}
