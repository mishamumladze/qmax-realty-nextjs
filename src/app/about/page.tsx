// app/about/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { 
  Award, Building2, BadgeCheck, Trophy,
  MapPin, Globe, ShieldCheck, Handshake, Clock,
  House, KeyRound, TrendingUp
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
      <section className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16 md:py-24 overflow-hidden">
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About QMAX Realty</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            Your trusted partner for buying, selling, and renting premium property
            worldwide.
          </p>
        </div>
      </section>

        {/* Our Story */}
        <section className="section grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/img/hero.webp"
              alt="Premium properties with QMAX Realty"
              className="w-full h-72 md:h-[420px] object-cover"
              width={4449}
              height={2965}
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4 text-justify">
              QMAX Realty is an international real estate agency built on a simple
              promise: honest guidance, transparent deals, and a genuine understanding
              of the local market. From historic Old Town apartments to modern luxury
              penthouses, we help buyers, sellers, and investors navigate property
              markets with confidence.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6 text-justify">
              Whether you're searching for your first home in the city or expanding an
              investment portfolio, our team combines local knowledge with international
              standards of service - and we speak your language.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/listings"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-center"
              >
                Browse Properties
              </Link>
              <Link
                href="/contact"
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-center"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="section grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 text-center"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </section>

        {/* What We Do */}
        <section className="section text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">What We Do</h2>
          <p className="text-gray-600 mb-8">
            Full-cycle support across every stage of your property journey.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-100 text-center"
                >
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{service.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="section bg-gray-50 rounded-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Why Choose QMAX Realty
          </h2>
          <p className="text-gray-600 mb-10 text-center">What sets us apart.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
            {WHY_CHOOSE_US.map((reason) => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.title}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3 text-center">
                    <div className="flex items-center w-full justify-center">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-emerald-600"/>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-center ml-4">{reason.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {reason.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="section bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to Find Your Property?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Talk to our team today and let us help you make the right move.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Chat on WhatsApp
            </a>
            <Link
              href="/contact"
              className="border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Contact Us
            </Link>
          </div>
        </section>
    </>
  );
}