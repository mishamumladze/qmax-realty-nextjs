import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllProperties } from "@/lib/db";
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
  const properties = await getAllProperties();

  return <AdminDashboard initialProperties={properties} />;
}
