import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found - QMAX Realty",
  description:
    "The page you are looking for could not be found. Browse our premium real estate listings instead.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-lg mx-auto py-20">
        <div
          className="text-emerald-600 text-9xl font-black mb-4 select-none"
          aria-hidden="true"
        >
          404
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or may have moved. Let's
          get you back on the right path.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Go Home
          </Link>
          <Link
            href="/listings"
            className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    </main>
  );
}