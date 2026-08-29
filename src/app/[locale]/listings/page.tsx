import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getActiveProperties } from "@/lib/db";
import ListingsContent from "@/components/ListingsContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Listings.PageMeta");

  return {
    title: t("title"),
    description: t("description"),
  };
}

interface ListingsPageProps {
  searchParams: Promise<{
    filter?: string;
    offer?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const resolvedParams = await searchParams;
  const initialFilter = resolvedParams.filter || "all";
  const initialOffer = resolvedParams.offer || "all";

  // Fetch properties via SQLite helper
  const allProperties = getActiveProperties();

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
    />
  );
}
