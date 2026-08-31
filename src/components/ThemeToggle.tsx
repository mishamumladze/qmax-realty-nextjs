"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ThemeToggle() {
  const t = useTranslations("Components.ThemeToggle");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Check localStorage or system preference on mount
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t("Aria.to_light") : t("Aria.to_dark")}
      className="fixed right-4 bottom-20 z-50 min-h-11 min-w-11 cursor-pointer rounded-full
        bg-gray-200 p-3 text-gray-700 shadow-md transition-all duration-200 hover:bg-gray-300
        md:right-10 md:bottom-10 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
    >
      {dark ? (
        <Sun className="h-6 w-6 md:h-10 md:w-10" />
      ) : (
        <Moon className="h-6 w-6 md:h-10 md:w-10" />
      )}
    </button>
  );
}
