import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllProperties, getAllPropertiesWithLocale } from "@/lib/db";
import type { Property } from "@/types/property";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Admin.Metadata");

  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage() {
  const locale = await getLocale();
  let properties: Property[];
  try {
    properties = getAllPropertiesWithLocale(locale);
  } catch {
    properties = getAllProperties();
  }

  return <AdminDashboard initialProperties={properties}/>;
}
