import Image from "next/image";
import Link from "next/link";
import { MapPin, Mail } from "lucide-react";
import ContactLinks from "./ContactLinks";
import { getTranslations } from "next-intl/server";

// Optional: Define props if you want dynamic data, or define fallback constants
interface FooterProps {
  contactPhone?: string;
  contactAddress?: string;
  contactEmail?: string;
  whatsappUrl?: string;
  telegramUrl?: string;
}

export default async function Footer({}: FooterProps) {
  const t = await getTranslations("Components.Footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="my-8 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo */}
          <div className="logo-container">
            <Link href="/" aria-label={t("home_aria")}>
              <Image
                src="/img/Light/Logo550.webp"
                alt="QMAX Realty Logo Light"
                width={550}
                height={550}
                className="block h-auto w-40 dark:hidden"
                priority={false}
              />
              <Image
                src="/img/Dark/Logo550.webp"
                alt="QMAX Realty Logo Dark"
                width={550}
                height={550}
                className="hidden h-auto w-40 dark:block"
                priority={false}
              />
            </Link>
          </div>

          {/* Contact Info */}
          <ContactLinks variant="list" only={["email", "phone", "address"]} />
          {/* Social Links */}
          <ContactLinks
            variant="icons-only"
            only={["whatsapp", "telegram"]}
            className="mt-4 md:mt-0"
          />
        </div>

        {/* Map */}
        <div className="map-container mt-8 mb-8">
          <iframe
            title={t("map_title")}
            src="https://www.google.com/maps?q=Rustaveli+Ave+12,+Tbilisi,+Georgia&output=embed"
            className="h-80 w-full rounded-lg border-0 dark:opacity-80 dark:contrast-125
              dark:hue-rotate-180 dark:invert dark:saturate-85 dark:filter"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500
            dark:border-gray-800 dark:text-gray-400"
        >
          <p>{t("copyright", { currentYear })}</p>{" "}
        </div>
      </div>
    </footer>
  );
}
