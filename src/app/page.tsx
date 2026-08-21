import Image from "next/image";
import Link from "next/link";
import PropertiesCarousel from "@/components/PropertiesCarousel";
import { getActiveProperties } from "@/lib/db";
import { PrimaryButton, PrimaryButtonRounded, SecondaryButton } from "@/components/ui/Buttons";
import { CONTACT_INFO } from "@/config/contact";

import { Home, Key, BadgeDollarSign, Building2, Star, Handshake, ShieldCheck } from "lucide-react";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Your Dream Property - QMAX Realty",
  description:
    "Discover premium real estate with expert guidance and unmatched service. Buy, sell, or rent properties in Georgia.",
  openGraph: {
    title: "Find Your Dream Property - QMAX Realty",
    description: "Discover premium real estate with expert guidance and unmatched service.",
    images: [
      {
        url: "/img/placeholder_1.webp", // Hero image, 1200x630px
        width: 1200,
        height: 630,
        alt: "Premium Properties - QMAX Realty",
      },
    ],
  },
};

const whyUsItems = [
  {
    icon: Building2,
    title: "Market Experts",
    hasStar: false,
    desc: "Deep knowledge of local real estate markets, trends, and investment opportunities.",
  },
  {
    icon: Star,
    title: "5-Star Service",
    hasStar: true,
    desc: "Hundreds of 5-star reviews from satisfied buyers, sellers, and investors.",
  },
  {
    icon: Handshake,
    title: "Personalized Approach",
    hasStar: false,
    desc: "Tailored solutions and one-on-one guidance for your unique real estate needs.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted & Transparent",
    hasStar: false,
    desc: "Clear communication, ethical practices, and full support throughout your transaction.",
  },
];

export default async function HomePage() {
  const properties = getActiveProperties().slice(0, 6);

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative h-[68vh] w-full md:h-[72vh]"
        aria-label="Featured properties slideshow"
      >
        <div className="relative h-full w-full">
          <Image
            src="/img/hero.webp"
            alt="Premium real estate properties with stunning views"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_35%]"
          />
          <div
            className="absolute inset-0 flex flex-col bg-gradient-to-t from-black/80 via-black/40
              to-transparent pt-16 text-center md:py-24"
          >
            <div
              className="mx-auto mb-6 flex h-full w-4/5 flex-col items-center justify-end
                text-white"
            >
              <h1 className="mb-2 text-3xl font-bold md:text-5xl">Find Your Dream Property!</h1>
              <p className="mx-auto mb-6 max-w-2xl text-base md:text-lg">
                Discover premium real estate with expert guidance and unmatched service
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center">
              <PrimaryButtonRounded
                label="Buy Properties"
                icon={<Home className="h-3 w-3 md:h-5 md:w-5" aria-hidden="true" />}
                href="/listings?offer=sale"
              />
              <PrimaryButtonRounded
                label="Rent Properties"
                icon={<Key className="h-3 w-3 md:h-5 md:w-5" aria-hidden="true" />}
                href="/listings?offer=rent"
              />
              <PrimaryButtonRounded
                label="Sell Your Home"
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
            Why Choose QMAX Realty?
          </h2>

          {/* Stats Grid */}
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-3">
            <div className="text-center">
              <p className="text-brand-600 dark:text-brand-400 text-3xl font-black md:text-4xl">
                15+
              </p>
              <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                Years of Excellence
              </p>
            </div>
            <div className="text-center">
              <p className="text-brand-600 dark:text-brand-400 text-3xl font-black md:text-4xl">
                1,200+
              </p>
              <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                Properties Sold
              </p>
            </div>
            <div className="text-center max-md:col-span-2">
              <p className="text-brand-600 dark:text-brand-400 text-3xl font-black md:text-4xl">
                99%
              </p>
              <p className="mt-1 text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
                Client Satisfaction
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
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Contact CTA Banner */}
      <section className="section dark:bg-gray-900">
        <div className="bg-brand-600 rounded-2xl p-8 text-center text-white md:p-12">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            Ready to Find Your Dream Property?
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-lg text-white">
            Contact us now to schedule a viewing or get expert advice. We respond within the hour.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <SecondaryButton
              label="WhatsApp Us"
              href={CONTACT_INFO.whatsapp.href}
              icon={<Image src="/img/Logos/si-whatsapp.svg" alt="" width={20} height={20} />}
            />
            <PrimaryButton label="View All Properties" href="/listings" />
          </div>
        </div>
      </section>
    </>
  );
}
