import Image from "next/image";
import Link from "next/link";
import PropertiesCarousel from "@/components/PropertiesCarousel";
import { getActiveProperties } from "@/lib/db";
import { PrimaryButton, PrimaryButtonRounded, SecondaryButton } from "@/components/ui/Buttons";

import {
  Home,
  Key,
  BadgeDollarSign,
  Building2,
  Star,
  Handshake,
  ShieldCheck,
} from "lucide-react";

// Update or load from process.env.NEXT_PUBLIC_CONTACT_PHONE if needed
const CONTACT_PHONE = "+905550000000";

const whyUsItems = [
  {
    icon: Building2,
    title: "Market Experts",
    hasStar: false,
    desc: "Deep knowledge of local real estate markets, trends, and investment opportunities.",
  },
  {
    icon: Star,
    title: "5 Service",
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
        className="relative w-full h-[68vh] md:h-[72vh]"
        aria-label="Featured properties slideshow"
      >
        <div className="relative w-full h-full">
          <Image
            src="/img/hero.webp"
            alt="Premium real estate properties with stunning views"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col md:py-24 pt-16 text-center">
            <div className="w-4/5 mx-auto text-white mb-6 h-full flex flex-col items-center justify-end">
              <h1 className="text-3xl md:text-5xl font-bold mb-2">
                Find Your Dream Property!
              </h1>
              <p className="text-base md:text-lg max-w-2xl mx-auto mb-6">
                Discover premium real estate with expert guidance and unmatched service
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center">
              <PrimaryButtonRounded
                label="Buy Properties"
                icon={<Home className="w-3 h-3 md:w-5 md:h-5" aria-hidden="true" />}
                href="/listings?offer=sale"
              />
              <PrimaryButtonRounded
                label="Rent Properties"
                icon={<Key className="w-3 h-3 md:w-5 md:h-5" aria-hidden="true" />}
                href="/listings?offer=rent"
              />
              <PrimaryButtonRounded
                label="Sell Your Home"
                icon={<BadgeDollarSign className="w-3 h-3 md:w-5 md:h-5" aria-hidden="true" />}
                href="/contact?subject=selling"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Properties Carousel Section */}
      <PropertiesCarousel properties={properties} />

      {/* Why Choose Us Section */}
      <section className="section"
        aria-labelledby="why-us-heading"
      >
        <div className="text-center mb-12">
          <h2
            id="why-us-heading"
            className="text-3xl md:text-4xl font-bold text-gray-800 mb-12"
          >
            Why Choose QMAX Realty?
          </h2>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-emerald-600">15+</p>
              <p className="text-sm md:text-base font-medium text-gray-600 mt-1">
                Years of Excellence
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-emerald-600">1,200+</p>
              <p className="text-sm md:text-base font-medium text-gray-600 mt-1">
                Properties Sold
              </p>
            </div>
            <div className="text-center max-md:col-span-2">
              <p className="text-3xl md:text-4xl font-black text-emerald-600">99%</p>
              <p className="text-sm md:text-base font-medium text-gray-600 mt-1">
                Client Satisfaction
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {whyUsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-emerald-600" aria-hidden="true" />
                </div>
                <h3 className="text-xs md:text-base lg:text-xl font-semibold text-gray-800 mb-2">
                  {item.title}
                  {item.hasStar && (
                    <Star
                      className="w-4 h-4 inline-block ml-1 align-text-bottom text-emerald-600"
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
      <section className="section">
        <div className="bg-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Find Your Dream Property?
          </h2>
          <p className="text-lg text-white/90 mb-6 max-w-xl mx-auto">
            Contact us now to schedule a viewing or get expert advice. We respond within the hour.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <SecondaryButton
              label="WhatsApp Us"
              href={`https://wa.me/${CONTACT_PHONE}?text=Hello!%20I'd%20like%20to%20inquire%20about%20properties.`}
              icon={
                    <Image
                      src="/img/Logos/si-whatsapp.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
              }
            />
            <PrimaryButton
              label="View All Properties"
              href="/listings"
            />
          </div>
        </div>
      </section>
      </>
  );
}