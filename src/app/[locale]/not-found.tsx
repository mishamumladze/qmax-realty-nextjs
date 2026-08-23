import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found - QMAX Realty",
  description:
    "The page you are looking for could not be found. Browse our premium real estate listings instead.",
};

export default function NotFound() {
  return (
    <section className="section">
      <div className="mx-auto max-w-lg py-20 text-center">
        <div
          className="mb-4 text-9xl font-black text-emerald-600 select-none dark:text-emerald-400"
          aria-hidden="true"
        >
          404
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">Page Not Found</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          The page you're looking for doesn't exist or may have moved. Let's get you back on the
          right path.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white
              transition-colors duration-200 hover:bg-emerald-700"
          >
            Go Home
          </Link>
          <Link
            href="/listings"
            className="rounded-lg border-2 border-emerald-600 px-6 py-3 font-semibold
              text-emerald-600 transition-colors duration-200 hover:bg-emerald-50
              dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
