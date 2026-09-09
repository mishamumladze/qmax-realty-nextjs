import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  AirVent,
  ArrowLeft,
  ArrowUpDown,
  MessageCircle,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Home,
  Calendar,
  Building,
  Building2,
  Beef,
  BellRing,
  Briefcase,
  Car,
  ChevronRight,
  Droplets,
  Dumbbell,
  ExternalLink,
  Fence,
  Flame,
  FlameKindling,
  Heater,
  Package,
  PawPrint,
  Phone,
  PlugZap,
  ShowerHead,
  ShieldCheck,
  Sofa,
  Sparkles,
  Tv,
  Video,
  WavesLadder,
  Wifi,
  Zap,
} from "lucide-react";
import { getActiveProperties, getPropertyById } from "@/lib/db";
import { CONTACT_INFO } from "@/config/contact";
import PropertyGallery from "@/components/PropertyGallery";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";

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

  // Enum labels live under Pages.PropertyDetails.Options; resolve with
  // English fallback so metadata stays readable in every locale.
  const tDetails = (await getTranslations("Pages.PropertyDetails")) as unknown as (
    key: string
  ) => string;
  const tDetailsEn = (await getTranslations({
    locale: "en",
    namespace: "Pages.PropertyDetails",
  })) as unknown as (key: string) => string;
  const saleTypeKey = `Options.sale_type.${property.sale_type}`;
  let saleTypeLabel = property.sale_type ?? "";
  for (const translate of [tDetails, tDetailsEn]) {
    try {
      const v = translate(saleTypeKey);
      if (typeof v === "string" && v !== saleTypeKey && v.trim() !== "") {
        saleTypeLabel = v;
        break;
      }
    } catch {
      // Try the next locale.
    }
  }

  const metaDesc =
    property.meta_description ||
    [
      property.title,
      property.subtitle,
      property.location || property.city || t("premium"),
      property.sale_type ? t("for_sale_type", { sale_type: saleTypeLabel }) : "",
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
  const tEn = await getTranslations({ locale: "en", namespace: "Pages.PropertyDetails" });
  const tAdmin = await getTranslations("Components.Admin.PropertyFormModal");
  const locale = await getLocale();
  const property = getPropertyById(Number(id), locale);

  if (!property) {
    notFound();
  }

  const tLoose = t as unknown as (key: string) => string;
  const tEnLoose = tEn as unknown as (key: string) => string;
  const tAdminLoose = tAdmin as unknown as (key: string) => string;

  // pick: current-locale label with English fallback (existing t() calls stay untouched).
  const pick = (key: string): string => {
    for (const translate of [tLoose, tEnLoose]) {
      try {
        const v = translate(key);
        if (typeof v === "string" && v !== key && v.trim() !== "") return v;
      } catch {
        // Try the next locale.
      }
    }
    return key;
  };

  // opt: resolve Options.<path>.<raw> with English fallback, raw string as last resort.
  const opt = (path: string, raw: unknown): string => {
    if (raw === null || raw === undefined || raw === "") return "";
    const key = `Options.${path}.${String(raw)}`;
    const label = pick(key);
    return label !== key ? label : String(raw);
  };

  const AMENITY_ITEMS: { key: string; Icon: LucideIcon }[] = [
    { key: "swimming_pool", Icon: WavesLadder },
    { key: "sauna_jacuzzi", Icon: FlameKindling },
    { key: "gym", Icon: Dumbbell },
    { key: "private_yard", Icon: Fence },
    { key: "bbq_area", Icon: Beef },
    { key: "concierge", Icon: BellRing },
    { key: "fireplace", Icon: Flame },
    { key: "storage", Icon: Package },
    { key: "intercom", Icon: Video },
    { key: "pet_friendly", Icon: PawPrint },
    { key: "wheelchair_accessible", Icon: Accessibility },
    { key: "natural_gas", Icon: Flame },
    { key: "internet", Icon: Wifi },
    { key: "water_supply", Icon: Droplets },
    { key: "electricity", Icon: PlugZap },
    { key: "tv", Icon: Tv },
    { key: "sewerage", Icon: ShowerHead },
    { key: "elevator", Icon: ArrowUpDown },
    { key: "ac", Icon: AirVent },
    { key: "security", Icon: ShieldCheck },
  ];
  const propertyRecord = property as unknown as Record<string, unknown>;
  const isTruthyFlag = (v: unknown): boolean => v === true || v === 1 || v === "1" || v === "true";
  const activeAmenities = AMENITY_ITEMS.filter(({ key }) => isTruthyFlag(propertyRecord[key]));

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

  const tileClass =
    "rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800";
  const chipClass =
    "mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/40";
  const chipIconClass = "h-5 w-5 text-brand-700 dark:text-brand-300";
  const tileValueClass = "text-xl font-bold text-gray-900 dark:text-white";
  const tileLabelClass = "mt-0.5 text-sm text-gray-600 dark:text-gray-300";
  const sectionHeadingClass = "text-h2 font-bold text-balance text-gray-900 dark:text-white";

  return (
    <>
      {/* Back bar */}
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur md:top-16 dark:border-gray-700 dark:bg-gray-900/95">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            href="/listings"
            className="inline-flex min-h-[44px] items-center gap-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true"/>
            {t("Details.back_to_listings")}
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[52svh] w-full overflow-hidden bg-gray-900 sm:h-[60vh] lg:h-[68vh] lg:max-h-[600px]">
        <Image
          src={imageSrc}
          alt={property.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        />

        {/* Hero Content */}
        <div className="absolute right-0 bottom-0 left-0 px-4 pb-8 sm:px-6 sm:pb-12">
          <div className="mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb">
              <ol className="mb-3 flex flex-wrap items-center gap-2 text-sm font-medium text-gray-300">
                <li className="inline-flex items-center gap-2">
                  <span>{property.type ? opt("type", property.type) : t("Fallback.property")}</span>
                </li>
                {property.region && (
                  <li className="inline-flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" aria-hidden="true"/>
                    <span>{property.region}</span>
                  </li>
                )}
                {property.city && (
                  <li className="inline-flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" aria-hidden="true"/>
                    <span>{property.city}</span>
                  </li>
                )}
              </ol>
            </nav>
            <h1 className="text-h1 font-bold text-balance text-white">{property.title}</h1>
            {property.subtitle && (
              <p className="mt-3 max-w-2xl text-base text-white/90 md:text-lg">
                {property.subtitle}
              </p>
            )}
            {priceFormatted && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-2xl font-bold text-white md:text-3xl">
                  {priceFormatted}
                  {property.price_type === "per_sqm" && (
                    <span className="ml-2 text-base font-medium text-white/90">
                      / {pick("Details.per_sqm")}
                    </span>
                  )}
                </p>
                {property.price_type === "negotiable" && (
                  <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                    {pick("Details.negotiable")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white py-12 md:py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Main Content Area */}
            <div className="space-y-10 md:space-y-12 lg:col-span-2">
              {/* Sale Type Badge */}
              {property.sale_type && (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {opt("sale_type", property.sale_type)}
                  </span>
                </div>
              )}

              {/* Gallery */}
              {gallery.length > 0 && (
                <PropertyGallery images={gallery} propertyTitle={property.title}/>
              )}

              {/* Location */}
              {(property.neighborhood || property.city) && (
                <section aria-labelledby="property-location-heading">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/40">
                      <MapPin className="h-5 w-5 text-brand-700 dark:text-brand-300" aria-hidden="true"/>
                    </span>
                    <div>
                      <h2 id="property-location-heading" className={sectionHeadingClass}>
                        {t("Details.location")}
                      </h2>
                      <p className="mt-2 text-base text-gray-900 md:text-lg dark:text-white">
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
                </section>
              )}

              {/* Key Features Grid */}
              <section aria-labelledby="property-key-features-heading">
                <h2 id="property-key-features-heading" className={`${sectionHeadingClass} mb-4`}>
                  {t("Details.key_features")}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {property.rooms != null && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Home className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{property.rooms}</p>
                      <p className={tileLabelClass}>{t("Details.rooms")}</p>
                    </div>
                  )}
                  {property.bedrooms != null && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Bed className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{property.bedrooms}</p>
                      <p className={tileLabelClass}>{t("Details.bedrooms")}</p>
                    </div>
                  )}
                  {property.bathrooms != null && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Bath className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{property.bathrooms}</p>
                      <p className={tileLabelClass}>{t("Details.bathrooms")}</p>
                    </div>
                  )}
                  {property.sqmt != null && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Maximize className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{property.sqmt.toLocaleString()}</p>
                      <p className={tileLabelClass}>{t("Details.sqm")}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Description */}
              {property.description && (
                <section aria-labelledby="property-about-heading">
                  <h2 id="property-about-heading" className={`${sectionHeadingClass} mb-4`}>
                    {t("Details.about")}
                  </h2>
                  <p className="text-base leading-relaxed whitespace-pre-line text-gray-700 md:text-lg dark:text-gray-300">
                    {property.description}
                  </p>
                </section>
              )}

              {/* Amenities & Features */}
              {activeAmenities.length > 0 && (
                <section aria-labelledby="property-amenities-heading">
                  <h2 id="property-amenities-heading" className={`${sectionHeadingClass} mb-4`}>
                    {pick("Details.amenities")}
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {activeAmenities.map(({ key, Icon }) => (
                      <div
                        key={key}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/40">
                          <Icon
                            className="h-5 w-5 text-brand-700 dark:text-brand-300"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {tAdminLoose(`Fields.${key}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Additional Details */}
              <section aria-labelledby="property-additional-heading">
                <h2 id="property-additional-heading" className={`${sectionHeadingClass} mb-4`}>
                  {t("Details.additional")}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {property.year_built && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Calendar className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{property.year_built}</p>
                      <p className={tileLabelClass}>{t("Facts.year_built")}</p>
                    </div>
                  )}
                  {property.floor != null && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Building className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{property.floor}</p>
                      <p className={tileLabelClass}>{t("Facts.floor")}</p>
                    </div>
                  )}
                  {property.energy_class && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Zap className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>
                        <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-sm font-bold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          {property.energy_class === "a_plus"
                            ? "A+"
                            : String(property.energy_class).toUpperCase()}
                        </span>
                      </p>
                      <p className={tileLabelClass}>{pick("Facts.energy_class")}</p>
                    </div>
                  )}
                  {property.renovation_year != null && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Calendar className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{property.renovation_year}</p>
                      <p className={tileLabelClass}>{pick("Facts.renovation_year")}</p>
                    </div>
                  )}
                  {property.heating_type && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Heater className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{opt("heating_type", property.heating_type)}</p>
                      <p className={tileLabelClass}>{pick("Facts.heating_type")}</p>
                    </div>
                  )}
                  {property.hot_water_type && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Droplets className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>
                        {opt("hot_water_type", property.hot_water_type)}
                      </p>
                      <p className={tileLabelClass}>{pick("Facts.hot_water_type")}</p>
                    </div>
                  )}
                  {property.parking_type && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Car className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{opt("parking_type", property.parking_type)}</p>
                      <p className={tileLabelClass}>{pick("Facts.parking_type")}</p>
                    </div>
                  )}
                  {property.furnishing && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Sofa className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{opt("furnishing", property.furnishing)}</p>
                      <p className={tileLabelClass}>{pick("Facts.furnishing")}</p>
                    </div>
                  )}
                  {property.condition && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Sparkles className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{opt("condition", property.condition)}</p>
                      <p className={tileLabelClass}>{pick("Facts.condition")}</p>
                    </div>
                  )}
                  {property.building_status && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Building2 className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>
                        {opt("building_status", property.building_status)}
                      </p>
                      <p className={tileLabelClass}>{pick("Facts.building_status")}</p>
                    </div>
                  )}
                  {property.project_type && (
                    <div className={tileClass}>
                      <div className={chipClass}>
                        <Briefcase className={chipIconClass} aria-hidden="true"/>
                      </div>
                      <p className={tileValueClass}>{opt("project_type", property.project_type)}</p>
                      <p className={tileLabelClass}>{pick("Facts.project_type")}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Floor Plan */}
              {(property.floor_plan || property.floor_plan_url) && (
                <section aria-labelledby="property-floor-plan-heading">
                  <h2 id="property-floor-plan-heading" className={`${sectionHeadingClass} mb-4`}>
                    {t("Details.floor_plan")}
                  </h2>
                  {property.floor_plan && (
                    <div className="relative aspect-[4/3] max-h-[70vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                      <Image
                        src={property.floor_plan}
                        alt={t("Alts.floor_plan", { title: property.title })}
                        fill
                        loading="lazy"
                        className="object-contain p-4"
                      />
                    </div>
                  )}
                  {property.floor_plan_url && (
                    <a
                      href={property.floor_plan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-900 transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                    >
                      <ExternalLink className="h-5 w-5" aria-hidden="true"/>
                      {pick("Details.floor_plan_link")}
                    </a>
                  )}
                </section>
              )}

              {/* Inclusions */}
              {inclusions.length > 0 && (
                <section aria-labelledby="property-included-heading">
                  <h2 id="property-included-heading" className={`${sectionHeadingClass} mb-4`}>
                    {t("Details.included")}
                  </h2>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500"/>
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:sticky lg:top-24 dark:border-gray-700 dark:bg-gray-800">
                {priceFormatted && (
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {priceFormatted}
                    {property.price_type === "per_sqm" && (
                      <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                        / {pick("Details.per_sqm")}
                      </span>
                    )}
                  </p>
                )}
                <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  {t("Sidebar.title")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t("Sidebar.description")}
                </p>
                <div className="mt-5 space-y-3">
                  <PrimaryButton
                    label={t("Sidebar.whatsapp")}
                    href={whatsappUrl}
                    icon={<MessageCircle className="h-5 w-5" aria-hidden="true"/>}
                    fullWidth
                    className="min-h-[44px] w-full"
                  />
                  <SecondaryButton
                    label={CONTACT_INFO.phone.display}
                    href={CONTACT_INFO.phone.href}
                    icon={<Phone className="h-5 w-5" aria-hidden="true"/>}
                    fullWidth
                    className="min-h-[44px] w-full"
                  />
                  <SecondaryButton
                    label={t("Sidebar.viewing")}
                    href="/contact?subject=viewing"
                    icon={<Calendar className="h-5 w-5" aria-hidden="true"/>}
                    fullWidth
                    className="min-h-[44px] w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
