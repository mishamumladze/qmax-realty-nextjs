"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
] as const;

export default function LanguageSelector() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const segments = pathname?.split("/").filter(Boolean) || [];
  const currentLocale = LANGUAGES.some((lang) => lang.code === segments[0]) ? segments[0] : "en";

  const selectedLanguage = LANGUAGES.find((l) => l.code === currentLocale) || LANGUAGES[0];

  // Helper to dynamically build the localized URL for each link
  const getLocalePath = (nextLocale: string) => {
    if (!pathname) return nextLocale === "en" ? "/" : `/${nextLocale}`;

    const pathSegments = pathname.split("/").filter(Boolean);
    const hasLocalePrefix = LANGUAGES.some((lang) => lang.code === pathSegments[0]);

    // Remove the current locale prefix if it exists
    if (hasLocalePrefix) {
      pathSegments.shift();
    }

    // Build the new path
    if (nextLocale === "en") {
      // English doesn't get a prefix
      return pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "/";
    } else {
      // Other languages get a prefix
      return `/${nextLocale}${pathSegments.length > 0 ? "/" + pathSegments.join("/") : ""}`;
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border-brand-300 hover:border-brand-600 focus:ring-brand-500
          dark:border-brand-800 dark:hover:border-brand-400 inline-flex min-h-11 w-full items-center
          justify-between gap-x-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium
          text-gray-700 shadow-sm transition-colors focus:ring-2 focus:ring-offset-2
          focus:outline-none dark:bg-gray-900 dark:text-gray-200"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span>{selectedLanguage.flag}</span>
          <span>{selectedLanguage.label}</span>
        </span>
        <svg
          className={`text-brand-600 dark:text-brand-400 h-4 w-4 transition-transform duration-200
            ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`ring-opacity-5 border-brand-200 dark:border-brand-800 /* Mobile-first: Open UP
          */ /* Desktop (sm and up): Open DOWN */ absolute right-0 bottom-full z-50 mb-2 w-40
          rounded-lg border bg-white py-1 shadow-lg ring-1 ring-black focus:outline-none md:top-full
          md:bottom-auto md:mt-2 md:mb-0 dark:bg-gray-900`}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === currentLocale;
            return (
              <Link
                key={lang.code}
                href={getLocalePath(lang.code)}
                onClick={() => setIsOpen(false)}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm
                transition-colors ${
                  isActive
                    ? "bg-brand-600 dark:bg-brand-500 font-semibold text-white dark:text-gray-900"
                    : `hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/40
                      dark:hover:text-brand-400 text-gray-700 dark:text-gray-200`
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isActive && (
                  <span className="bg-brand-600 dark:bg-brand-400 h-1.5 w-1.5 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
