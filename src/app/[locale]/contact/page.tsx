import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { PrimaryButton, SecondaryButtonTransparent } from "@/components/ui/Buttons";
import { CONTACT_INFO } from "@/config/contact";
import ContactForm from "@/components/ContactForm";

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

  return (
    <>
      {/* Hero */}
      <section
        className="from-brand-600 to-brand-700 dark:from-brand-700 dark:to-brand-800 relative
          overflow-hidden bg-gradient-to-r py-16 text-white md:py-24"
      >
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t("Hero.title")}</h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl">{t("Hero.subtitle")}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Email */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className="bg-brand-100 dark:bg-brand-900/40 flex h-12 w-12 items-center
                      justify-center rounded-lg"
                  >
                    <Mail className="text-brand-600 dark:text-brand-400 h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {t("Channels.email")}
                  </h3>
                  <a
                    href="mailto:info@qmaxrealty.ge"
                    className="text-brand-700 hover:text-brand-800"
                  >
                    info@qmaxrealty.ge
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className="bg-brand-100 dark:bg-brand-900/40 flex h-12 w-12 items-center
                      justify-center rounded-lg"
                  >
                    <Phone className="text-brand-600 dark:text-brand-400 h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {t("Channels.phone")}
                  </h3>
                  <a href={CONTACT_INFO.phone.href} className="text-brand-700 hover:text-brand-800">
                    {CONTACT_INFO.phone.display}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className="bg-brand-100 dark:bg-brand-900/40 flex h-12 w-12 items-center
                      justify-center rounded-lg"
                  >
                    <MessageCircle className="text-brand-600 dark:text-brand-400 h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {t("Channels.whatsapp")}
                  </h3>
                  <a
                    href={CONTACT_INFO.whatsapp.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 hover:text-brand-800"
                  >
                    {CONTACT_INFO.phone.display}
                  </a>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t("Channels.availability")}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className="bg-brand-100 dark:bg-brand-900/40 flex h-12 w-12 items-center
                      justify-center rounded-lg"
                  >
                    <MapPin className="text-brand-600 dark:text-brand-400 h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {t("Channels.office")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{CONTACT_INFO.address.display}</p>
                </div>
              </div>

              {/* CTA Card */}
              <div
                className="bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800
                  mt-8 rounded-2xl border p-6"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {t("WhatsappCard.title")}
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  {t("WhatsappCard.description")}
                </p>
                <a
                  href={CONTACT_INFO.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2
                    rounded-lg px-4 py-2 font-semibold text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("WhatsappCard.btn")}
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm initialSubject={subject} />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section
        className="bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 border-t
          py-12"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            {t("ReadyCta.title")}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
            {t("ReadyCta.subtitle")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <PrimaryButton label={t("Buttons.browse")} href="/listings" />
            <SecondaryButtonTransparent
              label={t("Buttons.whatsapp")}
              href={CONTACT_INFO.whatsapp.href}
            />
          </div>
        </div>
      </section>
    </>
  );
}
