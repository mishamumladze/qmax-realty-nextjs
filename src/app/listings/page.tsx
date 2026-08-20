import { Metadata } from "next";
import { getActiveProperties } from "@/lib/db";
import ListingsContent from "@/components/ListingsContent";

export const metadata: Metadata = {
  title: "Properties for Sale & Rent - QMAX Realty",
  description:
    "Browse all properties for sale and rent. Apartments, houses, commercial real estate and more.",
};

interface ListingsPageProps {
  searchParams: Promise<{
    filter?: string;
    offer?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const resolvedParams = await searchParams;
  const initialFilter = resolvedParams.filter || "all";

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
    />
  );
}