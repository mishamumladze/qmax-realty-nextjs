import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { verifyToken } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Admin.Login.Metadata");

  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminLoginPage() {
  const store = await cookies();
  const token = store.get("admin_token")?.value;

  if (token && (await verifyToken(token))) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <LoginForm />
    </main>
  );
}
