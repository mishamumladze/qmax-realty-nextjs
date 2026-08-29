import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "de", "tr", "ru", "pl"],
  defaultLocale: "en",
  localePrefix: "as-needed", // English will be / and German will be /de
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
