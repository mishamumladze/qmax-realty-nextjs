"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const LANGUAGES = {
  en: { name: "English", flag: "🇬🇧" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  pl: { name: "Polski", flag: "🇵🇱" },
  ru: { name: "Русский", flag: "🇷🇺" },
  tr: { name: "Türkçe", flag: "🇹🇷" },
} as const;

type Language = keyof typeof LANGUAGES;

export function LanguageSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const rawLocale = useLocale(); // Get current locale directly from next-intl
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Safely fallback to "en" if rawLocale isn't in LANGUAGES
  const currentLang: Language = rawLocale in LANGUAGES ? (rawLocale as Language) : "en";

  // Safely grab current language object with fallback
  const activeLangConfig = LANGUAGES[currentLang] || LANGUAGES.en;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (lang: Language) => {
    // Remove existing language prefix if present, then prepend new locale
    const pathWithoutLang = pathname.replace(/^\/(en|de|pl|ru|tr)/, "");
    const newPath = `/${lang}${pathWithoutLang || ""}`;
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3
          py-2 transition-colors dark:hover:bg-gray-700"
        aria-label="Select language"
      >
        <Globe size={18} />
        <span className="text-sm font-medium">
          {activeLangConfig.flag} {currentLang.toUpperCase()}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-48 rounded-lg border shadow-lg
            dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-300"
        >
          <div className="p-2">
            {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
              const config = LANGUAGES[lang];
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-3
                  text-left transition-colors ${
                    currentLang === lang
                      ? "dark:bg-brand-900 font-semibold"
                      : "hover:bg-brand-950 transition-colors dark:text-gray-300"
                  }`}
                >
                  <span className="text-lg">{config.flag}</span>
                  <span className="flex-1">{config.name}</span>
                  {currentLang === lang && <span className="text-brand-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
