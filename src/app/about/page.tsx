// app/about/page.tsx
import { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "About QMAX Realty - Trusted International Real Estate Agency",
  description:
    "Learn about QMAX Realty - an international real estate agency. Expert guidance for buying, selling, and renting premium property.",
};

// Stats data - unified across pages
const STATS = [
  { value: "15+", label: "Years of Excellence", icon: Award },
  { value: "1,200+", label: "Properties Sold", icon: Building2 },
  { value: "99%", label: "Client Satisfaction", icon: BadgeCheck },
];

const SERVICES = [
  {
    icon: House,
    title: "Buying",
    text: "Carefully selected listings matched to your budget, lifestyle, and investment goals.",
  },
  {
    icon: KeyRound,
    title: "Selling",
    text: "Accurate valuations, professional photography, and targeted marketing to sell faster.",
  },
  {
    icon: Building2,
    title: "Renting",
    text: "Verified rental properties with clear contracts and reliable long-term tenancy support.",
  },
  {
    icon: TrendingUp,
    title: "Investing",
    text: "Market research and yield analysis to help you make confident investment decisions.",
  },
];

const WHY_CHOOSE_US = [
  {
    icon: MapPin,
    title: "Local Expertise",
    text: "Deep knowledge of Tbilisi neighborhoods - from Sololaki to Vake and beyond.",
  },
  {
    icon: Globe,
    title: "Multilingual Team",
    text: "We work with international clients in English, Russian, and Georgian.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent Deals",
    text: "Clear contracts, verified documentation, and no hidden fees.",
  },
  {
    icon: Handshake,
    title: "Personal Service",
    text: "A dedicated agent who knows your needs and stays with you start to finish.",
  },
  {
    icon: Clock,
    title: "Fast Response",
    text: "Questions answered within hours, viewings arranged at your convenience.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Listings",
    text: "Every property is checked and represented honestly - what you see is what you get.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="from-brand-600 to-brand-700 dark:from-brand-700 dark:to-brand-800 relative
          overflow-hidden bg-gradient-to-r py-16 text-white md:py-24"
      >
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">About QMAX Realty</h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl">
            Your trusted partner for buying, selling, and renting premium property worldwide.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="section grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <img
            src="/img/hero.webp"
            alt="Premium properties with QMAX Realty"
            className="h-72 w-full object-cover md:h-[420px]"
            width={4449}
            height={2965}
          />
        </div>
        <div>
          <h2 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">Our Story</h2>
          <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-300">
            QMAX Realty is an international real estate agency built on a simple promise: honest
            guidance, transparent deals, and a genuine understanding of the local market. From
            historic Old Town apartments to modern luxury penthouses, we help buyers, sellers, and
            investors navigate property markets with confidence.
          </p>
          <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-300">
            Whether you're searching for your first home in the city or expanding an investment
            portfolio, our team combines local knowledge with international standards of service -
            and we speak your language.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/listings"
              className="bg-brand-600 hover:bg-brand-700 rounded-lg px-6 py-3 text-center
                font-semibold text-white transition-colors duration-200"
            >
              Browse Properties
            </Link>
            <Link
              href="/contact"
              className="border-brand-600 text-brand-600 hover:bg-brand-50 rounded-lg border-2 px-6
                py-3 text-center font-semibold transition-colors duration-200"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section grid grid-cols-2 gap-6 text-center md:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm
                transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div
                className="bg-brand-50 dark:bg-brand-900/40 mx-auto mb-3 flex h-12 w-12 items-center
                  justify-center rounded-xl"
              >
                <Icon className="text-brand-600 dark:text-brand-400 h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* What We Do */}
      <section className="section text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">What We Do</h2>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          Full-cycle support across every stage of your property journey.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm
                  transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div
                  className="bg-brand-50 dark:bg-brand-900/40 mx-auto mb-3 flex h-12 w-12
                    items-center justify-center rounded-xl"
                >
                  <Icon className="text-brand-600 dark:text-brand-400 h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {service.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section rounded-2xl bg-gray-50 text-center dark:bg-gray-900">
        <h2 className="mb-2 text-center text-3xl font-bold text-gray-800 dark:text-white">
          Why Choose QMAX Realty
        </h2>
        <p className="mb-10 text-center text-gray-600 dark:text-gray-300">What sets us apart.</p>
        <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE_US.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.title}
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
                    <h3 className="text-center font-semibold text-gray-800 dark:text-white">
                      {reason.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {reason.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section
        className="section from-brand-600 to-brand-700 bg-gradient-to-r text-center text-white"
      >
        <h2 className="mb-3 text-3xl font-bold">Ready to Find Your Property?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg">
          Talk to our team today and let us help you make the right move.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href={CONTACT_INFO.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 hover:bg-brand-50 rounded-lg bg-white px-6 py-3 font-semibold
              transition-colors duration-200"
          >
            Chat on WhatsApp
          </a>
          <Link
            href="/contact"
            className="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white
              transition-colors duration-200 hover:bg-white/10"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
