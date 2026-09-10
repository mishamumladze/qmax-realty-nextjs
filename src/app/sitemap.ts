import type { MetadataRoute } from "next";
import { getActiveProperties } from "@/lib/db";
import { routing } from "@/i18n/routing";

const BASE = "https://qmax-realty.vercel.app";

function localized(path: string, locale: string): string {
  if (locale === "en") return `${BASE}${path}`;
  return `${BASE}/${locale}${path === "/" ? "" : path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/listings", "/about", "/contact", "/socials"];
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: localized(route, locale),
      lastModified: now,
    }))
  );

  let propertyEntries: MetadataRoute.Sitemap = [];
  try {
    const properties = getActiveProperties();
    propertyEntries = routing.locales.flatMap((locale) =>
      properties.map((p) => ({
        url: localized(`/properties/details/${p.id}`, locale),
        lastModified: now,
      }))
    );
  } catch {
    propertyEntries = [];
  }

  return [...staticEntries, ...propertyEntries];
}
