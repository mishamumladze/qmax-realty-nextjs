import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import { PrimaryButton } from "@/components/ui/Buttons";
import { CONTACT_INFO } from "@/config/contact";
import ContactForm from "@/components/ContactForm";
import OfficeMap from "@/components/OfficeMap";
import { TrackedWhatsAppAnchor, TrackedWhatsAppButton } from "@/components/TrackedWhatsApp";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Contact.Metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

interface ContactPageProps {
  searchParams: Promise<{
    subject?: string;
  }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const subject = params.subject || "";
  const t = await getTranslations("Pages.Contact");
  const tFooter = await getTranslations("Components.Footer");

  return (
    <>
      {/* Hero — unified with About */}
      <section
        aria-labelledby="contact-hero-heading"
        className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800
          to-brand-800 text-white"
      >
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
          <h1 id="contact-hero-heading" className="mt-5 text-h1 font-bold text-balance">
            {t("Hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-50/90 md:text-lg">
            {t("Hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Main — info sidebar + form */}
      <section
        aria-labelledby="contact-info-heading"
        className="bg-white py-12 md:py-20 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="contact-info-heading" className="sr-only">
            {t("Hero.title")}
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Contact Info sidebar */}
            <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {/* Email */}
                <div
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm
                    dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                        bg-brand-50 dark:bg-brand-900/40"
                    >
                      <Mail
                        className="h-6 w-6 text-brand-700 dark:text-brand-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {t("Channels.email")}
                      </h3>
                      <a
                        href={CONTACT_INFO.email.href}
                        aria-label={`${t("Channels.email")}: ${CONTACT_INFO.email.display}`}
                        className="inline-flex min-h-[44px] items-center text-brand-700
                          hover:underline dark:text-brand-300"
                      >
                        {CONTACT_INFO.email.display}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm
                    dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                        bg-brand-50 dark:bg-brand-900/40"
                    >
                      <Phone
                        className="h-6 w-6 text-brand-700 dark:text-brand-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {t("Channels.phone")}
                      </h3>
                      <a
                        href={CONTACT_INFO.phone.href}
                        aria-label={`${t("Channels.phone")}: ${CONTACT_INFO.phone.display}`}
                        className="inline-flex min-h-[44px] items-center text-brand-700
                          hover:underline dark:text-brand-300"
                      >
                        {CONTACT_INFO.phone.display}
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm
                    dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                        bg-brand-50 dark:bg-brand-900/40"
                    >
                      <MessageCircle
                        className="h-6 w-6 text-brand-700 dark:text-brand-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {t("Channels.whatsapp")}
                      </h3>
                      <TrackedWhatsAppAnchor
                        href={CONTACT_INFO.whatsapp.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t("Channels.whatsapp")}: ${CONTACT_INFO.phone.display}`}
                        className="inline-flex min-h-[44px] items-center text-brand-700
                          hover:underline dark:text-brand-300"
                      >
                        {CONTACT_INFO.phone.display}
                      </TrackedWhatsAppAnchor>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t("Channels.availability")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Telegram */}
                <div
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm
                    dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                        bg-brand-50 dark:bg-brand-900/40"
                    >
                      <Send
                        className="h-6 w-6 text-brand-700 dark:text-brand-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {CONTACT_INFO.telegram.display}
                      </h3>
                      <a
                        href={CONTACT_INFO.telegram.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${CONTACT_INFO.telegram.display}: ${CONTACT_INFO.telegram.href}`}
                        className="inline-flex min-h-[44px] items-center text-brand-700
                          hover:underline dark:text-brand-300"
                      >
                        t.me/qmaxrealty
                      </a>
                    </div>
                  </div>
                </div>

                {/* Office */}
                <div
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm
                    dark:border-gray-700 dark:bg-gray-800 sm:col-span-2 lg:col-span-1"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                        bg-brand-50 dark:bg-brand-900/40"
                    >
                      <MapPin
                        className="h-6 w-6 text-brand-700 dark:text-brand-300"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {t("Channels.office")}
                      </h3>
                      <a
                        href={CONTACT_INFO.address.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t("Channels.office")}: ${CONTACT_INFO.address.display}`}
                        className="inline-flex min-h-[44px] items-center text-brand-700
                          hover:underline dark:text-brand-300"
                      >
                        {CONTACT_INFO.address.display}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA card */}
              <div
                className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-6
                  dark:border-brand-800 dark:bg-brand-900/40"
              >
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("WhatsappCard.title")}
                </h3>
                <p className="mt-1 mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t("WhatsappCard.description")}
                </p>
                <TrackedWhatsAppButton
                  variant="primary"
                  label={t("WhatsappCard.btn")}
                  href={CONTACT_INFO.whatsapp.href}
                  size="lg"
                  className="w-full min-h-[44px] sm:w-auto"
                  icon={<MessageCircle className="h-4 w-4" aria-hidden="true"/>}
                />
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <ContactForm initialSubject={subject}/>
            </div>
          </div>
        </div>
      </section>

      {/* Map — gray band */}
      <section
        aria-labelledby="contact-map-heading"
        className="border-y border-gray-100 bg-gray-50 pb-12 md:pb-20 dark:border-gray-700
          dark:bg-gray-800"
      >
        <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 md:pt-20">
          <div className="mb-6 max-w-2xl md:mb-8">
            <h2
              id="contact-map-heading"
              className="text-h2 font-bold text-gray-900 text-balance dark:text-white"
            >
              {t("Channels.office")}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
              {CONTACT_INFO.address.display}
            </p>
          </div>
          <OfficeMap title={CONTACT_INFO.address.display}/>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {CONTACT_INFO.address.display}
            </p>
            <a
              href={CONTACT_INFO.address.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold
                text-brand-700 hover:underline dark:text-brand-300"
            >
              <MapPin className="h-4 w-4" aria-hidden="true"/>
              {tFooter("map_directions")}
            </a>
          </div>
        </div>
      </section>

      {/* CTA — brand-800 card like About */}
      <section
        aria-labelledby="contact-cta-heading"
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
                <h2 id="contact-cta-heading" className="mt-4 text-h2 font-bold text-white text-balance">
                  {t("ReadyCta.title")}
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-brand-50/85 md:text-lg">
                  {t("ReadyCta.subtitle")}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                <PrimaryButton
                  label={t("Buttons.browse")}
                  href="/listings"
                  size="lg"
                  className="w-full min-h-[44px] sm:w-auto lg:w-full"
                />
                <TrackedWhatsAppButton
                  variant="secondary"
                  label={t("Buttons.whatsapp")}
                  href={CONTACT_INFO.whatsapp.href}
                  size="lg"
                  className="w-full min-h-[44px] border-white sm:w-auto lg:w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
