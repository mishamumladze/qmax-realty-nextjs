import Link from "next/link";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.NotFound.Metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function NotFound() {
  const t = await getTranslations("Pages.NotFound");

  return (
    <section className="section">
      <div className="mx-auto max-w-lg py-20 text-center">
        <div
          className="text-brand-600 dark:text-brand-400 mb-4 text-9xl font-black select-none"
          aria-hidden="true"
        >
          404
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">{t("title")}</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-300">{t("description")}</p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="bg-brand-600 hover:bg-brand-700 rounded-lg px-6 py-3 font-semibold text-white
              transition-colors duration-200"
          >
            {t("go_home")}
          </Link>
          <Link
            href="/listings"
            className="border-brand-600 text-brand-600 hover:bg-brand-50 dark:border-brand-500
              dark:text-brand-400 dark:hover:bg-brand-900/30 rounded-lg border-2 px-6 py-3
              font-semibold transition-colors duration-200"
          >
            {t("browse")}
          </Link>
        </div>
      </div>
    </section>
  );
}
