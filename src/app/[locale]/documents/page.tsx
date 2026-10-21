import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import DocumentsContent from "@/components/DocumentsContent";
import { Button, SecondaryButton } from "@/components/ui/Buttons";
import { CONTACT_INFO } from "@/config/contact";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://qmax-realty.vercel.app";

function localizedDocumentsUrl(locale: string): string {
  return locale === "en" ? `${BASE_URL}/documents` : `${BASE_URL}/${locale}/documents`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages.Documents.Metadata" });
  const canonical = localizedDocumentsUrl(locale);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      languages: Object.fromEntries(routing.locales.map((l) => [l, localizedDocumentsUrl(l)])),
    },
    openGraph: {
      title: `${t("title")} - QMAX Realty`,
      description: t("description"),
      url: canonical,
      images: [
        {
          url: `${BASE_URL}/img/og-image.webp`,
          width: 1200,
          height: 630,
          alt: t("og_alt"),
          type: "image/webp",
        },
      ],
    },
  };
}

export default async function DocumentsPage() {
  const t = await getTranslations("Pages.Documents");

  return (
    <>
      <section
        aria-labelledby="documents-hero-heading"
        className="from-brand-700 via-brand-800 to-brand-800 relative overflow-hidden
          bg-gradient-to-br text-white"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"/>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 md:py-20">
          <h1 id="documents-hero-heading" className="text-h1 font-bold text-balance">
            {t("Hero.title")}
          </h1>
          <p
            className="text-brand-50/90 mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
          >
            {t("Hero.subtitle")}
          </p>
          <div className="mt-8 flex justify-center">
            <SecondaryButton
              label={t("Hero.whatsapp")}
              href={CONTACT_INFO.whatsapp.href}
              size="lg"
              className="min-h-[44px] border-white"
              icon={<Image src="/img/Logos/si-whatsapp.svg" alt="" width={20} height={20}/>}
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="documents-services-heading"
        className="bg-gray-50 py-12 md:py-20 dark:bg-gray-800"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="documents-services-heading" className="sr-only">
            {t("Tabs.aria_label")}
          </h2>
          <DocumentsContent/>
        </div>
      </section>

      <section
        aria-labelledby="documents-cta-heading"
        className="bg-white py-12 md:py-20 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="border-brand-700 bg-brand-800 relative overflow-hidden rounded-3xl border
              px-6 py-10 shadow-xl sm:px-10 md:p-14"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div
                className="bg-brand-500/20 absolute -top-20 -right-20 h-72 w-72 rounded-full
                  blur-3xl"
              />
              <div
                className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-400/10
                  blur-3xl"
              />
            </div>
            <div className="relative flex flex-col items-center gap-8 text-center">
              <h2
                id="documents-cta-heading"
                className="text-h2 max-w-3xl font-bold text-balance text-white"
              >
                {t("Cta.title")}
              </h2>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <SecondaryButton
                  label={t("Cta.whatsapp")}
                  href={CONTACT_INFO.whatsapp.href}
                  size="lg"
                  className="min-h-[44px] border-white sm:w-auto"
                  icon={<Image src="/img/Logos/si-whatsapp.svg" alt="" width={20} height={20}/>}
                />
                <Button
                  variant="tertiary"
                  size="lg"
                  href="/contact"
                  label={t("Cta.contact")}
                  className="min-h-[44px] border-2 border-white/30 sm:w-auto"
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
