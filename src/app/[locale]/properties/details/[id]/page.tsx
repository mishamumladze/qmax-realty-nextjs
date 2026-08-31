import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  MessageCircle,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Home,
  Calendar,
  Building,
  Car,
  ChevronRight,
} from "lucide-react";
import { getActiveProperties, getPropertyById } from "@/lib/db";
import { CONTACT_INFO } from "@/config/contact";
import PropertyGallery from "@/components/PropertyGallery";

export async function generateStaticParams() {
  const properties = getActiveProperties();
  return properties.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("Pages.PropertyDetails.Metadata");
  const locale = await getLocale();
  const property = getPropertyById(Number(id), locale);
  if (!property) return { title: t("not_found") };

  const metaDesc =
    property.meta_description ||
    [
      property.title,
      property.subtitle,
      property.location || property.city || t("premium"),
      property.sale_type ? t("for_sale_type", { sale_type: property.sale_type }) : "",
      property.sqmt ? t("sqmt", { sqmt: property.sqmt }) : "",
      property.bedrooms ? t("bedrooms_count", { bedrooms: property.bedrooms }) : "",
    ]
      .filter(Boolean)
      .join(". ");

  return {
    title: `${property.title} - QMAX Realty`,
    description: metaDesc,
  };
}

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("Pages.PropertyDetails");
  const locale = await getLocale();
  const property = getPropertyById(Number(id), locale);

  if (!property) {
    notFound();
  }

  const imageSrc = property.card_image || "/img/placeholder_1.webp";
  const whatsappUrl =
    CONTACT_INFO.whatsapp.href +
    encodeURIComponent(` ${t("Sidebar.whatsapp_prefill", { title: property.title })}`);

  const currency = property.currency || "USD";

  const parseJsonArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const gallery = parseJsonArray(property.gallery);
  const inclusions = parseJsonArray(property.inclusions);
  const priceFormatted =
    property.price != null
      ? `${currency === "USD" ? "$" : currency + " "}${property.price.toLocaleString()}`
      : null;

  return (
    <>
      {/* Fixed Navigation */}
      <section
        className="z-40 border-b border-gray-200 bg-white/80 px-4 py-4 dark:border-gray-800
          dark:bg-gray-900/80"
      >
        <div className="mx-auto max-w-6xl">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600
              transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Details.back_to_listings")}
          </Link>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative h-screen max-h-[600px] w-full overflow-hidden bg-gray-900">
        <Image src={imageSrc} alt={property.title} fill className="object-cover" priority />
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"
        />

        {/* Hero Content */}
        <div className="absolute right-0 bottom-0 left-0 px-4 pb-8 sm:pb-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
              <span>{property.type || t("Fallback.property")}</span>
              {property.region && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span>{property.region}</span>
                </>
              )}
              {property.city && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span>{property.city}</span>
                </>
              )}
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              {property.title}
            </h1>
            {property.subtitle && (
              <p className="mb-4 text-base text-gray-200 md:text-lg">{property.subtitle}</p>
            )}
            {priceFormatted && (
              <p className="text-2xl font-bold text-white md:text-3xl">{priceFormatted}</p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white px-4 py-12 sm:py-16 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main Content Area */}
            <div className="space-y-8 lg:col-span-2">
              {/* Sale Type Badge */}
              {property.sale_type && (
                <div className="flex gap-2">
                  <span
                    className="bg-brand-100 text-brand-900 dark:bg-brand-900/30 dark:text-brand-300
                      inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    {property.sale_type}
                  </span>
                </div>
              )}

              {/* Gallery */}
              {gallery.length > 0 && (
                <PropertyGallery images={gallery} propertyTitle={property.title} />
              )}

              {/* Location */}
              {(property.neighborhood || property.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-gray-400 dark:text-gray-600" />
                  <div>
                    <h2
                      className="mb-2 text-xl font-semibold text-gray-600 md:text-2xl
                        dark:text-gray-400"
                    >
                      {t("Details.location")}
                    </h2>
                    <p className="text-base text-gray-900 md:text-lg dark:text-white">
                      {[
                        property.neighborhood,
                        property.city,
                        property.region,
                        t("Fallback.country"),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Key Features Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <h3 className="sr-only">{t("Details.key_features")}</h3>
                {property.rooms != null && (
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <Home className="mb-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {property.rooms}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t("Details.rooms")}</p>
                  </div>
                )}
                {property.bedrooms != null && (
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <Bed className="mb-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {property.bedrooms}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("Details.bedrooms")}
                    </p>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <Bath className="mb-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {property.bathrooms}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("Details.bathrooms")}
                    </p>
                  </div>
                )}
                {property.sqmt != null && (
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <Maximize className="mb-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {property.sqmt.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t("Details.sqm")}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
                    {t("Details.about")}
                  </h2>
                  <p
                    className="text-base leading-relaxed whitespace-pre-line text-gray-700
                      md:text-lg dark:text-gray-300"
                  >
                    {property.description}
                  </p>
                </div>
              )}

              {/* Additional Details */}
              <div>
                <h2
                  className="mb-4 text-2xl font-semibold text-gray-900 md:text-3xl dark:text-white"
                >
                  {t("Details.additional")}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.year_built && (
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <Calendar className="mb-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("Facts.year_built")}
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {property.year_built}
                      </p>
                    </div>
                  )}
                  {property.floor != null && (
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <Building className="mb-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t("Facts.floor")}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {property.floor}
                      </p>
                    </div>
                  )}
                  {property.parking != null && (
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <Car className="mb-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("Facts.parking")}
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {property.parking ? t("Facts.available") : t("Facts.none")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Floor Plan */}
              {property.floor_plan && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
                    {t("Details.floor_plan")}
                  </h2>
                  <div
                    className="relative aspect-square w-full max-w-lg overflow-hidden rounded-2xl
                      border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Image
                      src={property.floor_plan}
                      alt={t("Alts.floor_plan", { title: property.title })}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                </div>
              )}

              {/* Inclusions */}
              {inclusions.length > 0 && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
                    {t("Details.included")}
                  </h2>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-brand-500 mt-1 h-2 w-2 shrink-0 rounded-full" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div
                className="sticky top-32 space-y-4 rounded-2xl border border-gray-200 bg-white p-6
                  dark:border-gray-700 dark:bg-gray-800"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("Sidebar.title")}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("Sidebar.description")}
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600
                    px-4 py-3 font-semibold text-white transition-all hover:bg-green-700
                    hover:shadow-lg active:scale-95"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t("Sidebar.whatsapp")}
                </a>
                <button
                  className="w-full cursor-pointer rounded-xl border-2 border-gray-200 px-4 py-3
                    font-semibold text-gray-900 transition-all hover:bg-gray-50 active:scale-95
                    dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                >
                  {t("Sidebar.viewing")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
