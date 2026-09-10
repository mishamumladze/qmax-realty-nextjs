import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getActiveProperties } from "@/lib/db";
import ListingsContent from "@/components/ListingsContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages.Listings.PageMeta" });
  const canonical =
    locale === "en"
      ? "https://qmax-realty.vercel.app/listings"
      : `https://qmax-realty.vercel.app/${locale}/listings`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          l === "en"
            ? "https://qmax-realty.vercel.app/listings"
            : `https://qmax-realty.vercel.app/${l}/listings`,
        ])
      ),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonical,
      images: [
        {
          url: "https://qmax-realty.vercel.app/img/og-image.webp",
          width: 1200,
          height: 630,
          alt: t("title"),
          type: "image/webp",
        },
      ],
    },
  };
}

interface ListingsPageProps {
  searchParams: Promise<{
    filter?: string;
    offer?: string;
    q?: string;
    country?: string;
    city?: string;
    beds?: string;
    baths?: string;
    min?: string;
    max?: string;
    sort?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const resolvedParams = await searchParams;
  const initialFilter = resolvedParams.filter || "all";
  const initialOffer = resolvedParams.offer || "all";
  const initialSearch = resolvedParams.q || "";
  const initialCountry = resolvedParams.country || "";
  const initialCity = resolvedParams.city || "";
  const initialBeds = resolvedParams.beds || "";
  const initialBaths = resolvedParams.baths || "";
  const initialMin = resolvedParams.min || "";
  const initialMax = resolvedParams.max || "";
  const initialSort = resolvedParams.sort || "";
  const locale = await getLocale();

  // Fetch properties via SQLite helper
  const allProperties = getActiveProperties(locale);

  // Compute dynamic lists for unique countries & cities
  const geoCountriesSet = new Set<string>();
  const geoCitiesSet = new Set<string>();

  allProperties.forEach((p) => {
    if (p.country) geoCountriesSet.add(p.country);
    if (p.city) geoCitiesSet.add(p.city);
  });

  const geoCountries = Array.from(geoCountriesSet).sort();
  const geoCities = Array.from(geoCitiesSet).sort();

  return (
    <ListingsContent
      initialProperties={allProperties}
      geoCountries={geoCountries}
      geoCities={geoCities}
      initialFilter={initialFilter}
      initialOffer={initialOffer}
      initialSearch={initialSearch}
      initialCountry={initialCountry}
      initialCity={initialCity}
      initialBeds={initialBeds}
      initialBaths={initialBaths}
      initialMin={initialMin}
      initialMax={initialMax}
      initialSort={initialSort}
    />
  );
}
